import os

from flask import Flask

from config import Config
from extensions import db, login_manager

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = "auth.login"

from auth.routes import auth_bp

app.register_blueprint(auth_bp)


@app.route("/")
def index():
    return "pong"


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
