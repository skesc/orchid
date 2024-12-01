import re
import time

import requests
from extensions import limiter
from flask import Blueprint, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

pfp_bp = Blueprint("pfp", __name__)


def _setup_chrome_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument("--log-level=3")
    options.add_argument("--disable-dev-shm-usage")
    options.add_experimental_option("excludeSwitches", ["enable-logging"])
    options.add_experimental_option("useAutomationExtension", False)
    options.set_capability("browserVersion", "117")
    return webdriver.Chrome(options=options)


@pfp_bp.route("/api/pfp/x/<username>")
@limiter.limit("1 per minute")
def fetch_x_profile_picture(username):
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return (
            jsonify({"success": False, "message": "Invalid username", "url": None}),
            400,
        )

    driver = _setup_chrome_driver()
    # this is the worst thing ever i'm so sorry
    try:
        driver.get(f"https://x.com/{username}/photo")
        time.sleep(5)  # 2-5 seconds depending on the hardware
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
        return jsonify({"success": False, "message": "Internal server error"}), 500
    finally:
        driver.quit()


@pfp_bp.route("/api/pfp/github/<username>")
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
        return jsonify({"success": False, "message": "Internal server error"}), 500
