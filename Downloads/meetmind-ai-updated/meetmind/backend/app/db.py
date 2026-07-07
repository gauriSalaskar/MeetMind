from pymongo import MongoClient
from pymongo.database import Database
from app.config import Config

_client: MongoClient | None = None
_db: Database | None = None


def get_db() -> Database:
    """Return a singleton MongoDB database handle."""
    global _client, _db
    if _db is None:
        if not Config.MONGO_URI:
            raise RuntimeError(
                "MONGO_URI is not set. Copy backend/.env.example to backend/.env "
                "and fill in your MongoDB Atlas connection string."
            )
        _client = MongoClient(Config.MONGO_URI)
        _db = _client.get_default_database()
        if _db is None:
            # If the URI doesn't include a default db name, fall back explicitly
            _db = _client["meetmind"]
        _ensure_indexes(_db)
    return _db


def _ensure_indexes(db: Database) -> None:
    db.users.create_index("email", unique=True)
    db.contacts.create_index([("user_id", 1)])
    db.meetings.create_index([("user_id", 1), ("contact_id", 1)])
    db.reminders.create_index([("user_id", 1), ("due_date", 1)])
    db.commitments.create_index([("user_id", 1), ("contact_id", 1)])
    db.commitments.create_index([("user_id", 1), ("due_date", 1)])
