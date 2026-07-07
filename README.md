# MeetMind AI — Your Second Brain For Relationships

A premium AI-powered Relationship Intelligence Platform. MeetMind AI remembers
people, conversations, commitments, and personal details using **Hindsight**
(Vectorize's persistent memory layer) for recall and **Claude** for generation.

**New:** MeetMind now tracks commitments automatically. When you log a
meeting (typed or spoken), Claude extracts concrete promises/action items
into trackable commitments with due dates, and follows up on them until
they're closed — no manual to-do list required. Voice notes are transcribed
via **Sarvam AI**, so you can record a meeting note in your own language
instead of typing it.

---

## How memory works in this project

- **MongoDB** stores structured data: users, contacts, meetings, reminders,
  and (new) commitments.
  This powers CRUD, the dashboard, and the meeting timeline.
- **Hindsight** stores the evolving "memory" of each relationship. Every
  contact gets its own memory bank (`user_{userId}_contact_{contactId}`).
  Every time you log a meeting, its content is **retained** into that
  contact's bank.
- **Claude** generates all AI-facing text (Relationship Intelligence, AI
  Meeting Prep, AI Brief, AI Memory Search) and now also **extracts
  commitments** from action items / voice transcripts into structured,
  trackable items with due dates.
- **Sarvam AI** transcribes voice notes into text (any supported language),
  which flows into the same commitment-extraction and memory-retention
  pipeline as typed meeting notes.

If Hindsight isn't configured, the app still works end-to-end (Claude will
just generate from the structured Mongo data + notes, with less depth).

---

## Project structure

```
meetmind/
  backend/    Flask API (auth, contacts, meetings, AI, reminders, commitments, dashboard)
  frontend/   React + Tailwind + Framer Motion SPA
  RENDER_WORKFLOW.md   Durable follow-up/escalation agent for commitments (Render Workflows)
```

---

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # on Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string (include a db name) |
| `JWT_SECRET` | Any long random string |
| `ANTHROPIC_API_KEY` | Your Anthropic Claude API key |
| `HINDSIGHT_BASE_URL` | Base URL of your Hindsight Cloud instance |
| `HINDSIGHT_API_KEY` | API key from ui.hindsight.vectorize.io |
| `HINDSIGHT_TENANT` | (optional) tenant slug, if your Hindsight URL includes one |
| `SARVAM_API_KEY` | API key from dashboard.sarvam.ai — **required** for voice meeting notes |

Run the server:

```bash
python run.py
```

The API runs on `http://localhost:5000`. Health check: `GET /api/health`.

---

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

By default `frontend/.env` points to `http://localhost:5000/api` — change
`VITE_API_URL` if your backend runs elsewhere.

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## 3. Using the app

1. Sign up for an account.
2. Add a contact (Contacts → Add Contact).
3. Open the contact and log a meeting (include "Personal Details Learned"
   and "Action Items" — this is what gets retained into Hindsight memory
   and parsed into commitments), **or** tap **Voice Note** and speak it
   instead — Sarvam AI transcribes it and the same extraction pipeline runs.
4. Check the **Commitments** panel on the contact page (and the Dashboard
   sidebar) — anything you or they promised shows up automatically, tagged
   open / due today / overdue, without you having to add it yourself.
5. Click **AI Meeting Prep** to see Hindsight recall + Claude generation in
   action. The brief gets richer as you log more meetings.
6. Try **AI Memory Search** from the sidebar — ask things like "who likes
   cricket?" or "who is building a startup?".
7. Visit **AI Brief** on a contact page for a full exportable relationship
   briefing.
8. See `RENDER_WORKFLOW.md` for how to deploy the background agent that
   reminds and escalates on overdue commitments in production.

---

## API overview

All endpoints are under `/api`. Protected endpoints require
`Authorization: Bearer <token>`.

- `POST /auth/signup`, `POST /auth/signin`, `GET /auth/me`, `POST /auth/logout`
- `GET/POST /contacts`, `GET/PUT/DELETE /contacts/:id`
- `GET/POST /meetings`, `GET/PUT/DELETE /meetings/:id`
- `POST /meetings/voice` — create a meeting from a recorded voice note (multipart: `audio`, `contact_id`, optional `date`, `language_code`) — transcribed via Sarvam AI
- `GET /ai/intelligence/:contactId` — Things to Remember / Open Loops / Conversation Starters
- `GET /ai/meeting-prep/:contactId` — AI Meeting Prep command center
- `GET /ai/brief/:contactId` — full AI Brief
- `POST /ai/search` — natural-language Memory Search (`{ "query": "..." }`)
- `GET/POST /reminders`, `PATCH/DELETE /reminders/:id`
- `GET/POST /commitments`, `PATCH/DELETE /commitments/:id` — tracked promises/action items, auto-extracted from meetings and voice notes (query params: `contact_id`, `status`)
- `GET /dashboard` — stats, recent contacts, follow-ups, relationship overview

---

## Notes

- Passwords are hashed with bcrypt; sessions use JWTs (default 72h expiry).
- Relationship score (and the Memory Ring) is computed heuristically from
  meeting count and richness, then surfaced as Beginner → Deep Relationship.
- If `ANTHROPIC_API_KEY` is missing, AI routes (including commitment
  extraction) will return errors — set it before using AI features.
- If `SARVAM_API_KEY` is missing, `/meetings/voice` will return a clear
  502 error rather than failing silently.

