"""
Simple transactional email sender using Gmail SMTP (via an App Password).

Used for commitment due/overdue digest emails. If GMAIL_ADDRESS /
GMAIL_APP_PASSWORD aren't configured, sending is a silent no-op so the rest
of the app keeps working without email set up.
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import Config

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465


def send_email(to_address: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Send an email via Gmail SMTP. Returns True on success, False otherwise.

    Never raises -- callers (background jobs, request handlers) should not
    crash the app if email sending fails.
    """
    if not Config.EMAIL_NOTIFICATIONS_ENABLED:
        return False
    if not to_address:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = Config.GMAIL_ADDRESS
    msg["To"] = to_address

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(Config.GMAIL_ADDRESS, Config.GMAIL_APP_PASSWORD)
            server.sendmail(Config.GMAIL_ADDRESS, [to_address], msg.as_string())
        return True
    except Exception as exc:  # noqa: BLE001 -- log and continue, never crash caller
        print(f"[email_service] Failed to send email to {to_address}: {exc}")
        return False