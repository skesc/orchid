import re

import requests
from config import Config
from extensions import limiter
from flask import Blueprint, jsonify
from twitter import get_profile_image

pfp_bp = Blueprint("pfp", __name__)


@pfp_bp.route("/api/pfp/x/<username>")
@limiter.limit("1 per minute")
def fetch_x_profile_picture(username):
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return (
            jsonify({"success": False, "message": "Invalid username", "url": None}),
            400,
        )

    try:
        image_url = get_profile_image(
            username, Config.TWITTER_AUTH_TOKEN, Config.TWITTER_CT0
        )
        if image_url:
            return jsonify(
                {
                    "success": True,
                    "message": "Profile picture found",
                    "url": image_url,
                }
            )
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

    except Exception as e:
        return (
            jsonify({"success": False, "message": f"Internal server error: {str(e)}"}),
            500,
        )


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
