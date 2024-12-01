import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB limit
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    MARKETPLACE_UPLOAD_FOLDER = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "uploads", "marketplace"
    )
    MARKETPLACE_COMPRESSED = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "uploads", "marketplace_compressed"
    )
    NOBG_UPLOAD_FOLDER = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "uploads", "nobg"
    )
    SECRET_KEY = os.getenv("SECRET_KEY")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    ENV = os.getenv("ENV")

    ADMIN_EMAILS = [
        email.strip()
        for email in os.getenv("ADMIN_EMAILS", "").split(",")
        if email.strip()
    ]

    SESSION_COOKIE_SECURE = ENV != "dev"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax" if ENV == "dev" else "Strict"
    REMEMBER_COOKIE_SECURE = ENV != "dev"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax" if ENV == "dev" else "Strict"

    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
