"""
Centralized GCS storage client using SA impersonation.

The platform bucket SA (flingoos-bucket-sa) is impersonated by each service's
runtime SA, producing short-lived tokens with no distributed keys.

Usage:
    from flingoos_shared_models.storage import get_impersonated_gcs_client, get_bucket_sa_email

    client = get_impersonated_gcs_client(get_bucket_sa_email())
    bucket = client.bucket('my-bucket')
    blob = bucket.blob('path/to/file')
"""

import json
import logging
import os
import threading
from typing import Optional

logger = logging.getLogger(__name__)

_impersonated_client = None
_client_lock = threading.Lock()


def get_bucket_sa_email() -> str:
    """Read the platform bucket SA email from environment."""
    email = os.environ.get("FLINGOOS_BUCKET_SA_EMAIL")
    if not email:
        raise RuntimeError("FLINGOOS_BUCKET_SA_EMAIL environment variable is required")
    return email


def get_impersonated_gcs_client(
    target_sa_email: str, project_id: Optional[str] = None
):
    """
    Get a GCS client using impersonated credentials.

    The runtime SA (e.g. flingoos-video-forge-sa) impersonates the platform
    bucket SA, which has objectAdmin on the target buckets.

    The client is cached as a thread-safe singleton.
    """
    global _impersonated_client
    if _impersonated_client is not None:
        return _impersonated_client

    with _client_lock:
        if _impersonated_client is not None:
            return _impersonated_client

        import google.auth
        from google.auth import impersonated_credentials
        from google.cloud import storage

        source_credentials, _ = google.auth.default()
        target_scopes = [
            "https://www.googleapis.com/auth/devstorage.full_control"
        ]

        creds = impersonated_credentials.Credentials(
            source_credentials=source_credentials,
            target_principal=target_sa_email,
            target_scopes=target_scopes,
            lifetime=3600,
        )

        _impersonated_client = storage.Client(
            credentials=creds, project=project_id
        )
        logger.info(
            "Created impersonated GCS client targeting %s", target_sa_email
        )
        return _impersonated_client


def get_legacy_gcs_client(
    service_account_key_json: str, project_id: Optional[str] = None
):
    """
    Get a GCS client from a service account key JSON string.

    Deprecated: Legacy path for orgs that haven't migrated to IAM impersonation.
    """
    from google.cloud import storage
    from google.oauth2 import service_account

    key_info = json.loads(service_account_key_json)
    credentials = service_account.Credentials.from_service_account_info(key_info)

    return storage.Client(
        credentials=credentials,
        project=project_id or key_info.get("project_id"),
    )


def reset_client() -> None:
    """Reset the cached impersonated client. For testing only."""
    global _impersonated_client
    with _client_lock:
        _impersonated_client = None
