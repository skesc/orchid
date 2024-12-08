import uuid

from extensions import db, login_manager
from flask_login import UserMixin


class OAuthConnection(db.Model):
    uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_uuid = db.Column(db.String(36), db.ForeignKey("user.uuid"), nullable=False)
    provider = db.Column(db.String(20), nullable=False)  # 'google' or 'github'
    oauth_id = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    __table_args__ = (db.UniqueConstraint("provider", "oauth_id"),)


class User(UserMixin, db.Model):
    uuid = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
        primary_key=True,
    )
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    oauth_connections = db.relationship("OAuthConnection", backref="user", lazy=True)

    def get_id(self):
        """Return the uuid as string, as required by Flask-Login."""
        return str(self.uuid)

    def to_dict(self):
        return {"uuid": self.uuid, "name": self.name}

    def __repr__(self):
        return f"<User {self.email}>"


class MarketplaceItem(db.Model):
    uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
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
    author_uuid = db.Column(db.String(36), db.ForeignKey("user.uuid"), nullable=False)
    author = db.relationship("User", backref=db.backref("marketplace_items", lazy=True))

    @property
    def image_path(self):
        """Generate S3 path for the item"""
        return f"/uploads/marketplace/{self.uuid}"

    def to_dict(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
            "description": self.description,
            "image_path": self.image_path,
            "categories": self.categories,
            "is_private": self.is_private,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "author": {
                "uuid": self.author.uuid,
                "name": self.author.name,
                "email": self.author.email,
            },
        }


class Bookmark(db.Model):
    uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_uuid = db.Column(db.String(36), db.ForeignKey("user.uuid"), nullable=False)
    item_uuid = db.Column(
        db.String(36), db.ForeignKey("marketplace_item.uuid"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    user = db.relationship("User", backref=db.backref("bookmarks", lazy=True))
    item = db.relationship(
        "MarketplaceItem",
        backref=db.backref("bookmarks", lazy=True),
        foreign_keys=[item_uuid],
        primaryjoin="Bookmark.item_uuid == MarketplaceItem.uuid",
    )

    __table_args__ = (db.UniqueConstraint("user_uuid", "item_uuid"),)


@login_manager.user_loader
def load_user(user_uuid):
    return User.query.get(user_uuid)
