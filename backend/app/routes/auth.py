from flask import Blueprint, request, jsonify, g
from flask_bcrypt import Bcrypt
from bson import ObjectId
import datetime
import re

from app.db import get_db
from app.utils.auth import generate_token, login_required
from app.utils.serialize import serialize_doc

bcrypt = Bcrypt()
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or data.get("confirmPassword") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Please enter a valid email address"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if confirm_password and password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists"}), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user_doc = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.datetime.utcnow(),
    }
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = generate_token(user_id)

    user_doc["_id"] = result.inserted_id
    return jsonify({"token": token, "user": serialize_doc(user_doc)}), 201


@auth_bp.route("/signin", methods=["POST"])
def signin():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not bcrypt.check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(str(user["_id"]))
    return jsonify({"token": token, "user": serialize_doc(user)}), 200


@auth_bp.route("/google", methods=["POST"])
def google_signin():
    """Sign in or sign up using a Google ID token from the frontend's
    'Sign in with Google' button (Google Identity Services).
    """
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
    from app.config import Config

    data = request.get_json(silent=True) or {}
    credential = data.get("credential")
    if not credential:
        return jsonify({"error": "Missing Google credential"}), 400
    if not Config.GOOGLE_CLIENT_ID:
        return jsonify({"error": "Google Sign-In is not configured on the server"}), 500

    try:
        idinfo = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), Config.GOOGLE_CLIENT_ID
        )
    except ValueError:
        return jsonify({"error": "Invalid Google credential"}), 401

    email = (idinfo.get("email") or "").strip().lower()
    name = idinfo.get("name") or email.split("@")[0]
    if not email:
        return jsonify({"error": "Google account has no email"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        user_doc = {
            "name": name,
            "email": email,
            "password_hash": None,  # Google-only account, no password
            "auth_provider": "google",
            "created_at": datetime.datetime.utcnow(),
        }
        result = db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc

    token = generate_token(str(user["_id"]))
    return jsonify({"token": token, "user": serialize_doc(user)}), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({"user": serialize_doc(g.user)}), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    # Stateless JWT -- logout is handled client-side by discarding the token.
    return jsonify({"message": "Logged out"}), 200