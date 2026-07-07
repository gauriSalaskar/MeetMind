from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from bson.errors import InvalidId
import datetime

from app.db import get_db
from app.utils.auth import login_required
from app.utils.serialize import serialize_doc, serialize_list
from app.services.intelligence import compute_relationship_score

contacts_bp = Blueprint("contacts", __name__, url_prefix="/api/contacts")

VALID_CATEGORIES = {
    "Friend", "Mentor", "Recruiter", "Founder",
    "Investor", "Client", "Student", "Other",
}


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _oid(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None


@contacts_bp.route("", methods=["GET"])
@login_required
def list_contacts():
    db = get_db()
    category = request.args.get("category")
    search = request.args.get("search")

    query = {"user_id": g.user_id}
    if category and category in VALID_CATEGORIES:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"role": {"$regex": search, "$options": "i"}},
        ]

    contacts = list(db.contacts.find(query).sort("created_at", -1))
    for c in contacts:
        c["initials"] = c.get("initials") or _initials(c.get("name", ""))
    return jsonify({"contacts": serialize_list(contacts)}), 200


@contacts_bp.route("", methods=["POST"])
@login_required
def create_contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    category = data.get("category") or "Other"
    if category not in VALID_CATEGORIES:
        category = "Other"

    db = get_db()
    doc = {
        "user_id": g.user_id,
        "name": name,
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "company": (data.get("company") or "").strip(),
        "role": (data.get("role") or "").strip(),
        "category": category,
        "notes": (data.get("notes") or "").strip(),
        "initials": _initials(name),
        "relationship_score": 10,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow(),
        "last_interaction": None,
    }
    result = db.contacts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"contact": serialize_doc(doc)}), 201


@contacts_bp.route("/<contact_id>", methods=["GET"])
@login_required
def get_contact(contact_id):
    oid = _oid(contact_id)
    if not oid:
        return jsonify({"error": "Invalid contact id"}), 400

    db = get_db()
    contact = db.contacts.find_one({"_id": oid, "user_id": g.user_id})
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    meetings = list(
        db.meetings.find({"user_id": g.user_id, "contact_id": contact_id})
        .sort("date", -1)
    )
    contact["relationship_score"] = compute_relationship_score(meetings, contact)
    contact["initials"] = contact.get("initials") or _initials(contact.get("name", ""))

    return jsonify({
        "contact": serialize_doc(contact),
        "meetings": serialize_list(meetings),
    }), 200


@contacts_bp.route("/<contact_id>", methods=["PUT", "PATCH"])
@login_required
def update_contact(contact_id):
    oid = _oid(contact_id)
    if not oid:
        return jsonify({"error": "Invalid contact id"}), 400

    data = request.get_json(silent=True) or {}
    db = get_db()
    existing = db.contacts.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Contact not found"}), 404

    update = {}
    for field in ["name", "email", "phone", "company", "role", "notes"]:
        if field in data:
            update[field] = (data.get(field) or "").strip()

    if "category" in data and data["category"] in VALID_CATEGORIES:
        update["category"] = data["category"]

    if "name" in update:
        update["initials"] = _initials(update["name"])

    update["updated_at"] = datetime.datetime.utcnow()

    db.contacts.update_one({"_id": oid}, {"$set": update})
    updated = db.contacts.find_one({"_id": oid})
    return jsonify({"contact": serialize_doc(updated)}), 200


@contacts_bp.route("/<contact_id>", methods=["DELETE"])
@login_required
def delete_contact(contact_id):
    oid = _oid(contact_id)
    if not oid:
        return jsonify({"error": "Invalid contact id"}), 400

    db = get_db()
    existing = db.contacts.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Contact not found"}), 404

    db.contacts.delete_one({"_id": oid})
    db.meetings.delete_many({"user_id": g.user_id, "contact_id": contact_id})
    db.reminders.delete_many({"user_id": g.user_id, "contact_id": contact_id})

    return jsonify({"message": "Contact deleted"}), 200
