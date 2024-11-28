import json
import os
import re
import time
from datetime import datetime, timedelta
from io import BytesIO
from os import environ

import requests
from config import Config
from dotenv import load_dotenv
from extensions import db, login_manager
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_login import current_user, login_required
from models import MarketplaceItem
from rembg import remove
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from werkzeug.utils import secure_filename

load_dotenv()

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = "auth.login"

from auth.routes import auth_bp

app.register_blueprint(auth_bp)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized", "message": "Please log in"}), 401


CORS(
    app,
    resources={
        r"/*": {
            "origins": [environ.get("FRONTEND_URL")],
            "supports_credentials": True,
        }
    },
)


def _setup_chrome_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--log-level=3")
    options.add_experimental_option("excludeSwitches", ["enable-logging"])
    options.set_capability("browserVersion", "117")
    return webdriver.Chrome(options=options)


@app.route("/uploads/<path:filename>")
def serve_uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/api/pfp/x/<username>")
def fetch_x_profile_picture(username):
    driver = _setup_chrome_driver()
    # this is the worst thing ever i'm so sorry
    try:
        driver.get(f"https://x.com/{username}/photo")
        time.sleep(2)
        pattern = r"https://pbs\.twimg\.com/profile_images/.*?\.jpg"
        match = re.search(pattern, driver.page_source)
        if not match:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Could not retrieve profile picture",
                        "url": None,
                    }
                ),
                404,
            )
        return jsonify(
            {"success": True, "message": "Profile picture found", "url": match.group(0)}
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "url": None}), 500
    finally:
        driver.quit()


@app.route("/api/pfp/github/<username>")
def fetch_github_profile_picture(username):
    try:
        response = requests.get(
            f"https://api.github.com/users/{username}",
            headers={"Accept": "application/vnd.github.v3+json"},
        )
        if response.status_code == 200:
            return jsonify(
                {
                    "success": True,
                    "message": "Profile picture found",
                    "url": response.json()["avatar_url"],
                }
            )
        return (
            jsonify({"success": False, "message": "User not found", "url": None}),
            404,
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "url": None}), 500


@app.route("/api/marketplace/items", methods=["GET"])
def get_marketplace_items():
    category = request.args.get("category")
    author_id = request.args.get("author_id")

    query = MarketplaceItem.query.filter_by(is_private=False)

    if category:
        query = query.filter(MarketplaceItem.categories.contains([category]))
    if author_id:
        query = query.filter_by(author_id=int(author_id))

    items = query.all()
    return jsonify([item.to_dict() for item in items])


@app.route("/api/marketplace/items", methods=["POST"])
@login_required
def create_marketplace_item():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    timestamp = int(time.time())
    filename = f"{timestamp}_{filename}"
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    relative_path = f"/uploads/{filename}"

    try:
        new_item = MarketplaceItem(
            name=request.form["name"],
            description=request.form.get("description", ""),
            image_path=relative_path,
            categories=json.loads(request.form.get("categories", "[]")),
            is_private=request.form.get("is_private", "false").lower() == "true",
            author_id=current_user.id,
        )

        db.session.add(new_item)
        db.session.commit()

        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/items/<int:item_id>", methods=["PUT"])
@login_required
def update_marketplace_item(item_id):
    item = MarketplaceItem.query.get_or_404(item_id)

    if item.author_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    if "name" in data:
        item.name = data["name"]
    if "description" in data:
        item.description = data["description"]
    if "price" in data:
        item.price = float(data["price"])
    if "image_path" in data:
        item.image_path = data["image_path"]
    if "categories" in data:
        item.categories = data["categories"]
    if "is_private" in data:
        item.is_private = data["is_private"]

    db.session.commit()
    return jsonify(item.to_dict())


@app.route("/api/marketplace/items/<int:item_id>", methods=["DELETE"])
@login_required
def delete_marketplace_item(item_id):
    item = MarketplaceItem.query.get_or_404(item_id)

    if item.author_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        if item.image_path.startswith("/uploads/"):
            file_path = os.path.join(
                app.config["UPLOAD_FOLDER"], os.path.basename(item.image_path)
            )
            if os.path.exists(file_path):
                os.remove(file_path)

        db.session.delete(item)
        db.session.commit()
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/items/<int:item_id>", methods=["GET"])
def get_marketplace_item(item_id):
    item = MarketplaceItem.query.get_or_404(item_id)

    if item.is_private and (
        not current_user.is_authenticated or item.author_id != current_user.id
    ):
        return jsonify({"error": "Not found"}), 404

    return jsonify(item.to_dict())


def cleanup_old_files(directory, minutes=10):
    current_time = datetime.now()
    for filename in os.listdir(directory):
        if filename.startswith("nobg_"):
            file_path = os.path.join(directory, filename)
            file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
            if current_time - file_modified > timedelta(minutes=minutes):
                try:
                    os.remove(file_path)
                except OSError:
                    pass


@app.route("/api/remove-background", methods=["POST"])
def remove_background():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    try:
        cleanup_old_files(app.config["UPLOAD_FOLDER"])

        input_image = file.read()

        output_image = remove(input_image)

        buffer = BytesIO()
        buffer.write(output_image)
        buffer.seek(0)

        timestamp = int(time.time())
        filename = secure_filename(file.filename)
        filename = f"nobg_{timestamp}_{filename}"
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

        with open(file_path, "wb") as f:
            f.write(buffer.getvalue())

        relative_path = f"http://{request.host}/uploads/{filename}"

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


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
