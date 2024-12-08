import json

from extensions import db, limiter
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from models import Bookmark, MarketplaceItem
from s3 import delete_file, upload_file
from utils import allowed_file, sanitize_marketplace_input, validate_marketplace_item

marketplace_bp = Blueprint("marketplace", __name__)


@marketplace_bp.route("/api/marketplace/items", methods=["GET"])
def get_marketplace_items():
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(100, request.args.get("per_page", 9, type=int))
    category = request.args.get("category")
    author_uuid = request.args.get("author_uuid")

    query = MarketplaceItem.query.filter_by(is_private=False)
    if category:
        query = query.filter(MarketplaceItem.categories.contains([category]))
    if author_uuid:
        query = query.filter_by(author_uuid=author_uuid)

    query = query.order_by(MarketplaceItem.created_at.desc())
    paginated_items = query.paginate(page=page, per_page=per_page, error_out=False)

    items = [
        {
            "uuid": item.uuid,
            "name": item.name,
            "description": item.description,
            "image_path": item.image_path,
            "categories": item.categories,
            "is_private": item.is_private,
            "created_at": item.created_at.isoformat(),
            "author": {"name": item.author.name, "uuid": item.author.uuid},
        }
        for item in paginated_items.items
    ]

    return jsonify({"items": items, "has_next": paginated_items.has_next})


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

        new_item = MarketplaceItem(
            name=sanitized_data["name"],
            description=sanitized_data["description"],
            categories=sanitized_data["categories"],
            is_private=sanitized_data["is_private"],
            author_uuid=current_user.uuid,
        )

        db.session.add(new_item)
        db.session.commit()

        try:
            upload_file(file, "marketplace", new_item.uuid)
            return jsonify(new_item.to_dict()), 201

        except Exception as e:
            db.session.delete(new_item)
            db.session.commit()
            return jsonify({"error": f"Failed to upload file: {str(e)}"}), 500

    except json.JSONDecodeError:
        return jsonify({"error": "Invalid categories format"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500


@marketplace_bp.route("/api/marketplace/items/<string:item_uuid>", methods=["DELETE"])
@login_required
@limiter.limit("5 per minute")
def delete_marketplace_item(item_uuid):
    item = MarketplaceItem.query.filter_by(uuid=item_uuid).first_or_404()

    if item.author_uuid != current_user.uuid:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        if item.uuid:
            delete_file(item.image_path)

        db.session.delete(item)
        db.session.commit()
        return "", 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@marketplace_bp.route("/api/marketplace/items/<string:item_uuid>", methods=["PUT"])
@login_required
@limiter.limit("5 per minute")
def update_marketplace_item(item_uuid):
    item = MarketplaceItem.query.filter_by(uuid=item_uuid).first_or_404()

    if item.author_uuid != current_user.uuid:
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


@marketplace_bp.route("/api/marketplace/items/<string:item_uuid>", methods=["GET"])
def get_marketplace_item(item_uuid):
    item = MarketplaceItem.query.filter_by(uuid=item_uuid).first_or_404()

    if item.is_private and (
        not current_user.is_authenticated or item.author_uuid != current_user.uuid
    ):
        return jsonify({"error": "Not found"}), 404

    return jsonify(item.to_dict())


@marketplace_bp.route("/api/marketplace/bookmarks", methods=["GET"])
@login_required
def get_bookmarks():
    bookmarks = Bookmark.query.filter_by(user_uuid=current_user.uuid).all()
    return jsonify({"bookmarks": [bookmark.item.to_dict() for bookmark in bookmarks]})


@marketplace_bp.route("/api/marketplace/bookmarks/<string:item_uuid>", methods=["POST"])
@login_required
def add_bookmark(item_uuid):
    item = MarketplaceItem.query.filter_by(uuid=item_uuid).first_or_404()

    existing = Bookmark.query.filter_by(
        user_uuid=current_user.uuid, item_uuid=item.uuid
    ).first()
    if existing:
        return jsonify({"message": "Already bookmarked"}), 400

    bookmark = Bookmark(user_uuid=current_user.uuid, item_uuid=item.uuid)
    db.session.add(bookmark)
    db.session.commit()

    return jsonify({"message": "Bookmarked successfully"}), 201


@marketplace_bp.route(
    "/api/marketplace/bookmarks/<string:item_uuid>", methods=["DELETE"]
)
@login_required
def remove_bookmark(item_uuid):
    bookmark = Bookmark.query.filter_by(
        user_uuid=current_user.uuid, item_uuid=item_uuid
    ).first_or_404()

    db.session.delete(bookmark)
    db.session.commit()

    return "", 204
