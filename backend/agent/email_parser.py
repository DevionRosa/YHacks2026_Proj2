"""
Momma Agent — Email Parser
Reads emails from Gmail (IMAP/OAuth) or mock JSON, sends to LLM for classification.
"""

import email as email_lib
import imaplib
import json
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("momma.email")

MOCK_EMAIL_PATH = Path(__file__).parent.parent / "data" / "mock_emails.json"
GMAIL_ADDRESS   = os.getenv("GMAIL_ADDRESS", "")
EMAIL_SOURCE    = os.getenv("EMAIL_SOURCE", "mock")  # "mock" or "gmail"


def load_mock_emails() -> list[dict[str, Any]]:
    """Load emails from the mock JSON file."""
    with open(MOCK_EMAIL_PATH) as f:
        emails = json.load(f)
    logger.info(f"Loaded {len(emails)} mock emails")
    return emails


def fetch_gmail_emails(max_emails: int = 10) -> list[dict[str, Any]]:
    """
    Fetch recent unread emails from Gmail via IMAP.
    Requires a valid OAuth token or app password set in GMAIL_APP_PASSWORD env var.
    """
    app_password = os.getenv("GMAIL_APP_PASSWORD", "")
    if not GMAIL_ADDRESS or not app_password:
        logger.warning("Gmail credentials not set — falling back to mock emails")
        return load_mock_emails()

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_ADDRESS, app_password)
        mail.select("inbox")

        _, data = mail.search(None, "UNSEEN")
        ids = data[0].split()[-max_emails:]  # Take most recent N

        emails = []
        for eid in ids:
            _, msg_data = mail.fetch(eid, "(RFC822)")
            msg = email_lib.message_from_bytes(msg_data[0][1])
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

            emails.append({
                "id":      eid.decode(),
                "from":    msg.get("From", ""),
                "subject": msg.get("Subject", ""),
                "date":    msg.get("Date", ""),
                "body":    body[:3000],  # Truncate to 3k chars for LLM
            })

        mail.logout()
        logger.info(f"Fetched {len(emails)} emails from Gmail")
        return emails
    except Exception as exc:
        logger.error(f"Gmail IMAP error: {exc} — falling back to mock")
        return load_mock_emails()


def get_emails() -> list[dict[str, Any]]:
    """Return emails from configured source (mock or gmail)."""
    if EMAIL_SOURCE == "gmail":
        return fetch_gmail_emails()
    return load_mock_emails()
