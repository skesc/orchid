import uuid

from extensions import db, login_manager
from flask_login import UserMixin


class OAuthConnection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    provider = db.Column(db.String(20), nullable=False)  # 'google' or 'github'
    oauth_id = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    __table_args__ = (db.UniqueConstraint("provider", "oauth_id"),)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    oauth_connections = db.relationship("OAuthConnection", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"


class MarketplaceItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(
        db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    categories = db.Column(db.JSON)
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )
    author_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    author = db.relationship("User", backref=db.backref("marketplace_items", lazy=True))

    @property
    def image_path(self):
        """Generate S3 path for the item"""
        return f"/uploads/marketplace/{self.uuid}"

    def to_dict(self):
        return {
            "id": self.id,
            "uuid": self.uuid,
            "name": self.name,
            "description": self.description,
            "image_path": self.image_path,
            "categories": self.categories,
            "is_private": self.is_private,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "author": {"id": self.author.id, "name": self.author.name},
        }


class Bookmark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    item_id = db.Column(
        db.Integer, db.ForeignKey("marketplace_item.id"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    user = db.relationship("User", backref=db.backref("bookmarks", lazy=True))
    item = db.relationship(
        "MarketplaceItem", backref=db.backref("bookmarks", lazy=True)
    )

    __table_args__ = (db.UniqueConstraint("user_id", "item_id"),)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
