"""Persistent session state schema."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PersistentSession(BaseModel):
    """Session state schema for Firestore persistence."""

    session_id: str
    user_id: str
    org_id: str
    device_fingerprint: str

    created_at: str  # ISO-8601
    started_at: str  # ISO-8601
    stopped_at: Optional[str] = None  # ISO-8601
    completed_at: Optional[str] = None  # ISO-8601
    updated_at: str  # ISO-8601

    status: str  # recording|processing|completed|failed
    substatus: Optional[str] = None

    presence_ticket_jti: str

    processing_id: Optional[str] = None
    firestore_path: Optional[str] = None
    processing_time_seconds: Optional[float] = None

    stopped_by_user_id: Optional[str] = None
    stop_method: Optional[str] = None

    error: Optional[str] = None
    error_code: Optional[str] = None
    retry_count: int = 0

    version: int = 1
    ttl_expires_at: str  # ISO-8601
