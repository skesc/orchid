import os
from os import environ

from config import Config
from dotenv import load_dotenv
from extensions import db, login_manager
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv()

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = Flask(__name__)
app.config.from_object(Config)

from admin import admin_bp
from auth import auth_bp
from bgremove import bgremove_bp
from marketplace import marketplace_bp
from pfp import pfp_bp
from uploads import uploads_bp

app.register_blueprint(auth_bp)
app.register_blueprint(pfp_bp)
app.register_blueprint(marketplace_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(bgremove_bp)
app.register_blueprint(uploads_bp)

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = "auth.login"

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [environ.get("FRONTEND_URL")],
            "supports_credentials": True,
        }
    },
)


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized", "message": "Please log in"}), 401


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
