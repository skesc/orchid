from config import Config
from extensions import db
from flask import (
    Blueprint,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_cors import cross_origin
from flask_login import current_user, login_user, logout_user
from models import OAuthConnection, User
from requests_oauthlib import OAuth2Session

auth_bp = Blueprint("auth", __name__)

# oAuth2 configuration
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO = "https://www.googleapis.com/oauth2/v1/userinfo"

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_INFO = "https://api.github.com/user"
scheme = "http" if Config.ENV == "dev" else "https"


@auth_bp.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response


@auth_bp.route("/api/auth/urls")
@cross_origin()
def get_auth_urls():
    return jsonify(
        {
            "google": url_for("auth.google_login", _external=True),
            "github": url_for("auth.github_login", _external=True),
        }
    )


@auth_bp.route("/api/auth/user")
@cross_origin()
def get_user():
    if current_user.is_authenticated:
        return jsonify(
            {
                "authenticated": True,
                "user": {
                    "uuid": current_user.uuid,
                    "email": current_user.email,
                    "name": current_user.name,
                    "oauth_providers": [
                        conn.provider for conn in current_user.oauth_connections
                    ],
                },
            }
        )
    return jsonify({"authenticated": False, "user": None})


@auth_bp.route("/api/auth/logout")
@cross_origin()
def api_logout():
    if current_user.is_authenticated:
        logout_user()
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "No user is currently logged in"}), 200


@auth_bp.route("/login/google")
def google_login():
    google = OAuth2Session(
        Config.GOOGLE_CLIENT_ID,
        scope=["openid", "email", "profile"],
        redirect_uri=url_for("auth.google_callback", _external=True, _scheme=scheme),
    )
    authorization_url, state = google.authorization_url(GOOGLE_AUTH_URL)
    session["oauth_state"] = state

    # if AJAX request, return URL instead of redirecting
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"authorization_url": authorization_url})
    return redirect(authorization_url)


@auth_bp.route("/login/google/callback")
def google_callback():
    google = OAuth2Session(
        Config.GOOGLE_CLIENT_ID,
        state=session["oauth_state"],
        redirect_uri=url_for("auth.google_callback", _external=True, _scheme=scheme),
    )
    token = google.fetch_token(  # noqa
        GOOGLE_TOKEN_URL,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        authorization_response=request.url,
    )
    user_info = google.get(GOOGLE_USER_INFO).json()

    # first try to find user by OAuth connection
    oauth_connection = OAuthConnection.query.filter_by(
        provider="google", oauth_id=user_info["id"]
    ).first()

    if oauth_connection:
        user = oauth_connection.user
    else:
        # if not found by OAuth, try to find user by email
        user = User.query.filter_by(email=user_info["email"]).first()
        if user:
            # create new OAuth connection for existing user
            oauth_connection = OAuthConnection(
                user=user, provider="google", oauth_id=user_info["id"]
            )
            db.session.add(oauth_connection)
        else:
            # create new user and OAuth connection
            user = User(email=user_info["email"], name=user_info["name"])
            db.session.add(user)
            db.session.flush()

            oauth_connection = OAuthConnection(
                user=user, provider="google", oauth_id=user_info["id"]
            )
            db.session.add(oauth_connection)

        db.session.commit()

    login_user(user)

    return render_template("auth_success.html")


@auth_bp.route("/login/github")
def github_login():
    github = OAuth2Session(
        Config.GITHUB_CLIENT_ID,
        redirect_uri=url_for("auth.github_callback", _external=True, _scheme=scheme),
        scope=["user:email"],
    )
    authorization_url, state = github.authorization_url(GITHUB_AUTH_URL)
    session["oauth_state"] = state

    # if AJAX request, return URL instead of redirecting
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"authorization_url": authorization_url})
    return redirect(authorization_url)


@auth_bp.route("/login/github/callback")
def github_callback():
    github = OAuth2Session(
        Config.GITHUB_CLIENT_ID,
        state=session["oauth_state"],
        redirect_uri=url_for("auth.github_callback", _external=True, _scheme=scheme),
    )
    token = github.fetch_token(  # noqa
        GITHUB_TOKEN_URL,
        client_secret=Config.GITHUB_CLIENT_SECRET,
        authorization_response=request.url,
    )

    # get user profile
    user_info = github.get(GITHUB_USER_INFO).json()

    # if email is not in user_info, fetch emails separately
    email = user_info.get("email")
    if not email:
        emails = github.get("https://api.github.com/user/emails").json()
        # get primary email or first email in list
        primary_email = next(
            (e["email"] for e in emails if e["primary"]),
            emails[0]["email"] if emails else None,
        )
        email = primary_email or f"{user_info['login']}@users.noreply.github.com"

    # first try to find user by OAuth connection
    oauth_connection = OAuthConnection.query.filter_by(
        provider="github", oauth_id=str(user_info["id"])
    ).first()

    if oauth_connection:
        user = oauth_connection.user
    else:
        # if not found by OAuth, try to find user by email
        user = User.query.filter_by(email=email).first()
        if user:
            # create new OAuth connection for existing user
            oauth_connection = OAuthConnection(
                user=user, provider="github", oauth_id=str(user_info["id"])
            )
            db.session.add(oauth_connection)
        else:
            # create new user and OAuth connection
            user = User(email=email, name=user_info.get("name", user_info["login"]))
            db.session.add(user)
            db.session.flush()

            oauth_connection = OAuthConnection(
                user=user, provider="github", oauth_id=str(user_info["id"])
            )
            db.session.add(oauth_connection)

        db.session.commit()

    login_user(user)

    return render_template("auth_success.html")
