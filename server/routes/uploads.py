import os

from config import Config
from flask import Blueprint, abort, send_from_directory
from werkzeug.utils import secure_filename

uploads_bp = Blueprint("uploads", __name__)

VALID_FOLDERS = ["nobg", "marketplace", "marketplace_compressed"]


@uploads_bp.route("/uploads/<folder>/<path:filename>")
def serve_uploaded_file(folder, filename):
    if folder not in VALID_FOLDERS:
        return abort(404)

    filename = secure_filename(filename)
    folder_path = os.path.join(Config.UPLOAD_FOLDER, folder)
    file_path = os.path.join(folder_path, filename)

    if not file_path.startswith(os.path.abspath(folder_path)):
        return abort(404)

    if not os.path.exists(file_path):
        return abort(404)

    return send_from_directory(folder_path, filename)
