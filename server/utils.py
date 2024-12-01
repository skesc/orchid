import os
from io import BytesIO
from typing import List, Optional, Tuple, Union

from config import Config
from flask import jsonify
from PIL import Image
from werkzeug.datastructures import FileStorage


def compress_image(input_file, output_path=None, max_size_kb=500, min_quality=50):
    if isinstance(input_file, str):
        img = Image.open(input_file)
    else:
        img = Image.open(input_file)

    if img.mode in ("RGBA", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background

    max_dimension = 1500
    orig_width, orig_height = img.size

    scale = min(1.0, max_dimension / max(orig_width, orig_height))
    new_width = int(orig_width * scale)
    new_height = int(orig_height * scale)

    if scale < 1.0:
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    quality_low = min_quality
    quality_high = 95
    target_size = max_size_kb * 1024
    best_quality = quality_high
    best_bytes = None

    while quality_low <= quality_high:
        current_quality = (quality_low + quality_high) // 2
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=current_quality, optimize=True)
        current_size = buffer.tell()

        if current_size <= target_size:
            best_quality = current_quality
            best_bytes = buffer.getvalue()
            quality_low = current_quality + 1
        else:
            quality_high = current_quality - 1

    if output_path:
        with open(output_path, "wb") as f:
            f.write(best_bytes)
        file_path = output_path
    else:
        return best_bytes, new_width, new_height, len(best_bytes) / 1024

    return file_path, new_width, new_height, os.path.getsize(file_path) / 1024


def unauthorized():
    return jsonify({"error": "Unauthorized", "message": "Please log in"}), 401


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )


def validate_marketplace_item(
    name: Optional[str] = None,
    description: Optional[str] = None,
    image: Optional[FileStorage] = None,
    categories: Optional[List[str]] = None,
    is_private: Optional[bool] = None,
    is_update: bool = False,
) -> Tuple[bool, Union[str, None]]:
    if name is not None:
        if not isinstance(name, str):
            return False, "Name must be a string"
        if len(name.strip()) < 3:
            return False, "Name must be at least 3 characters long"
        if len(name) > 120:
            return False, "Name cannot exceed 120 characters"

    if description is not None:
        if not isinstance(description, str):
            return False, "Description must be a string"
        if len(description) > 1000:
            return False, "Description cannot exceed 1000 characters"

    if not is_update and not image:
        return False, "Image is required"

    if image and image.content_length > 10 * 1024 * 1024:
        return False, "Image size cannot exceed 10MB"

    if categories is not None:
        if not isinstance(categories, list):
            return False, "Categories must be a list"
        if len(categories) > 10:
            return False, "Cannot have more than 10 categories"
        for category in categories:
            if not isinstance(category, str):
                return False, "Categories must be strings"
            category = category.strip()
            if len(category) < 2:
                return False, "Category names must be at least 2 characters long"
            if len(category) > 30:
                return False, "Category names cannot exceed 30 characters"
            if not category:
                return False, "Category names cannot be empty"

    return True, None


def sanitize_marketplace_input(data: dict) -> dict:
    sanitized = {}

    if "name" in data and data["name"]:
        sanitized["name"] = str(data["name"]).strip()

    if "description" in data and data["description"]:
        sanitized["description"] = str(data["description"]).strip()

    if "categories" in data and isinstance(data["categories"], list):
        sanitized["categories"] = [
            str(cat).strip() for cat in data["categories"] if str(cat).strip()
        ]

    if "is_private" in data:
        if isinstance(data["is_private"], str):
            sanitized["is_private"] = data["is_private"].lower() == "true"
        else:
            sanitized["is_private"] = bool(data["is_private"])

    return sanitized
