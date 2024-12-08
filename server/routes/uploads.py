import hashlib
import io
import os
from datetime import timedelta

from config import Config
from flask import Blueprint, abort, redirect, request, send_file
from PIL import Image
from s3 import get_s3_client
from werkzeug.utils import secure_filename

uploads_bp = Blueprint("uploads", __name__)

VALID_FOLDERS = ["nobg", "marketplace"]
VALID_FORMATS = ["webp"]
CACHE_DIR = "cache"
CACHE_DURATION = timedelta(days=7)

# Image quality presets
THUMBNAIL_QUALITY = 30
PREVIEW_QUALITY = 50
FULL_QUALITY = 75


def get_cache_key(key, width, height, quality):
    params = f"{key}-{width}-{height}-{quality}"
    return hashlib.md5(params.encode()).hexdigest()


def optimize_image(image_data, width=None, height=None, quality=PREVIEW_QUALITY):
    img = Image.open(io.BytesIO(image_data))

    if img.mode not in ("RGBA", "RGB"):
        img = img.convert("RGBA")

    if width or height:
        original_width, original_height = img.size
        if width and height:
            new_size = (int(width), int(height))
        elif width:
            ratio = float(width) / original_width
            new_size = (int(width), int(original_height * ratio))
        else:
            ratio = float(height) / original_height
            new_size = (int(original_width * ratio), int(height))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    output = io.BytesIO()
    has_transparency = img.mode == "RGBA" and any(px[3] < 255 for px in img.getdata())

    if has_transparency:
        img.save(output, format="WEBP", lossless=True, quality=100)
    else:
        if img.mode == "RGBA":
            img = img.convert("RGB")
        img.save(output, format="WEBP", quality=quality, method=6)

    output.seek(0)
    return output


def add_cache_headers(response, max_age=None):
    if max_age is None:
        max_age = int(CACHE_DURATION.total_seconds())

    response.headers["Cache-Control"] = (
        f"public, max-age={max_age}, stale-while-revalidate=60"
    )
    response.headers["Vary"] = "Accept-Encoding"
    return response


@uploads_bp.route("/uploads/<folder>/<path:filename>")
def serve_uploaded_file(folder, filename):
    if folder not in VALID_FOLDERS:
        return abort(404)

    filename = secure_filename(filename)
    key = f"{folder}/{filename}"

    width = request.args.get("w", type=int)
    height = request.args.get("h", type=int)
    quality = request.args.get("q", PREVIEW_QUALITY, type=int)

    if quality < 1 or quality > 100:
        quality = PREVIEW_QUALITY

    try:
        s3 = get_s3_client()

        if not any([width, height]):
            quality = FULL_QUALITY

        cache_key = get_cache_key(key, width, height, quality)
        cache_path = os.path.join(CACHE_DIR, cache_key)

        if os.path.exists(cache_path):
            response = send_file(
                cache_path,
                mimetype="image/webp",
                conditional=True,
            )
            return add_cache_headers(response)

        response = s3.get_object(Bucket=Config.S3_BUCKET, Key=key)
        image_data = response["Body"].read()
        optimized = optimize_image(image_data, width, height, quality)

        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_path, "wb") as f:
            f.write(optimized.getvalue())

        response = send_file(
            io.BytesIO(optimized.getvalue()), mimetype="image/webp", conditional=True
        )
        return add_cache_headers(response)

    except Exception as e:
        print(f"Error serving file: {str(e)}")
        return abort(404)
