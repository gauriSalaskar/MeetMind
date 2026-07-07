from flask import Flask, jsonify
from flask_cors import CORS

from app.config import Config
from app.routes.auth import auth_bp
from app.routes.contacts import contacts_bp
from app.routes.meetings import meetings_bp
from app.routes.ai import ai_bp
from app.routes.reminders import reminders_bp
from app.routes.dashboard import dashboard_bp
from app.routes.commitments import commitments_bp
from app.routes.notifications import notifications_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    cors_origins = Config.CORS_ORIGINS
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(meetings_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(reminders_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(commitments_bp)
    app.register_blueprint(notifications_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

    if Config.EMAIL_NOTIFICATIONS_ENABLED and not app.config.get("_scheduler_started"):
        _start_notification_scheduler()
        app.config["_scheduler_started"] = True

    return app


def _start_notification_scheduler():
    """Runs the commitment digest check once a day at 08:00 server time.
    Only starts once per process (guarded in create_app via _scheduler_started).
    """
    from apscheduler.schedulers.background import BackgroundScheduler
    from app.services.commitment_notifier import check_and_notify_all_users

    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(check_and_notify_all_users, "cron", hour=8, minute=0)
    scheduler.start()


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)