"""
Sarvam AI voice service.

Lets a user speak a meeting note instead of typing it -- in their own
language. Audio comes in from the frontend recorder, gets sent to Sarvam's
Speech-to-Text API, and the returned transcript is fed into the same
meeting-save + commitment-extraction pipeline as typed text.

Docs: https://docs.sarvam.ai (Speech-to-Text API, saaras:v3 model).
If SARVAM_API_KEY is not set, this raises a clear error rather than failing
silently, since voice input is a required feature for this build.
"""

import requests
from app.config import Config

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"


class SarvamError(Exception):
    pass


def transcribe_audio(file_storage, language_code: str = "unknown") -> dict:
    """Send an audio file to Sarvam AI Speech-to-Text and return the transcript.

    Args:
        file_storage: a werkzeug FileStorage object (from request.files[...])
        language_code: BCP-47 code like 'hi-IN', 'en-IN', or 'unknown' to let
                        Sarvam auto-detect the spoken language.

    Returns:
        {"transcript": str, "language_code": str}
    """
    if not Config.SARVAM_API_KEY:
        raise SarvamError(
            "SARVAM_API_KEY is not set. Add it to backend/.env -- "
            "voice meeting notes require Sarvam AI."
        )

    headers = {"api-subscription-key": Config.SARVAM_API_KEY}
    files = {"file": (file_storage.filename or "audio.wav", file_storage.stream, file_storage.mimetype)}
    data = {"model": "saaras:v3", "mode": "transcribe", "language_code": language_code}

    print(
        f"[SARVAM DEBUG] sending filename={file_storage.filename} "
        f"mimetype={file_storage.mimetype} language_code={language_code}",
        flush=True,
    )

    try:
        resp = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=60)
    except requests.RequestException as exc:
        raise SarvamError(f"Could not reach Sarvam AI: {exc}") from exc

    if resp.status_code != 200:
        raise SarvamError(f"Sarvam AI error ({resp.status_code}): {resp.text[:300]}")

    body = resp.json()
    print(f"[SARVAM DEBUG] full response: {body}", flush=True)

    return {
        "transcript": (body.get("transcript") or "").strip(),
        "language_code": body.get("language_code", language_code),
    }