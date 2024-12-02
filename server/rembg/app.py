from io import BytesIO

import numpy as np
from flask import Flask, jsonify, request
from PIL import Image
from rembg import remove

app = Flask(__name__)


@app.route("/remove", methods=["POST"])
def remove_background():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

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

        return buffer.getvalue(), 200, {"Content-Type": "image/png"}

    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
