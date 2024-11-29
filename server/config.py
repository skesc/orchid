import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
    FRONTEND_URL = os.getenv("FRONTEND_URL")

    ADMIN_EMAILS = [
        email.strip()
        for email in os.getenv("ADMIN_EMAILS", "").split(",")
        if email.strip()
    ]

    SESSION_COOKIE_SECURE = os.getenv("ENVIRONMENT") != "dev"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax" if os.getenv("ENVIRONMENT") == "dev" else "Strict"
    REMEMBER_COOKIE_SECURE = os.getenv("ENVIRONMENT") != "dev"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax" if os.getenv("ENVIRONMENT") == "dev" else "Strict"

    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
