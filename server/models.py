from extensions import db, login_manager
from flask_login import UserMixin


class OAuthConnection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    provider = db.Column(db.String(20), nullable=False)  # 'google' or 'github'
    oauth_id = db.Column(db.String(100), nullable=False)

    __table_args__ = (db.UniqueConstraint("provider", "oauth_id"),)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    oauth_connections = db.relationship('OAuthConnection', backref='user', lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
