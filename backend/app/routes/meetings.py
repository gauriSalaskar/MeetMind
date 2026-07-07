from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from bson.errors import InvalidId
import datetime

from app.db import get_db
from app.utils.auth import login_required
from app.utils.serialize import serialize_doc, serialize_list
from app.services.intelligence import retain_meeting_memory, compute_relationship_score
from app.services.commitment_extractor import extract_commitments, find_completed_commitments
from app.services.sarvam_client import transcribe_audio, SarvamError

meetings_bp = Blueprint("meetings", __name__, url_prefix="/api/meetings")


def _auto_close_commitments(db, user_id, contact_id, new_text):
    """Check this contact's open commitments against fresh meeting/voice
    text and close any that were clearly just mentioned as done.
    Never raises -- this is a nice-to-have, not a blocker.
    """
    if not new_text:
        return []
    open_docs = list(db.commitments.find({
        "user_id": user_id, "contact_id": contact_id, "done": {"$ne": True},
    }))
    if not open_docs:
        return []

    lookup = [{"id": str(d["_id"]), "text": d["text"]} for d in open_docs]
    completed_ids = find_completed_commitments(new_text, lookup)
    if not completed_ids:
        return []

    now = datetime.datetime.utcnow()
    db.commitments.update_many(
        {"_id": {"$in": [ObjectId(cid) for cid in completed_ids]}},
        {"$set": {"done": True, "closed_at": now, "closed_via": "auto_mention"}},
    )
    return completed_ids


def _save_commitments(db, user_id, contact_id, contact_name, meeting_id, meeting_date, action_items, summary):
    """Extract commitments from meeting text and store them. Never raises."""
    extracted = extract_commitments(meeting_date, action_items, summary)
    saved = []
    for item in extracted:
        doc = {
            "user_id": user_id,
            "contact_id": contact_id,
            "contact_name": contact_name,
            "meeting_id": str(meeting_id),
            "text": item["text"],
            "due_date": item["due_date"],
            "done": False,
            "source": "auto",
            "created_at": datetime.datetime.utcnow(),
        }
        result = db.commitments.insert_one(doc)
        doc["_id"] = result.inserted_id
        saved.append(doc)
    return saved


def _oid(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None


@meetings_bp.route("", methods=["GET"])
@login_required
def list_meetings():
    db = get_db()
    contact_id = request.args.get("contact_id")

    query = {"user_id": g.user_id}
    if contact_id:
        query["contact_id"] = contact_id

    meetings = list(db.meetings.find(query).sort("date", -1))
    return jsonify({"meetings": serialize_list(meetings)}), 200


@meetings_bp.route("", methods=["POST"])
@login_required
def create_meeting():
    data = request.get_json(silent=True) or {}
    contact_id = data.get("contact_id")
    if not contact_id:
        return jsonify({"error": "contact_id is required"}), 400

    contact_oid = _oid(contact_id)
    if not contact_oid:
        return jsonify({"error": "Invalid contact_id"}), 400

    db = get_db()
    contact = db.contacts.find_one({"_id": contact_oid, "user_id": g.user_id})
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    summary = (data.get("summary") or "").strip()
    if not summary:
        return jsonify({"error": "Meeting summary is required"}), 400

    date_str = data.get("date") or datetime.datetime.utcnow().strftime("%Y-%m-%d")

    doc = {
        "user_id": g.user_id,
        "contact_id": contact_id,
        "date": date_str,
        "summary": summary,
        "key_points": (data.get("key_points") or "").strip(),
        "personal_details": (data.get("personal_details") or "").strip(),
        "action_items": (data.get("action_items") or "").strip(),
        "follow_up_date": (data.get("follow_up_date") or "").strip(),
        "created_at": datetime.datetime.utcnow(),
    }
    result = db.meetings.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Update contact's last_interaction and relationship score
    meetings = list(db.meetings.find({"user_id": g.user_id, "contact_id": contact_id}).sort("date", -1))
    score = compute_relationship_score(meetings, contact)
    db.contacts.update_one(
        {"_id": contact_oid},
        {"$set": {
            "last_interaction": date_str,
            "relationship_score": score,
            "updated_at": datetime.datetime.utcnow(),
        }},
    )

    # Create a reminder if a follow-up date was given
    if doc["follow_up_date"]:
        db.reminders.insert_one({
            "user_id": g.user_id,
            "contact_id": contact_id,
            "contact_name": contact.get("name", ""),
            "title": f"Follow up with {contact.get('name', 'contact')}",
            "due_date": doc["follow_up_date"],
            "completed": False,
            "created_at": datetime.datetime.utcnow(),
        })

    # Retain this meeting into the contact's Hindsight memory bank.
    # This is the "learning" step -- the agent's recall improves from here on.
    retain_meeting_memory(g.user_id, contact_id, contact.get("name", ""), doc)

    # Extract structured, trackable commitments from the action items.
    commitments = _save_commitments(
        db, g.user_id, contact_id, contact.get("name", ""),
        doc["_id"], doc["date"], doc["action_items"], doc["summary"],
    )

    # If this meeting's own text also indicates an earlier commitment was
    # fulfilled ("sent that already"), close it automatically.
    auto_closed = _auto_close_commitments(
        db, g.user_id, contact_id, f"{doc['summary']}\n{doc['action_items']}"
    )

    return jsonify({
        "meeting": serialize_doc(doc),
        "commitments": serialize_list(commitments),
        "auto_closed_commitment_ids": auto_closed,
    }), 201


@meetings_bp.route("/voice", methods=["POST"])
@login_required
def create_meeting_from_voice():
    """Create a meeting from a recorded voice note instead of typed text."""
    contact_id = request.form.get("contact_id")
    if not contact_id:
        return jsonify({"error": "contact_id is required"}), 400

    contact_oid = _oid(contact_id)
    if not contact_oid:
        return jsonify({"error": "Invalid contact_id"}), 400

    if "audio" not in request.files:
        return jsonify({"error": "audio file is required"}), 400

    db = get_db()
    contact = db.contacts.find_one({"_id": contact_oid, "user_id": g.user_id})
    if not contact:
        return jsonify({"error": "Contact not found"}), 404

    language_code = request.form.get("language_code", "unknown")
    try:
        result = transcribe_audio(request.files["audio"], language_code)
    except SarvamError as exc:
        return jsonify({"error": str(exc)}), 502

    transcript = result["transcript"]
    if not transcript:
        return jsonify({"error": "Could not transcribe any speech from the audio"}), 422

    date_str = request.form.get("date") or datetime.datetime.utcnow().strftime("%Y-%m-%d")

    doc = {
        "user_id": g.user_id,
        "contact_id": contact_id,
        "date": date_str,
        "summary": transcript,
        "key_points": "",
        "personal_details": "",
        "action_items": transcript,
        "follow_up_date": "",
        "source": "voice",
        "detected_language": result.get("language_code", language_code),
        "created_at": datetime.datetime.utcnow(),
    }
    insert_result = db.meetings.insert_one(doc)
    doc["_id"] = insert_result.inserted_id

    meetings = list(db.meetings.find({"user_id": g.user_id, "contact_id": contact_id}).sort("date", -1))
    score = compute_relationship_score(meetings, contact)
    db.contacts.update_one(
        {"_id": contact_oid},
        {"$set": {
            "last_interaction": date_str,
            "relationship_score": score,
            "updated_at": datetime.datetime.utcnow(),
        }},
    )

    retain_meeting_memory(g.user_id, contact_id, contact.get("name", ""), doc)

    commitments = _save_commitments(
        db, g.user_id, contact_id, contact.get("name", ""),
        doc["_id"], doc["date"], doc["action_items"], doc["summary"],
    )

    auto_closed = _auto_close_commitments(db, g.user_id, contact_id, transcript)

    return jsonify({
        "meeting": serialize_doc(doc),
        "commitments": serialize_list(commitments),
        "auto_closed_commitment_ids": auto_closed,
        "transcript": transcript,
    }), 201


@meetings_bp.route("/<meeting_id>", methods=["GET"])
@login_required
def get_meeting(meeting_id):
    oid = _oid(meeting_id)
    if not oid:
        return jsonify({"error": "Invalid meeting id"}), 400

    db = get_db()
    meeting = db.meetings.find_one({"_id": oid, "user_id": g.user_id})
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404

    return jsonify({"meeting": serialize_doc(meeting)}), 200


@meetings_bp.route("/<meeting_id>", methods=["PUT", "PATCH"])
@login_required
def update_meeting(meeting_id):
    oid = _oid(meeting_id)
    if not oid:
        return jsonify({"error": "Invalid meeting id"}), 400

    data = request.get_json(silent=True) or {}
    db = get_db()
    existing = db.meetings.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Meeting not found"}), 404

    update = {}
    for field in ["date", "summary", "key_points", "personal_details", "action_items", "follow_up_date"]:
        if field in data:
            update[field] = (data.get(field) or "").strip()

    db.meetings.update_one({"_id": oid}, {"$set": update})
    updated = db.meetings.find_one({"_id": oid})

    # Re-retain updated content so memory reflects edits
    contact = db.contacts.find_one({"_id": _oid(existing["contact_id"]), "user_id": g.user_id})
    if contact:
        retain_meeting_memory(g.user_id, existing["contact_id"], contact.get("name", ""), updated)

    return jsonify({"meeting": serialize_doc(updated)}), 200


@meetings_bp.route("/<meeting_id>", methods=["DELETE"])
@login_required
def delete_meeting(meeting_id):
    oid = _oid(meeting_id)
    if not oid:
        return jsonify({"error": "Invalid meeting id"}), 400

    db = get_db()
    existing = db.meetings.find_one({"_id": oid, "user_id": g.user_id})
    if not existing:
        return jsonify({"error": "Meeting not found"}), 404

    db.meetings.delete_one({"_id": oid})

    # Recompute relationship score
    contact_oid = _oid(existing["contact_id"])
    contact = db.contacts.find_one({"_id": contact_oid, "user_id": g.user_id})
    if contact:
        meetings = list(db.meetings.find({"user_id": g.user_id, "contact_id": existing["contact_id"]}).sort("date", -1))
        score = compute_relationship_score(meetings, contact)
        last_interaction = meetings[0]["date"] if meetings else None
        db.contacts.update_one(
            {"_id": contact_oid},
            {"$set": {"relationship_score": score, "last_interaction": last_interaction}},
        )

    return jsonify({"message": "Meeting deleted"}), 200
