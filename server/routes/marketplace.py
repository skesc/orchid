import json
import os
import time

from config import Config
from extensions import db
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from models import MarketplaceItem
from utils import allowed_file, sanitize_marketplace_input, validate_marketplace_item
from werkzeug.utils import secure_filename
from PIL import Image

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
        error_out=False  # Prevents 404 if page is out of range
    )
    
    return jsonify({
        "items": [item.to_dict() for item in paginated_items.items],
        "total_items": paginated_items.total,
        "total_pages": paginated_items.pages,
        "current_page": page,
        "per_page": per_page,
        "has_next": paginated_items.has_next,
        "has_prev": paginated_items.has_prev
    })

def compress_image(input_path, output_path, quality=30, width=250):
    with Image.open(input_path) as img:
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGBA', img.size, (255, 255, 255, 0))
            background.paste(img, (0, 0), img)
            img = background

        aspect_ratio = img.height / img.width
        height = int(width * aspect_ratio)

        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        img.save(output_path, optimize=True, quality=quality)
    
    return output_path

@marketplace_bp.route("/api/marketplace/items", methods=["POST"])
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
        file_path = os.path.join(Config.MARKETPLACE_UPLOAD_FOLDER, filename)
        compressed_path = os.path.join(Config.MARKETPLACE_COMPRESSED, filename)

        file.save(file_path)
        compress_image(file_path, compressed_path)

        relative_path = f"/uploads/marketplace/{filename}"
        relative_comp_path = f"/uploads/marketplace_compressed/{filename}"

        new_item = MarketplaceItem(
            name=sanitized_data["name"],
            description=sanitized_data["description"],
            image_path=relative_path,
            compressed_path=relative_comp_path,
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
        if "file_path" in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"error": str(e)}), 500


@marketplace_bp.route("/api/marketplace/items/<int:item_id>", methods=["PUT"])
@login_required
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
        return jsonify({"error": str(e)}), 500


@marketplace_bp.route("/api/marketplace/items/<int:item_id>", methods=["DELETE"])
@login_required
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
        return jsonify({"error": str(e)}), 500


@marketplace_bp.route("/api/marketplace/items/<int:item_id>", methods=["GET"])
def get_marketplace_item(item_id):
    item = MarketplaceItem.query.get_or_404(item_id)

    if item.is_private and (
        not current_user.is_authenticated or item.author_id != current_user.id
    ):
        return jsonify({"error": "Not found"}), 404

    return jsonify(item.to_dict())
