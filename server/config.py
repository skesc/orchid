from datetime import timedelta
from os import getenv
from pathlib import Path

from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / ".env"
load_dotenv(env_path)


class Config:
    # Security
    SECRET_KEY = getenv("SECRET_KEY")
    SESSION_COOKIE_SECURE = getenv("ENV") != "dev"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax" if getenv("ENV") == "dev" else "Strict"
    REMEMBER_COOKIE_SECURE = getenv("ENV") != "dev"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax" if getenv("ENV") == "dev" else "Strict"

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
    GOOGLE_CLIENT_ID = getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID = getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = getenv("GITHUB_CLIENT_SECRET")

    # Application Settings
    FRONTEND_URL = getenv("FRONTEND_URL", "http://localhost:5173")
    ENV = getenv("ENV", "production")
    ADMIN_EMAILS = [
        email.strip()
        for email in getenv("ADMIN_EMAILS", "").split(",")
        if email.strip()
    ]

    # Database
    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # S3 Storage
    S3_ENDPOINT = getenv("S3_ENDPOINT")
    S3_ACCESS_KEY = getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY = getenv("S3_SECRET_KEY")
    S3_BUCKET = getenv("S3_BUCKET")

    # Image Cache
    MAX_CACHE_SIZE_BYTES = 1000 * 1024 * 1024  # 1GB max cache size
    CACHE_DIR = getenv("CACHE_DIR", "cache")
    CACHE_DURATION = timedelta(days=7)
    THUMBNAIL_QUALITY = 30
    PREVIEW_QUALITY = 50
    FULL_QUALITY = 90
