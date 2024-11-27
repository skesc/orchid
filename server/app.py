import os
import re
import time
from os import environ

import requests
from config import Config
from dotenv import load_dotenv
from extensions import db, login_manager
from flask import Flask, jsonify
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

load_dotenv()

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = "auth.login"

from auth.routes import auth_bp

app.register_blueprint(auth_bp)


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


@app.route("/api/pfp/x/<username>")
def fetch_x_profile_picture(username):
    driver = _setup_chrome_driver()
    # this is the worst thing ever i'm so sorry
    try:
        driver.get(f"https://x.com/{username}/photo")
        time.sleep(1.5)
        pattern = r"https://pbs\.twimg\.com/profile_images/.*?\.jpg"
        match = re.search(pattern, driver.page_source)
        if not match:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Profile picture not found",
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


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
