from bson import ObjectId
import datetime


def serialize_doc(doc: dict) -> dict:
    """Convert a Mongo document into a JSON-serializable dict."""
    if doc is None:
        return None
    out = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = str(value)
        elif key == "password_hash":
            continue
        elif isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, datetime.datetime):
            out[key] = value.isoformat() + "Z"
        elif isinstance(value, list):
            out[key] = [
                str(v) if isinstance(v, ObjectId) else v for v in value
            ]
        else:
            out[key] = value
    return out


def serialize_list(docs) -> list:
    return [serialize_doc(d) for d in docs]
