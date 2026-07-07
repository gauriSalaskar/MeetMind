"""
Groq generation service.

Hindsight handles *memory* (retain/recall of facts about each relationship).
Groq (running an open-weight LLM, e.g. Llama 3.3 70B) handles *generation* --
turning recalled memories + structured contact data into polished,
human-readable output: relationship intelligence, meeting prep briefs, full
AI briefs, and natural-language memory search answers.

Groq exposes an OpenAI-compatible /chat/completions API, so we use the
`openai` SDK pointed at Groq's base URL instead of a Groq-specific SDK.
"""

import json
from openai import OpenAI
from app.config import Config

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        if not Config.GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to backend/.env"
            )
        _client = OpenAI(
            api_key=Config.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


def _extract_text(completion) -> str:
    return (completion.choices[0].message.content or "").strip()


def ask_claude(system: str, user: str, max_tokens: int = 1500) -> str:
    """Kept the name `ask_claude` so callers elsewhere don't need to change."""
    client = get_client()
    completion = client.chat.completions.create(
        model=Config.GROQ_MODEL,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return _extract_text(completion)


def ask_claude_json(system: str, user: str, max_tokens: int = 1500) -> dict:
    """Ask the model for a response and parse it strictly as JSON.

    The system prompt MUST instruct the model to return only JSON.
    """
    raw = ask_claude(system, user, max_tokens=max_tokens)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                pass
        return {"_raw": raw}