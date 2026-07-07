"""
MeetMind Commitment Follow-Up Worker (Render Workflow)

This is the durable agent that makes commitments self-following-up instead
of a static list: it polls MeetMind's own API for open/overdue commitments
and drives them through reminder -> escalation notifications.

Deploy this as a separate Render *Background Worker* (not the Flask web
service) using render.yaml in this same folder. It talks to the existing
Flask API over HTTP -- it does not touch MongoDB directly -- so the API is
always the single source of truth for commitment status.

Run locally for testing:
    MEETMIND_API_BASE=http://localhost:5000/api \
    MEETMIND_SERVICE_TOKEN=<a JWT from signing in> \
    python workflow/commitment_workflow.py
"""

import os
import sys
import time
import requests

API_BASE = os.environ.get("MEETMIND_API_BASE", "http://localhost:5000/api")
TOKEN = os.environ.get("MEETMIND_SERVICE_TOKEN", "")

# Compressed for demo purposes -- in production this would be e.g. 3600
# (once an hour) since due_date is date-only, not a timestamp.
POLL_INTERVAL_SECONDS = int(os.environ.get("MEETMIND_POLL_INTERVAL", "30"))

HEADERS = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

# In-memory dedupe so we don't spam the same notification every poll cycle.
_already_notified = set()


def _fetch(status: str) -> list[dict]:
    resp = requests.get(f"{API_BASE}/commitments", headers=HEADERS, params={"status": status}, timeout=15)
    resp.raise_for_status()
    return resp.json().get("commitments", [])


def notify(commitment: dict, stage: str) -> None:
    """Deliver a notification for this commitment. Replace the print with
    a real channel (push notification service, email, Slack webhook, etc)
    when wiring this up for production."""
    key = (commitment["id"], stage)
    if key in _already_notified:
        return
    _already_notified.add(key)

    who = commitment.get("contact_name") or "someone"
    due = commitment.get("due_date") or "no date"
    print(f"[{stage.upper()}] {who}: \"{commitment['text']}\" (due {due})", flush=True)
    # Example real integration:
    # requests.post(SLACK_WEBHOOK_URL, json={"text": f"Reminder: {commitment['text']}"})


def run_once() -> None:
    try:
        due_today = _fetch("due_today")
        for c in due_today:
            notify(c, "reminder")
    except requests.RequestException as exc:
        print(f"could not fetch due_today commitments: {exc}", file=sys.stderr)

    try:
        overdue = _fetch("overdue")
        for c in overdue:
            notify(c, "escalation")
    except requests.RequestException as exc:
        print(f"could not fetch overdue commitments: {exc}", file=sys.stderr)


def main() -> None:
    if not TOKEN:
        print(
            "WARNING: MEETMIND_SERVICE_TOKEN is not set -- requests to protected "
            "endpoints will fail. Set it to a valid JWT (e.g. from POST /auth/signin).",
            file=sys.stderr,
        )
    print(f"MeetMind commitment workflow running against {API_BASE}, polling every {POLL_INTERVAL_SECONDS}s", flush=True)
    while True:
        run_once()
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
