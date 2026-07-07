"""
Finds commitments that are due today or overdue and sends each user a single
digest email, at most once per day per commitment, using a `last_notified`
date stamp stored on the commitment document.
"""

import datetime

from app.db import get_db
from app.services.commitment_extractor import compute_status
from app.services.email_service import send_email


def _build_digest_html(user_name: str, due_today: list[dict], overdue: list[dict]) -> str:
    def _rows(items, label_color):
        if not items:
            return "<p style='color:#888;font-size:13px;'>None</p>"
        rows = ""
        for c in items:
            who = c.get("contact_name") or "Someone"
            rows += (
                f"<li style='margin-bottom:8px;'>"
                f"<span style='color:{label_color};font-weight:600;'>{c.get('due_date', '')}</span> "
                f"— {c.get('text', '')} <span style='color:#999;'>({who})</span></li>"
            )
        return f"<ul style='padding-left:18px;margin:0;'>{rows}</ul>"

    return f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color:#2b2320;">Hi {user_name}, here's your commitment digest</h2>
      <h3 style="color:#d9534f;">Overdue ({len(overdue)})</h3>
      {_rows(overdue, "#d9534f")}
      <h3 style="color:#a8623f;margin-top:20px;">Due Today ({len(due_today)})</h3>
      {_rows(due_today, "#a8623f")}
      <p style="color:#a89e97;font-size:12px;margin-top:24px;">Sent by MeetMind AI</p>
    </div>
    """


def check_and_notify_all_users() -> dict:
    """Run the daily check across all users. Returns a summary dict for logging/testing."""
    db = get_db()
    today = datetime.date.today().isoformat()
    users = list(db.users.find({}))
    summary = {"users_checked": 0, "emails_sent": 0}

    for user in users:
        user_id = str(user["_id"])
        summary["users_checked"] += 1
        result = check_and_notify_user(user_id, user, today=today)
        if result:
            summary["emails_sent"] += 1

    return summary


def check_and_notify_user(user_id: str, user: dict | None = None, today: str | None = None) -> bool:
    """Check one user's commitments and email them a digest if there's anything
    due today or overdue that hasn't already been notified today. Returns True
    if an email was sent.
    """
    from bson import ObjectId
    from bson.errors import InvalidId

    db = get_db()
    today = today or datetime.date.today().isoformat()
    if user is None:
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
        except (InvalidId, TypeError):
            user = None
    if not user:
        return False

    commitments = list(db.commitments.find({"user_id": user_id, "done": {"$ne": True}}))

    due_today, overdue = [], []
    to_update_ids = []
    for c in commitments:
        status = compute_status(c.get("due_date"), c.get("done", False))
        if status not in ("due_today", "overdue"):
            continue
        if c.get("last_notified") == today:
            continue  # already notified today
        (due_today if status == "due_today" else overdue).append(c)
        to_update_ids.append(c["_id"])

    if not due_today and not overdue:
        return False

    html = _build_digest_html(user.get("name", "there"), due_today, overdue)
    sent = send_email(
        user.get("email"),
        subject=f"MeetMind: {len(overdue)} overdue, {len(due_today)} due today",
        html_body=html,
    )

    if sent and to_update_ids:
        db.commitments.update_many(
            {"_id": {"$in": to_update_ids}}, {"$set": {"last_notified": today}}
        )

    return sent