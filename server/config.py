import os
from pathlib import Path

from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / ".env"
load_dotenv(env_path)


class Config:
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY")
    SESSION_COOKIE_SECURE = os.getenv("ENV") != "dev"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax" if os.getenv("ENV") == "dev" else "Strict"
    REMEMBER_COOKIE_SECURE = os.getenv("ENV") != "dev"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax" if os.getenv("ENV") == "dev" else "Strict"

    # File Upload
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB limit
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

    # Content Security Policy
    CSP = {
        "default-src": "'self' https://*.google.com https://*.googleapis.com https://*.github.com https://fonts.gstatic.com",
        "script-src": "'self' 'unsafe-inline'",
        "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src": "'self' data: https://*.githubusercontent.com https://*.googleusercontent.com",
        "object-src": "'none'",
    }

    # OAuth Configuration
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

    # Application Settings
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    ENV = os.getenv("ENV", "production")
    ADMIN_EMAILS = [
        email.strip()
        for email in os.getenv("ADMIN_EMAILS", "").split(",")
        if email.strip()
    ]

    # Database
    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # S3 Storage
    S3_ENDPOINT = os.getenv("S3_ENDPOINT")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
    S3_BUCKET = os.getenv("S3_BUCKET", "orchid")
