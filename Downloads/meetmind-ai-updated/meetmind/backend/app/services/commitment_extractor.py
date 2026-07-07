"""
Commitment Extraction Service

"The Room Remembers" -- turns free-text action items / meeting notes into
structured, trackable commitments: { text, due_date }.

This runs right after a meeting is saved (typed or voice-transcribed via
Sarvam). Each extracted commitment is stored in its own `commitments`
collection so it can be tracked, reminded on, escalated, and closed --
independent of the raw meeting text it came from.
"""

import datetime
from app.services.groq_client import ask_claude_json

SYSTEM_PROMPT = (
    "You extract concrete commitments (promises, action items, follow-ups) "
    "from meeting notes. A commitment is something a specific person said "
    "they would do, or something the user needs to do for this contact. "
    "For each commitment, infer a due_date in YYYY-MM-DD format if one is "
    "stated or implied (e.g. 'by Friday', 'next week'); otherwise use null. "
    "Use the meeting date as the reference point for relative dates. "
    "Respond ONLY with valid JSON in this exact shape, no preamble, no "
    "markdown fences: "
    '{"commitments": [{"text": "...", "due_date": "YYYY-MM-DD or null"}]}. '
    "If there are no clear commitments, return an empty list."
)


def extract_commitments(meeting_date: str, action_items: str, summary: str = "") -> list[dict]:
    """Extract structured commitments from a meeting's text content.

    Returns a list of {text, due_date} dicts. Never raises -- returns an
    empty list on any failure so this never blocks meeting creation.
    """
    combined = (action_items or "").strip()
    if summary:
        combined = f"{combined}\nContext / summary: {summary}".strip()

    if not combined:
        return []

    user_prompt = (
        f"Meeting date (reference point for relative dates): {meeting_date}\n\n"
        f"Action items / notes to extract commitments from:\n{combined}"
    )

    try:
        result = ask_claude_json(SYSTEM_PROMPT, user_prompt, max_tokens=800)
    except Exception:
        return []

    raw_commitments = result.get("commitments") if isinstance(result, dict) else None
    if not isinstance(raw_commitments, list):
        return []

    cleaned = []
    for item in raw_commitments:
        if not isinstance(item, dict):
            continue
        text = (item.get("text") or "").strip()
        if not text:
            continue
        due_date = item.get("due_date")
        if due_date in (None, "null", ""):
            due_date = None
        else:
            # Validate it actually parses as a date; otherwise drop it.
            try:
                datetime.datetime.strptime(due_date, "%Y-%m-%d")
            except (ValueError, TypeError):
                due_date = None
        cleaned.append({"text": text, "due_date": due_date})

    return cleaned


def compute_status(due_date: str | None, done: bool) -> str:
    """Compute a commitment's display status."""
    if done:
        return "done"
    if not due_date:
        return "open"
    today = datetime.date.today().isoformat()
    if due_date < today:
        return "overdue"
    if due_date == today:
        return "due_today"
    return "open"


CLOSE_MATCH_SYSTEM_PROMPT = (
    "You check whether a new piece of text (a fresh meeting note or voice "
    "transcript) indicates that any of a list of previously open "
    "commitments has now been completed. Only match a commitment if the "
    "new text clearly says or strongly implies it was done -- do not guess "
    "or assume completion from vague mentions. Respond ONLY with valid "
    'JSON, no preamble, no markdown fences: {"completed_ids": ["..."]}. '
    "If nothing was clearly completed, return an empty list."
)


def find_completed_commitments(new_text: str, open_commitments: list[dict]) -> list[str]:
    """Given fresh meeting/voice text and a contact's open commitments,
    return the ids of any commitments that text indicates are now done.

    `open_commitments` items must each have an "id" and "text" field.
    Never raises -- returns an empty list on any failure.
    """
    if not new_text or not open_commitments:
        return []

    listing = "\n".join(f'- id={c["id"]}: "{c["text"]}"' for c in open_commitments)
    user_prompt = (
        f"Previously open commitments for this person:\n{listing}\n\n"
        f"New note / transcript just recorded:\n{new_text}"
    )

    try:
        result = ask_claude_json(CLOSE_MATCH_SYSTEM_PROMPT, user_prompt, max_tokens=400)
    except Exception:
        return []

    completed_ids = result.get("completed_ids") if isinstance(result, dict) else None
    if not isinstance(completed_ids, list):
        return []

    valid_ids = {c["id"] for c in open_commitments}
    return [cid for cid in completed_ids if cid in valid_ids]