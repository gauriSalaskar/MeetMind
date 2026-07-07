import datetime
import jwt
from functools import wraps
from flask import request, jsonify, g
from bson import ObjectId
from app.config import Config
from app.db import get_db


def generate_token(user_id: str) -> str:
    payload = {
        "sub": str(user_id),
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(hours=Config.JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def login_required(fn):
    """Decorator that protects a route, populating g.user_id and g.user."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        user_id = decode_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        db = get_db()
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = None

        if not user:
            return jsonify({"error": "User not found"}), 401

        g.user_id = user_id
        g.user = user
        return fn(*args, **kwargs)

    return wrapper
