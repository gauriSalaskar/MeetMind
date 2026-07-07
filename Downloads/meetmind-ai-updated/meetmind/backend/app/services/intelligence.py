"""
Relationship Intelligence Service

This is where "memory becomes the star". For any contact we:
  1. RECALL relevant memories from that contact's Hindsight bank
     (facts, preferences, past commitments, conversation history)
  2. Combine recalled memories with structured Mongo data (meetings,
     notes, category, role)
  3. GENERATE polished output with Claude: things to remember, open
     loops, conversation starters, meeting prep briefs, full AI briefs,
     and relationship scores.

Every time a meeting is logged, its content is RETAINED into Hindsight,
so the next recall reflects the new information -- the agent's
understanding of the relationship literally improves over time.
"""

from app.services.hindsight_client import hindsight
from app.services.groq_client import ask_claude_json, ask_claude


def contact_bank_id(user_id: str, contact_id: str) -> str:
    return hindsight.bank_id_for_contact(user_id, contact_id)


def retain_meeting_memory(user_id: str, contact_id: str, contact_name: str, meeting: dict) -> bool:
    """Push a newly logged meeting into the contact's Hindsight bank."""
    bank_id = contact_bank_id(user_id, contact_id)
    content_parts = [f"Meeting with {contact_name} on {meeting.get('date', 'an unspecified date')}."]
    if meeting.get("summary"):
        content_parts.append(f"Summary: {meeting['summary']}")
    if meeting.get("key_points"):
        content_parts.append(f"Key discussion points: {meeting['key_points']}")
    if meeting.get("personal_details"):
        content_parts.append(f"Personal details learned: {meeting['personal_details']}")
    if meeting.get("action_items"):
        content_parts.append(f"Action items / commitments: {meeting['action_items']}")
    if meeting.get("follow_up_date"):
        content_parts.append(f"Follow-up date: {meeting['follow_up_date']}")

    content = "\n".join(content_parts)
    return hindsight.retain(
        bank_id,
        content,
        tags=[f"contact:{contact_id}", f"user:{user_id}", "meeting"],
    )


def _recall_block(user_id: str, contact_id: str, query: str) -> str:
    bank_id = contact_bank_id(user_id, contact_id)
    memories = hindsight.recall(bank_id, query)
    if not memories:
        return "(No prior memories recalled yet for this contact.)"
    return "\n".join(f"- {m}" for m in memories)


def generate_relationship_intelligence(user_id: str, contact: dict, meetings: list[dict]) -> dict:
    """Generate Things To Remember / Open Loops / Conversation Starters."""
    contact_id = str(contact["_id"])
    recalled = _recall_block(
        user_id, contact_id,
        f"Important personal details, preferences, commitments, and open items about {contact.get('name')}"
    )

    meetings_summary = "\n".join(
        f"- {m.get('date', '')}: {m.get('summary', '')} | Action items: {m.get('action_items', '')}"
        for m in meetings[:10]
    ) or "(No meetings logged yet.)"

    system = (
        "You are MeetMind AI's relationship intelligence engine. You analyze recalled "
        "memories and meeting history about a professional contact and produce concise, "
        "useful relationship intelligence. Respond ONLY with valid JSON, no preamble, "
        "no markdown fences."
    )
    user = f"""Contact: {contact.get('name')} ({contact.get('role', 'Unknown role')} at {contact.get('company', 'Unknown company')})
Category: {contact.get('category', 'Other')}
Notes: {contact.get('notes', '')}

Recalled memories from Hindsight:
{recalled}

Recent meetings:
{meetings_summary}

Return JSON with this exact shape:
{{
  "things_to_remember": ["short factual bullet", ...up to 5],
  "open_loops": ["pending commitment", ...up to 5],
  "conversation_starters": ["natural conversation starter", ...up to 4]
}}

If there isn't enough information for a category, return an empty array for it. Keep each bullet under 15 words."""

    result = ask_claude_json(system, user, max_tokens=800)
    return {
        "things_to_remember": result.get("things_to_remember", []),
        "open_loops": result.get("open_loops", []),
        "conversation_starters": result.get("conversation_starters", []),
    }


def generate_meeting_prep(user_id: str, contact: dict, meetings: list[dict]) -> dict:
    """Flagship AI Meeting Prep -- full pre-meeting command center brief."""
    contact_id = str(contact["_id"])
    recalled = _recall_block(
        user_id, contact_id,
        f"Everything relevant to prepare for an upcoming meeting with {contact.get('name')}: "
        f"past discussions, commitments, personal facts, preferences"
    )

    last_meeting = meetings[0] if meetings else None
    last_meeting_text = (
        f"{last_meeting.get('date', '')}: {last_meeting.get('summary', '')}"
        if last_meeting else "(No previous meetings on record.)"
    )

    system = (
        "You are MeetMind AI's meeting preparation engine. Given recalled relationship "
        "memories and contact data, produce a sharp pre-meeting brief. Respond ONLY with "
        "valid JSON, no preamble, no markdown fences."
    )
    user = f"""Contact: {contact.get('name')} ({contact.get('role', 'Unknown role')} at {contact.get('company', 'Unknown company')})
Category: {contact.get('category', 'Other')}

Recalled memories from Hindsight:
{recalled}

Last interaction: {last_meeting_text}

Return JSON with this exact shape:
{{
  "relationship_summary": "2-3 sentence summary of the relationship and its current state",
  "last_interaction_recap": "1-2 sentence recap of the most recent interaction",
  "important_facts": ["fact about them", ...up to 5],
  "open_commitments": ["thing owed by either party", ...up to 5],
  "talking_points": ["suggested talking point", ...up to 4],
  "recommended_actions": ["recommended follow-up action", ...up to 3]
}}

Keep every item under 18 words. If information is missing, return an empty array rather than guessing."""

    return ask_claude_json(system, user, max_tokens=1000)


def generate_ai_brief(user_id: str, contact: dict, meetings: list[dict]) -> dict:
    """Full AI Brief page -- broader narrative than meeting prep."""
    intelligence = generate_relationship_intelligence(user_id, contact, meetings)
    contact_id = str(contact["_id"])
    recalled = _recall_block(
        user_id, contact_id,
        f"Full relationship history and context for {contact.get('name')}"
    )

    system = (
        "You are MeetMind AI's briefing engine. Write a warm, professional relationship "
        "summary based on recalled memories. Respond ONLY with valid JSON, no preamble, "
        "no markdown fences."
    )
    user = f"""Contact: {contact.get('name')} ({contact.get('role', 'Unknown role')} at {contact.get('company', 'Unknown company')})
Category: {contact.get('category', 'Other')}
Notes: {contact.get('notes', '')}

Recalled memories from Hindsight:
{recalled}

Things to remember: {intelligence['things_to_remember']}
Open loops: {intelligence['open_loops']}

Return JSON with this exact shape:
{{
  "relationship_summary": "3-4 sentence narrative summary of the relationship",
  "things_to_remember": ["fact", ...],
  "open_loops": ["pending item", ...],
  "conversation_starters": ["starter", ...],
  "suggested_actions": ["action", ...up to 4]
}}

Reuse the provided things_to_remember and open_loops, and add suggested_actions and conversation_starters."""

    result = ask_claude_json(system, user, max_tokens=1200)
    # Ensure fields exist even if Claude omits them
    result.setdefault("things_to_remember", intelligence["things_to_remember"])
    result.setdefault("open_loops", intelligence["open_loops"])
    result.setdefault("conversation_starters", intelligence["conversation_starters"])
    result.setdefault("suggested_actions", [])
    return result


def compute_relationship_score(meetings: list[dict], contact: dict) -> int:
    """Heuristic relationship score 0-100, used to drive the Memory Ring."""
    score = 10
    score += min(len(meetings) * 12, 60)
    if contact.get("notes"):
        score += 5
    for m in meetings:
        if m.get("personal_details"):
            score += 4
        if m.get("action_items"):
            score += 2
    return max(0, min(100, score))


def ai_memory_search(user_id: str, query: str, contacts: list[dict]) -> dict:
    """Natural language search across all contacts using Hindsight + Claude.

    For performance, we recall from each contact's bank using the query,
    then ask Claude to rank/explain which contacts match.
    """
    candidates = []
    for c in contacts:
        contact_id = str(c["_id"])
        bank_id = contact_bank_id(user_id, contact_id)
        memories = hindsight.recall(bank_id, query, limit=4)
        if memories or query.lower() in (c.get("notes", "") or "").lower():
            candidates.append({
                "id": contact_id,
                "name": c.get("name"),
                "role": c.get("role"),
                "company": c.get("company"),
                "category": c.get("category"),
                "notes": c.get("notes", ""),
                "memories": memories,
            })

    if not candidates:
        # Fall back: let Claude reason over notes alone for all contacts
        candidates = [{
            "id": str(c["_id"]),
            "name": c.get("name"),
            "role": c.get("role"),
            "company": c.get("company"),
            "category": c.get("category"),
            "notes": c.get("notes", ""),
            "memories": [],
        } for c in contacts]

    system = (
        "You are MeetMind AI's natural-language memory search. Given a user query and a "
        "list of candidate contacts with recalled memories and notes, return only the "
        "contacts that are actually relevant, with a short reason. Respond ONLY with "
        "valid JSON, no preamble, no markdown fences."
    )
    user = f"""Query: "{query}"

Candidates:
{candidates}

Return JSON with this exact shape:
{{
  "results": [
    {{"id": "<contact id>", "name": "<name>", "reason": "short reason this matches, under 15 words"}}
  ]
}}

Only include contacts that genuinely match the query's intent. If none match, return an empty results array."""

    result = ask_claude_json(system, user, max_tokens=800)
    return result if "results" in result else {"results": []}