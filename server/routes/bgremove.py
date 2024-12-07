import time
import uuid
from io import BytesIO
from pathlib import Path

import requests
from extensions import limiter
from flask import Blueprint, jsonify, request
from s3 import upload_file
from utils import allowed_file

bgremove_bp = Blueprint("bgremove", __name__)


def generate_filename(original_filename):
    timestamp = int(time.time())  # for cleanup purposes
    file_extension = Path(original_filename).suffix
    return f"{timestamp}_{uuid.uuid4()}{file_extension}"


@bgremove_bp.route("/api/remove-background", methods=["POST"])
@limiter.limit("1 per minute")
def remove_background():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    try:
        unique_filename = generate_filename(file.filename)

        try:
            response = requests.post(
                "http://rembg:5001/remove",
                files={"image": file},
                params={"crop": request.args.get("crop", "")},
                timeout=15,
            )
            response.raise_for_status()
        except (requests.ConnectionError, requests.Timeout):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Background removal service unavailable",
                    }
                ),
                503,
            )
        except requests.RequestException as e:
            return jsonify({"success": False, "message": str(e)}), 500

        file_obj = BytesIO(response.content)
        relative_path = upload_file(file_obj, "nobg", unique_filename)

        return jsonify(
            {
                "success": True,
                "image_path": relative_path,
                "expires_in": "10 minutes",
            }
        )

    except Exception as e:
        return (
            jsonify({"success": False, "message": f"Error processing image: {str(e)}"}),
            500,
        )
