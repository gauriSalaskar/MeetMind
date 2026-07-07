from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from bson.errors import InvalidId
import datetime

from app.db import get_db
from app.utils.auth import login_required
from app.utils.serialize import serialize_doc, serialize_list

reminders_bp = Blueprint("reminders", __name__, url_prefix="/api/reminders")


def _oid(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None


@reminders_bp.route("", methods=["GET"])
@login_required
def list_reminders():
    db = get_db()
    reminders = list(
        db.reminders.find({"user_id": g.user_id, "completed": {"$ne": True}})
        .sort("due_date", 1)
    )

    today = datetime.date.today().isoformat()
    grouped = {"overdue": [], "today": [], "upcoming": []}
    for r in reminders:
        due = r.get("due_date") or ""
        serialized = serialize_doc(r)
        if due < today:
            grouped["overdue"].append(serialized)
        elif due == today:
            grouped["today"].append(serialized)
        else:
            grouped["upcoming"].append(serialized)

    return jsonify(grouped), 200


@reminders_bp.route("", methods=["POST"])
@login_required
def create_reminder():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    due_date = (data.get("due_date") or "").strip()
    if not title or not due_date:
        return jsonify({"error": "title and due_date are required"}), 400

    db = get_db()
    contact_name = ""
    contact_id = data.get("contact_id")
    if contact_id:
        oid = _oid(contact_id)
        if oid:
            contact = db.contacts.find_one({"_id": oid, "user_id": g.user_id})
            if contact:
                contact_name = contact.get("name", "")

    doc = {
        "user_id": g.user_id,
        "contact_id": contact_id,
        "contact_name": contact_name,
        "title": title,
        "due_date": due_date,
        "completed": False,
        "created_at": datetime.datetime.utcnow(),
    }
    result = db.reminders.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"reminder": serialize_doc(doc)}), 201


@reminders_bp.route("/<reminder_id>", methods=["PATCH"])
@login_required
def update_reminder(reminder_id):
    oid = _oid(reminder_id)
    if not oid:
        return jsonify({"error": "Invalid reminder id"}), 400

    data = request.get_json(silent=True) or {}
    db = get_db()
    existing = db.reminders.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Reminder not found"}), 404

    update = {}
    if "completed" in data:
        update["completed"] = bool(data["completed"])
    if "title" in data:
        update["title"] = (data.get("title") or "").strip()
    if "due_date" in data:
        update["due_date"] = (data.get("due_date") or "").strip()

    db.reminders.update_one({"_id": oid}, {"$set": update})
    updated = db.reminders.find_one({"_id": oid})
    return jsonify({"reminder": serialize_doc(updated)}), 200


@reminders_bp.route("/<reminder_id>", methods=["DELETE"])
@login_required
def delete_reminder(reminder_id):
    oid = _oid(reminder_id)
    if not oid:
        return jsonify({"error": "Invalid reminder id"}), 400

    db = get_db()
    existing = db.reminders.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Reminder not found"}), 404

    db.reminders.delete_one({"_id": oid})
    return jsonify({"message": "Reminder deleted"}), 200
