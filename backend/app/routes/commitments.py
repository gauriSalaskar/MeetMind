from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from bson.errors import InvalidId
import datetime

from app.db import get_db
from app.utils.auth import login_required
from app.utils.serialize import serialize_doc, serialize_list
from app.services.commitment_extractor import compute_status

commitments_bp = Blueprint("commitments", __name__, url_prefix="/api/commitments")


def _oid(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None


def _with_status(doc: dict) -> dict:
    out = serialize_doc(doc)
    out["status"] = compute_status(doc.get("due_date"), doc.get("done", False))
    return out


@commitments_bp.route("", methods=["GET"])
@login_required
def list_commitments():
    """List commitments for the current user, optionally filtered by contact.

    Query params:
      contact_id  -- only commitments for this contact
      status      -- open | due_today | overdue | done (computed, filtered in-memory)
    """
    db = get_db()
    query = {"user_id": g.user_id}

    contact_id = request.args.get("contact_id")
    if contact_id:
        query["contact_id"] = contact_id

    docs = list(db.commitments.find(query).sort("due_date", 1))
    results = [_with_status(d) for d in docs]

    status_filter = request.args.get("status")
    if status_filter:
        results = [r for r in results if r["status"] == status_filter]

    # Group for convenience, same pattern as reminders.py
    grouped = {"overdue": [], "due_today": [], "open": [], "done": []}
    for r in results:
        grouped.setdefault(r["status"], []).append(r)

    return jsonify({
        "commitments": results,
        "grouped": grouped,
        "counts": {k: len(v) for k, v in grouped.items()},
    }), 200


@commitments_bp.route("", methods=["POST"])
@login_required
def create_commitment():
    """Manually add a commitment (in addition to auto-extracted ones)."""
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400

    contact_id = data.get("contact_id")
    contact_name = ""
    db = get_db()
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
        "meeting_id": data.get("meeting_id"),
        "text": text,
        "due_date": (data.get("due_date") or "").strip() or None,
        "done": False,
        "source": data.get("source", "manual"),
        "created_at": datetime.datetime.utcnow(),
    }
    result = db.commitments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"commitment": _with_status(doc)}), 201


@commitments_bp.route("/<commitment_id>", methods=["PATCH"])
@login_required
def update_commitment(commitment_id):
    oid = _oid(commitment_id)
    if not oid:
        return jsonify({"error": "Invalid commitment id"}), 400

    data = request.get_json(silent=True) or {}
    db = get_db()
    existing = db.commitments.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Commitment not found"}), 404

    update = {}
    if "done" in data:
        update["done"] = bool(data["done"])
        if update["done"]:
            update["closed_at"] = datetime.datetime.utcnow()
            update["closed_via"] = data.get("closed_via", "manual")
    if "text" in data:
        update["text"] = (data.get("text") or "").strip()
    if "due_date" in data:
        update["due_date"] = (data.get("due_date") or "").strip() or None

    db.commitments.update_one({"_id": oid}, {"$set": update})
    updated = db.commitments.find_one({"_id": oid})
    return jsonify({"commitment": _with_status(updated)}), 200


@commitments_bp.route("/<commitment_id>", methods=["DELETE"])
@login_required
def delete_commitment(commitment_id):
    oid = _oid(commitment_id)
    if not oid:
        return jsonify({"error": "Invalid commitment id"}), 400

    db = get_db()
    existing = db.commitments.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Commitment not found"}), 404

    db.commitments.delete_one({"_id": oid})
    return jsonify({"message": "Commitment deleted"}), 200
