from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from bson.errors import InvalidId

from app.db import get_db
from app.utils.auth import login_required
from app.utils.serialize import serialize_list
from app.services.intelligence import (
    generate_relationship_intelligence,
    generate_meeting_prep,
    generate_ai_brief,
    ai_memory_search,
)

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


def _oid(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError):
        return None


def _get_contact_and_meetings(contact_id: str):
    db = get_db()
    oid = _oid(contact_id)
    if not oid:
        return None, None
    contact = db.contacts.find_one({"_id": oid, "user_id": g.user_id})
    if not contact:
        return None, None
    meetings = list(
        db.meetings.find({"user_id": g.user_id, "contact_id": contact_id}).sort("date", -1)
    )
    return contact, meetings


@ai_bp.route("/intelligence/<contact_id>", methods=["GET"])
@login_required
def relationship_intelligence(contact_id):
    contact, meetings = _get_contact_and_meetings(contact_id)
    if contact is None:
        return jsonify({"error": "Contact not found"}), 404

    intelligence = generate_relationship_intelligence(g.user_id, contact, meetings)
    return jsonify(intelligence), 200


@ai_bp.route("/meeting-prep/<contact_id>", methods=["GET"])
@login_required
def meeting_prep(contact_id):
    contact, meetings = _get_contact_and_meetings(contact_id)
    if contact is None:
        return jsonify({"error": "Contact not found"}), 404

    prep = generate_meeting_prep(g.user_id, contact, meetings)
    return jsonify(prep), 200


@ai_bp.route("/brief/<contact_id>", methods=["GET"])
@login_required
def ai_brief(contact_id):
    contact, meetings = _get_contact_and_meetings(contact_id)
    if contact is None:
        return jsonify({"error": "Contact not found"}), 404

    brief = generate_ai_brief(g.user_id, contact, meetings)
    brief["contact_name"] = contact.get("name")
    brief["contact_role"] = contact.get("role")
    brief["contact_company"] = contact.get("company")
    return jsonify(brief), 200


@ai_bp.route("/brief/<contact_id>/export", methods=["GET"])
@login_required
def ai_brief_export(contact_id):
    from flask import Response
    from app.services.pdf_export import build_contact_brief_pdf

    contact, meetings = _get_contact_and_meetings(contact_id)
    if contact is None:
        return jsonify({"error": "Contact not found"}), 404

    brief = generate_ai_brief(g.user_id, contact, meetings)
    pdf_bytes = build_contact_brief_pdf(contact, brief, meetings)

    safe_name = "".join(c for c in contact.get("name", "contact") if c.isalnum() or c in " _-").strip() or "contact"
    filename = f"{safe_name.replace(' ', '_')}_brief.pdf"

    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@ai_bp.route("/search", methods=["POST"])
@login_required
def memory_search():
    data = request.get_json(silent=True) or {}
    query = (data.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    db = get_db()
    contacts = list(db.contacts.find({"user_id": g.user_id}))
    if not contacts:
        return jsonify({"results": []}), 200

    result = ai_memory_search(g.user_id, query, contacts)

    # Enrich results with full contact data for the frontend
    contacts_by_id = {str(c["_id"]): c for c in contacts}
    enriched = []
    for r in result.get("results", []):
        c = contacts_by_id.get(r.get("id"))
        if not c:
            continue
        enriched.append({
            "id": str(c["_id"]),
            "name": c.get("name"),
            "role": c.get("role"),
            "company": c.get("company"),
            "category": c.get("category"),
            "initials": c.get("initials"),
            "reason": r.get("reason", ""),
        })

    return jsonify({"results": enriched}), 200