import os
import time
from io import BytesIO

from config import Config
from flask import Blueprint, jsonify, request
from PIL import Image
from rembg import remove
from utils import allowed_file
from werkzeug.utils import secure_filename

bgremove_bp = Blueprint("bgremove", __name__)


@bgremove_bp.route("/api/remove-background", methods=["POST"])
def remove_background():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    try:
        input_image = file.read()
        output_image = remove(input_image)

        buffer = BytesIO()
        buffer.write(output_image)
        buffer.seek(0)

        should_crop = request.args.get("crop", "").lower() == "true"

        if should_crop:
            img = Image.open(buffer).convert("RGBA")
            alpha = img.getchannel("A")
            bbox = alpha.getbbox()

            if bbox:
                img = img.crop(bbox)

            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

        timestamp = int(time.time())
        filename = secure_filename(file.filename)
        filename = f"nobg_{timestamp}_{filename}"
        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)

        with open(file_path, "wb") as f:
            f.write(buffer.getvalue())

        relative_path = f"/uploads/{filename}"

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
