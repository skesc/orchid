import json
import os
import time

from config import Config
from extensions import db, limiter
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from models import Bookmark, MarketplaceItem
from s3 import delete_file, upload_file
from utils import allowed_file, sanitize_marketplace_input, validate_marketplace_item
from werkzeug.utils import secure_filename

marketplace_bp = Blueprint("marketplace", __name__)


@marketplace_bp.route("/api/marketplace/items", methods=["GET"])
def get_marketplace_items():
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(100, request.args.get("per_page", 9, type=int))
    category = request.args.get("category")
    author_id = request.args.get("author_id")
    query = MarketplaceItem.query.filter_by(is_private=False)
    if category:
        query = query.filter(MarketplaceItem.categories.contains([category]))
    if author_id:
        query = query.filter_by(author_id=int(author_id))

    query = query.order_by(MarketplaceItem.created_at.desc())
    paginated_items = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,  # Prevents 404 if page is out of range
    )

    return jsonify(
        {
            "items": [item.to_dict() for item in paginated_items.items],
            "total_items": paginated_items.total,
            "total_pages": paginated_items.pages,
            "current_page": page,
            "per_page": per_page,
            "has_next": paginated_items.has_next,
            "has_prev": paginated_items.has_prev,
        }
    )


@marketplace_bp.route("/api/marketplace/items", methods=["POST"])
@limiter.limit("5 per minute")
@login_required
def create_marketplace_item():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    try:
        item_data = {
            "name": request.form.get("name"),
            "description": request.form.get("description", ""),
            "categories": json.loads(request.form.get("categories", "[]")),
            "is_private": request.form.get("is_private", "false"),
            "image": file,
        }

        sanitized_data = sanitize_marketplace_input(item_data)

        is_valid, error_message = validate_marketplace_item(
            name=sanitized_data.get("name"),
            description=sanitized_data.get("description"),
            image=file,
            categories=sanitized_data.get("categories"),
            is_private=sanitized_data.get("is_private"),
        )

        if not is_valid:
            return jsonify({"error": error_message}), 400

        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        filename = f"{timestamp}_{filename}"

        try:
            relative_path = upload_file(file, "marketplace", filename)
        except Exception as e:
            return jsonify({"error": f"Failed to upload file: {str(e)}"}), 500

        new_item = MarketplaceItem(
            name=sanitized_data["name"],
            description=sanitized_data["description"],
            image_path=relative_path,
            categories=sanitized_data["categories"],
            is_private=sanitized_data["is_private"],
            author_id=current_user.id,
        )

        db.session.add(new_item)
        db.session.commit()

        return jsonify(new_item.to_dict()), 201

    except json.JSONDecodeError:
        return jsonify({"error": "Invalid categories format"}), 400
    except Exception as e:
        # If we uploaded the file but failed to create the database entry,
        # clean up the uploaded file
        if "relative_path" in locals():
            delete_file(relative_path)
        return jsonify({"error": "Internal server error"}), 500


@marketplace_bp.route("/api/marketplace/items/<int:item_id>", methods=["PUT"])
@login_required
@limiter.limit("5 per minute")
def update_marketplace_item(item_id):
    item = MarketplaceItem.query.get_or_404(item_id)

    if item.author_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        sanitized_data = sanitize_marketplace_input(data)

        is_valid, error_message = validate_marketplace_item(
            name=sanitized_data.get("name"),
            description=sanitized_data.get("description"),
            categories=sanitized_data.get("categories"),
            is_private=sanitized_data.get("is_private"),
            is_update=True,
        )

        if not is_valid:
            return jsonify({"error": error_message}), 400

        if "name" in sanitized_data:
            item.name = sanitized_data["name"]
        if "description" in sanitized_data:
            item.description = sanitized_data["description"]
        if "categories" in sanitized_data:
            item.categories = sanitized_data["categories"]
        if "is_private" in sanitized_data:
            item.is_private = sanitized_data["is_private"]

        db.session.commit()
        return jsonify(item.to_dict())

    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON data"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500


@marketplace_bp.route("/api/marketplace/items/<int:item_id>", methods=["DELETE"])
@login_required
@limiter.limit("5 per minute")
def delete_marketplace_item(item_id):
    item = MarketplaceItem.query.get_or_404(item_id)

    if item.author_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        if item.image_path.startswith("/uploads/"):
            file_path = os.path.join(
                Config.MARKETPLACE_UPLOAD_FOLDER, os.path.basename(item.image_path)
            )
            if os.path.exists(file_path):
                os.remove(file_path)

        db.session.delete(item)
        db.session.commit()
        return "", 204
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


@marketplace_bp.route("/api/marketplace/items/<int:item_id>", methods=["GET"])
def get_marketplace_item(item_id):
    item = MarketplaceItem.query.get_or_404(item_id)

    if item.is_private and (
        not current_user.is_authenticated or item.author_id != current_user.id
    ):
        return jsonify({"error": "Not found"}), 404

    return jsonify(item.to_dict())


@marketplace_bp.route("/api/marketplace/bookmarks", methods=["GET"])
@login_required
def get_bookmarks():
    bookmarks = Bookmark.query.filter_by(user_id=current_user.id).all()
    return jsonify({"bookmarks": [bookmark.item.to_dict() for bookmark in bookmarks]})


@marketplace_bp.route("/api/marketplace/bookmarks/<int:item_id>", methods=["POST"])
@login_required
def add_bookmark(item_id):
    existing = Bookmark.query.filter_by(
        user_id=current_user.id, item_id=item_id
    ).first()
    if existing:
        return jsonify({"message": "Already bookmarked"}), 400

    bookmark = Bookmark(user_id=current_user.id, item_id=item_id)
    db.session.add(bookmark)
    db.session.commit()

    return jsonify({"message": "Bookmarked successfully"}), 201


@marketplace_bp.route("/api/marketplace/bookmarks/<int:item_id>", methods=["DELETE"])
@login_required
def remove_bookmark(item_id):
    bookmark = Bookmark.query.filter_by(
        user_id=current_user.id, item_id=item_id
    ).first_or_404()

    db.session.delete(bookmark)
    db.session.commit()

    return "", 204
