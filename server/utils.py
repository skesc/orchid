from typing import List, Optional, Tuple, Union

from werkzeug.datastructures import FileStorage


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
