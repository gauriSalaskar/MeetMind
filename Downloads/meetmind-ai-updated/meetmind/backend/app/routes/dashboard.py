from flask import Blueprint, jsonify, g
import datetime

from app.db import get_db
from app.utils.auth import login_required
from app.utils.serialize import serialize_list

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("", methods=["GET"])
@login_required
def dashboard_summary():
    db = get_db()
    user_id = g.user_id

    contacts = list(db.contacts.find({"user_id": user_id}))
    meetings_count = db.meetings.count_documents({"user_id": user_id})

    total_contacts = len(contacts)
    if total_contacts:
        avg_score = round(
            sum(c.get("relationship_score", 0) for c in contacts) / total_contacts
        )
    else:
        avg_score = 0

    today = datetime.date.today().isoformat()
    follow_ups_due = db.reminders.count_documents({
        "user_id": user_id,
        "completed": {"$ne": True},
        "due_date": {"$lte": today},
    })

    recent_contacts = sorted(
        contacts, key=lambda c: c.get("created_at") or datetime.datetime.min, reverse=True
    )[:5]

    upcoming_reminders = list(
        db.reminders.find({"user_id": user_id, "completed": {"$ne": True}})
        .sort("due_date", 1)
        .limit(5)
    )

    healthy = [c for c in contacts if c.get("relationship_score", 0) >= 50]
    needs_attention = [c for c in contacts if c.get("relationship_score", 0) < 50]

    return jsonify({
        "stats": {
            "total_contacts": total_contacts,
            "meetings_logged": meetings_count,
            "memory_score_average": avg_score,
            "follow_ups_due": follow_ups_due,
        },
        "recent_contacts": serialize_list(recent_contacts),
        "upcoming_follow_ups": serialize_list(upcoming_reminders),
        "relationship_overview": {
            "healthy_count": len(healthy),
            "needs_attention_count": len(needs_attention),
            "healthy": serialize_list(healthy[:5]),
            "needs_attention": serialize_list(needs_attention[:5]),
        },
    }), 200
