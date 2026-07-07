from flask import Blueprint, jsonify, g

from app.utils.auth import login_required
from app.services.commitment_notifier import check_and_notify_user
from app.config import Config

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.route("/check-now", methods=["POST"])
@login_required
def check_now():
    """Manually trigger a commitment digest check/email for the current user.
    Useful for testing email notifications without waiting for the daily job.
    """
    if not Config.EMAIL_NOTIFICATIONS_ENABLED:
        return jsonify({
            "sent": False,
            "message": "Email notifications aren't configured (missing GMAIL_ADDRESS/GMAIL_APP_PASSWORD).",
        }), 200

    sent = check_and_notify_user(g.user_id)
    return jsonify({
        "sent": sent,
        "message": "Digest email sent." if sent else "Nothing due or overdue right now.",
    }), 200