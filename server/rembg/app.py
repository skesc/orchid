from io import BytesIO
from os import getenv

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from PIL import Image
from rembg import new_session, remove

load_dotenv()

app = Flask(__name__)


@app.route("/remove", methods=["POST"])
def remove_background():
    # load model from .env
    session = new_session(getenv("MODEL_NAME"))
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        input_image = file.read()
        output_image = remove(input_image, session=session)

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


@app.route("/")
def index():
    return jsonify({"message": "healthy!"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
