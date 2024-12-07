from config import Config
from flask import Blueprint, abort, redirect
from s3 import get_s3_client
from werkzeug.utils import secure_filename

uploads_bp = Blueprint("uploads", __name__)

VALID_FOLDERS = ["nobg", "marketplace"]


@uploads_bp.route("/uploads/<folder>/<path:filename>")
def serve_uploaded_file(folder, filename):
    if folder not in VALID_FOLDERS:
        return abort(404)

    filename = secure_filename(filename)
    key = f"{folder}/{filename}"

    try:
        s3 = get_s3_client()
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": Config.S3_BUCKET, "Key": key},
            ExpiresIn=3600,  # URL valid for 1 hour
        )
        return redirect(url)
    except Exception:
        return abort(404)
