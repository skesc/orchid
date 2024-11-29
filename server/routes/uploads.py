import os

from config import Config
from flask import Blueprint, abort, send_from_directory
from werkzeug.utils import secure_filename

uploads_bp = Blueprint("uploads", __name__)


@uploads_bp.route("/uploads/<path:filename>")
def serve_uploaded_file(filename):
    filename = secure_filename(filename)
    file_path = os.path.join(Config.UPLOAD_FOLDER, filename)

    if not file_path.startswith(os.path.abspath(Config.UPLOAD_FOLDER)):
        return abort(404)

    if not os.path.exists(file_path):
        return abort(404)

    return send_from_directory(Config.UPLOAD_FOLDER, filename)
