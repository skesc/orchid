import re
import time

import requests
from extensions import limiter
from flask import Blueprint, jsonify
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

pfp_bp = Blueprint("pfp", __name__)


def _setup_remote_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--log-level=3")
    return webdriver.Remote(
        command_executor="http://selenium-chrome:4444", options=options
    )


@pfp_bp.route("/api/pfp/x/<username>")
@limiter.limit("1 per minute")
def fetch_x_profile_picture(username):
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return (
            jsonify({"success": False, "message": "Invalid username", "url": None}),
            400,
        )

    try:
        driver = _setup_remote_driver()
    except WebDriverException:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Could not connect to Selenium server",
                    "url": None,
                }
            ),
            503,
        )

    try:
        driver.get(f"https://x.com/{username}/photo")
        wait = WebDriverWait(driver, 10)  # 10 second maximum timeout
        try:
            profile_image = wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, "//img[contains(@src, 'pbs.twimg.com/profile_images')]")
                )
            )
            image_url = profile_image.get_attribute("src")

            return jsonify(
                {
                    "success": True,
                    "message": "Profile picture found",
                    "url": image_url,
                }
            )

        except TimeoutException:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Could not retrieve profile picture - timeout",
                        "url": None,
                    }
                ),
                404,
            )

    except Exception as e:
        return (
            jsonify({"success": False, "message": f"Internal server error: {str(e)}"}),
            500,
        )

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
