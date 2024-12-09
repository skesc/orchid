import hashlib
import io
import os
from datetime import datetime
from pathlib import Path

from config import Config
from flask import Blueprint, abort, request, send_file
from PIL import Image
from s3 import get_s3_client
from werkzeug.utils import secure_filename

uploads_bp = Blueprint("uploads", __name__)

VALID_FOLDERS = ["nobg", "marketplace"]
CACHE_DIR = Config.CACHE_DIR
CACHE_DURATION = Config.CACHE_DURATION
MAX_CACHE_SIZE_BYTES = Config.MAX_CACHE_SIZE_BYTES
THUMBNAIL_QUALITY = Config.THUMBNAIL_QUALITY
PREVIEW_QUALITY = Config.PREVIEW_QUALITY
FULL_QUALITY = Config.FULL_QUALITY


def get_cache_key(key, width, height, quality):
    params = f"{key}-{width}-{height}-{quality}"
    return hashlib.md5(params.encode()).hexdigest()


def optimize_image(image_data, width=None, height=None, quality=PREVIEW_QUALITY):
    img = Image.open(io.BytesIO(image_data))

    if img.mode not in ("RGBA", "RGB"):
        img = img.convert("RGB")

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
    img.save(output, format="WEBP", quality=quality, method=4)
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


def cleanup_old_cache_files():
    now = datetime.now().timestamp()
    cache_dir = Path(CACHE_DIR)

    if not cache_dir.exists():
        return

    for cache_file in cache_dir.iterdir():
        if not cache_file.is_file():
            continue
        file_age = now - cache_file.stat().st_mtime
        if file_age > CACHE_DURATION.total_seconds():
            try:
                cache_file.unlink()
            except OSError:
                pass


def maintain_cache_size():
    cache_dir = Path(CACHE_DIR)
    if not cache_dir.exists():
        return

    cache_files = []
    total_size = 0

    for cache_file in cache_dir.iterdir():
        if not cache_file.is_file():
            continue
        stats = cache_file.stat()
        total_size += stats.st_size
        cache_files.append((stats.st_mtime, stats.st_size, cache_file))

    if total_size > MAX_CACHE_SIZE_BYTES:
        cache_files.sort()

        for mtime, size, file_path in cache_files:
            if total_size <= MAX_CACHE_SIZE_BYTES:
                break
            try:
                file_path.unlink()
                total_size -= size
            except OSError:
                pass


def cache_image(cache_path: str, image_data: bytes):
    """Cache image data and maintain cache limits."""
    os.makedirs(CACHE_DIR, exist_ok=True)

    cleanup_old_cache_files()

    with open(cache_path, "wb") as f:
        f.write(image_data)

    maintain_cache_size()


@uploads_bp.route("/uploads/<folder>/<path:filename>")
def serve_uploaded_file(folder, filename):
    if folder not in VALID_FOLDERS:
        return abort(404)

    filename = secure_filename(filename)
    key = f"{folder}/{filename}"

    width = request.args.get("w", type=int)
    height = request.args.get("h", type=int)
    requested_quality = request.args.get("q", PREVIEW_QUALITY, type=int)

    if requested_quality <= THUMBNAIL_QUALITY:
        quality = THUMBNAIL_QUALITY
    elif requested_quality <= PREVIEW_QUALITY:
        quality = PREVIEW_QUALITY
    else:
        quality = FULL_QUALITY

    try:
        s3 = get_s3_client()
        cache_key = get_cache_key(key, width, height, quality)
        cache_path = os.path.join(CACHE_DIR, cache_key)

        print(f"Cache key for {key}: {cache_key} (quality={quality})")

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

        cache_image(cache_path, optimized.getvalue())

        response = send_file(
            io.BytesIO(optimized.getvalue()), mimetype="image/webp", conditional=True
        )
        return add_cache_headers(response)

    except Exception as e:
        print(f"Error serving file: {str(e)}")
        return abort(404)
