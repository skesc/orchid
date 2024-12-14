from datetime import datetime, timedelta
from functools import wraps

from config import Config
from extensions import db
from flask import Blueprint, jsonify
from flask_login import current_user, login_required
from models import MarketplaceItem, User
from s3 import delete_file, get_s3_client

admin_bp = Blueprint("admin", __name__)


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401

        if current_user.email not in Config.ADMIN_EMAILS:
            return jsonify({"error": "Admin access required"}), 403

        return f(*args, **kwargs)

    return decorated_function


@admin_bp.route("/api/admin/check", methods=["GET"])
@login_required
def check_admin_status():
    is_admin = current_user.email in Config.ADMIN_EMAILS
    return jsonify(
        {"is_admin": is_admin, "email": current_user.email if is_admin else None}
    )


@admin_bp.route("/api/admin/marketplace", methods=["GET"])
@admin_required
def get_all_marketplace_items():
    items = MarketplaceItem.query.all()
    return jsonify(
        [
            {
                **item.to_dict(),
                "author": {
                    "uuid": item.author.uuid,
                    "name": item.author.name,
                    "email": item.author.email,
                },
            }
            for item in items
        ]
    )


@admin_bp.route("/api/admin/users", methods=["GET"])
@admin_required
def get_all_users():
    users = User.query.all()
    return jsonify(
        [
            {
                "uuid": user.uuid,
                "name": user.name,
                "email": user.email,
                "marketplace_items_count": len(user.marketplace_items),
                "oauth_providers": [conn.provider for conn in user.oauth_connections],
            }
            for user in users
        ]
    )


@admin_bp.route("/api/admin/marketplace/<string:item_uuid>", methods=["DELETE"])
@admin_required
def admin_delete_marketplace_item(item_uuid):
    item = MarketplaceItem.query.filter_by(uuid=item_uuid).first_or_404()

    try:
        if item.image_path:
            delete_file(item.image_path)

        db.session.delete(item)
        db.session.commit()
        return "", 204
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/api/admin/stats", methods=["GET"])
@admin_required
def get_admin_stats():
    total_users = User.query.count()
    total_items = MarketplaceItem.query.count()
    private_items = MarketplaceItem.query.filter_by(is_private=True).count()
    public_items = total_items - private_items

    last_24h = datetime.now() - timedelta(days=1)
    new_users_24h = User.query.filter(User.created_at >= last_24h).count()
    new_items_24h = MarketplaceItem.query.filter(
        MarketplaceItem.created_at >= last_24h
    ).count()

    return jsonify(
        {
            "total_users": total_users,
            "total_items": total_items,
            "private_items": private_items,
            "public_items": public_items,
            "new_users_24h": new_users_24h,
            "new_items_24h": new_items_24h,
        }
    )


@admin_bp.route("/api/admin/orphaned-files", methods=["GET"])
@admin_required
def get_orphaned_files():
    try:
        s3 = get_s3_client()
        response = s3.list_objects_v2(Bucket=Config.S3_BUCKET, Prefix="marketplace/")

        if "Contents" not in response:
            return jsonify([])

        db_items = MarketplaceItem.query.all()
        db_uuids = set(item.uuid for item in db_items)

        orphaned_files = []
        for obj in response["Contents"]:
            key = obj["Key"]
            filename = key.split("/")[-1]

            if filename not in db_uuids:
                orphaned_files.append(
                    {
                        "key": key,
                        "size": obj["Size"],
                        "last_modified": obj["LastModified"].isoformat(),
                        "url": f"/uploads/{key}",
                    }
                )

        return jsonify(orphaned_files)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/api/admin/orphaned-files/<path:key>", methods=["DELETE"])
@admin_required
def delete_orphaned_file(key):
    try:
        s3 = get_s3_client()
        s3.delete_object(Bucket=Config.S3_BUCKET, Key=key)
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500
