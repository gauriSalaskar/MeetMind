"""
Hindsight (Vectorize) memory client.

Hindsight organizes memory into isolated "banks". In MeetMind AI, each
contact gets its own bank, namespaced by the owning user:

    bank_id = "user_{user_id}_contact_{contact_id}"

This keeps every user's relationship memory completely isolated, and lets
each contact accumulate its own evolving knowledge graph (facts, open
loops, preferences) over time -- the core "hindsight" of the product.

Endpoints used (Hindsight HTTP API, /v1/{tenant}/banks/{bank_id}/...):
  POST /memories/retain   -- store new memory content, extracted into facts
  POST /memories/recall    -- semantic + graph + temporal search over memories
  POST /reflect            -- agentic reasoning over the whole bank

If HINDSIGHT_BASE_URL / HINDSIGHT_API_KEY are not configured, every method
degrades gracefully (returns empty results / no-ops) so the rest of the app
keeps working without Hindsight.
"""

import requests
from app.config import Config


class HindsightClient:
    def __init__(self):
        self.base_url = Config.HINDSIGHT_BASE_URL
        self.api_key = Config.HINDSIGHT_API_KEY
        self.tenant = Config.HINDSIGHT_TENANT
        self.enabled = bool(self.base_url and self.api_key)

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _bank_url(self, bank_id: str, path: str) -> str:
        if self.tenant:
            return f"{self.base_url}/v1/{self.tenant}/banks/{bank_id}{path}"
        return f"{self.base_url}/v1/banks/{bank_id}{path}"

    @staticmethod
    def bank_id_for_contact(user_id: str, contact_id: str) -> str:
        return f"user_{user_id}_contact_{contact_id}"

    # ------------------------------------------------------------------
    # Retain: store new memory content for a contact
    # ------------------------------------------------------------------
    def retain(self, bank_id: str, content: str, tags: list[str] | None = None) -> bool:
        if not self.enabled or not content.strip():
            return False
        try:
            payload = {"items": [{"content": content}]}
            if tags:
                payload["items"][0]["tags"] = tags
            resp = requests.post(
                self._bank_url(bank_id, "/memories/retain"),
                json=payload,
                headers=self._headers(),
                timeout=20,
            )
            return resp.ok
        except requests.RequestException:
            return False

    # ------------------------------------------------------------------
    # Recall: search memories relevant to a query
    # ------------------------------------------------------------------
    def recall(self, bank_id: str, query: str, limit: int = 8) -> list[str]:
        if not self.enabled or not query.strip():
            return []
        try:
            resp = requests.post(
                self._bank_url(bank_id, "/memories/recall"),
                json={"query": query, "limit": limit},
                headers=self._headers(),
                timeout=20,
            )
            if not resp.ok:
                return []
            data = resp.json()
            results = data.get("results", [])
            texts = []
            for r in results:
                text = r.get("text") or r.get("content")
                if text:
                    texts.append(text)
            return texts
        except (requests.RequestException, ValueError):
            return []

    # ------------------------------------------------------------------
    # Reflect: agentic reasoning over the whole bank
    # ------------------------------------------------------------------
    def reflect(self, bank_id: str, query: str) -> str | None:
        if not self.enabled or not query.strip():
            return None
        try:
            resp = requests.post(
                self._bank_url(bank_id, "/reflect"),
                json={"query": query},
                headers=self._headers(),
                timeout=40,
            )
            if not resp.ok:
                return None
            data = resp.json()
            return data.get("text")
        except (requests.RequestException, ValueError):
            return None


hindsight = HindsightClient()
