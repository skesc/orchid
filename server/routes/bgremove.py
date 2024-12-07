import os
import time
from io import BytesIO

import requests
from extensions import limiter
from flask import Blueprint, jsonify, request
from s3 import upload_file
from utils import allowed_file
from werkzeug.utils import secure_filename

bgremove_bp = Blueprint("bgremove", __name__)


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
        timestamp = int(time.time())
        filename = secure_filename(file.filename)
        filename = f"nobg_{timestamp}_{filename}"

        try:
            response = requests.post(
                "http://rembg:5001/remove",  # docker internal service
                files={"image": file},
                params={"crop": request.args.get("crop", "")},
                timeout=15,  # 15 second timeout
            )
            response.raise_for_status()
        except (requests.ConnectionError, requests.Timeout):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Background removal service is currently unavailable. Please try again in a few minutes.",
                    }
                ),
                503,
            )
        except requests.RequestException as e:
            return jsonify({"success": False, "message": str(e)}), 500

        # Create a file-like object from the response content
        file_obj = BytesIO(response.content)

        try:
            relative_path = upload_file(file_obj, "nobg", filename)
        except Exception as e:
            return (
                jsonify(
                    {"success": False, "message": f"Failed to upload file: {str(e)}"}
                ),
                500,
            )

        return jsonify(
            {
                "success": True,
                "message": "Background removed successfully",
                "image_path": relative_path,
                "expires_in": "10 minutes",
            }
        )

    except Exception as e:
        return (
            jsonify({"success": False, "message": f"Error processing image: {str(e)}"}),
            500,
        )
