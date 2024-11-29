from os import environ, makedirs

from cleanup import CleanupScheduler
from config import Config
from dotenv import load_dotenv
from extensions import db, login_manager
from flask import Flask
from flask_cors import CORS

load_dotenv()

if Config.ENV == "dev":
    environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = Flask(__name__)
app.config.from_object(Config)
cleanup = CleanupScheduler(app)

from routes.admin import admin_bp
from routes.auth import auth_bp
from routes.bgremove import bgremove_bp
from routes.marketplace import marketplace_bp
from routes.pfp import pfp_bp
from routes.uploads import uploads_bp
from utils import unauthorized

app.register_blueprint(auth_bp)
app.register_blueprint(pfp_bp)
app.register_blueprint(marketplace_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(bgremove_bp)
app.register_blueprint(uploads_bp)

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = "auth.login"
login_manager.unauthorized_handler = unauthorized
makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [Config.FRONTEND_URL],
            "supports_credentials": True,
        }
    },
)


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
