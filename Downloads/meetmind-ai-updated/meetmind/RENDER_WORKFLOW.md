# Render Workflow: Commitment Follow-Up Agent

This is the piece that makes commitments *self-following-up* instead of
just a static list. It runs on Render as a scheduled/durable Workflow,
separate from the Flask API, and talks to MeetMind's existing
`/api/commitments` endpoints.

## What it does

For every open commitment (`done: false`):

1. **Reminder** — a day before `due_date` (or, for the hackathon demo,
   N minutes before a compressed "due" timestamp), call the MeetMind API
   to check if it's still open. If so, this is where you'd send a push
   notification / email nudge to the user.
2. **Check-in** — on `due_date`, re-check status.
   - If `done: true` → close out, nothing more to do.
   - If still open → mark it `overdue` (this already happens automatically
     via `compute_status()` in the backend — the workflow's job is the
     *notification*, not the status itself).
3. **Escalate** — if still open N days after `due_date`, surface it more
   prominently (e.g. flag it at the top of the contact's page — already
   handled by the `overdue` pill in the UI — and optionally trigger a
   second, more visible notification).

## Why this lives outside the Flask app

Render Workflows are built for exactly this: durable, long-running,
time-delayed steps that survive restarts and don't block your API's
request/response cycle. The Flask backend's job is just to answer
"what commitments exist and what's their status" — the workflow owns
*when* to act on that.

## Workflow definition (render.yaml style)

```yaml
# render.yaml -- add alongside your existing web service
services:
  - type: worker
    name: meetmind-commitment-workflow
    runtime: python
    buildCommand: pip install -r workflow/requirements.txt
    startCommand: python workflow/commitment_workflow.py
    envVars:
      - key: MEETMIND_API_BASE
        value: https://your-backend.onrender.com/api
      - key: MEETMIND_SERVICE_TOKEN
        sync: false   # a long-lived token/service account for server-to-server calls
```

## Reference implementation (`workflow/commitment_workflow.py`)

```python
"""
Runs continuously (or on a schedule) on Render. Polls open commitments
and drives them through reminder -> check-in -> escalate.

For the hackathon demo, compress real days into minutes by running this
loop every 30s and treating `due_date` as a full timestamp instead of a
date-only string, so the audience can watch a commitment go
open -> reminded -> overdue live on stage.
"""

import os
import time
import requests

API_BASE = os.environ["MEETMIND_API_BASE"]
TOKEN = os.environ["MEETMIND_SERVICE_TOKEN"]
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

POLL_INTERVAL_SECONDS = 30  # compressed for demo; use e.g. 3600 in production


def fetch_open_commitments():
    resp = requests.get(f"{API_BASE}/commitments", headers=HEADERS, params={"status": "open"})
    resp.raise_for_status()
    return resp.json().get("commitments", [])


def fetch_overdue_commitments():
    resp = requests.get(f"{API_BASE}/commitments", headers=HEADERS, params={"status": "overdue"})
    resp.raise_for_status()
    return resp.json().get("commitments", [])


def notify(commitment, stage):
    """Placeholder for actual notification delivery (push/email/SMS)."""
    print(f"[{stage}] {commitment['contact_name']}: {commitment['text']} (due {commitment['due_date']})")
    # e.g. requests.post(SLACK_WEBHOOK_URL, json={...})


def run_once():
    for c in fetch_open_commitments():
        notify(c, "reminder")

    for c in fetch_overdue_commitments():
        notify(c, "escalation")


if __name__ == "__main__":
    while True:
        try:
            run_once()
        except Exception as exc:
            print(f"workflow error: {exc}")
        time.sleep(POLL_INTERVAL_SECONDS)
```

## Demo-day shortcut

If you don't want to stand up a separate Render worker before the
deadline, you can simulate the same behavior client-side for the demo:
a `setInterval` in the frontend that re-fetches `/api/commitments` every
few seconds and visually "escalates" overdue items (the pill already
changes color automatically based on `due_date`). The real Render Workflow
above is what you'd point to when judges ask "how does this actually run
in production."
