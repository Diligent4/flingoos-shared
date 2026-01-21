"""Text Trigger schema for text-to-context generation.

This module defines the contract for text-to-context generation via MCP.
Analogous to VideoTrigger but for text input instead of video.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class TextOutputLanguage(str, Enum):
    """Output language options for text-to-context generation.
    
    Matches OutputLanguage from video-forge api_models.py.
    """
    AUTO = "auto"
    EN = "en"
    ES = "es"
    FR = "fr"
    DE = "de"
    PT = "pt"
    ZH = "zh"
    JA = "ja"
    KO = "ko"
    AR = "ar"
    HE = "he"
    RU = "ru"
    IT = "it"
    NL = "nl"
    PL = "pl"
    TR = "tr"
    VI = "vi"
    TH = "th"
    ID = "id"
    HI = "hi"


class TextInputType(str, Enum):
    """Text input type determines output structure."""
    WORKFLOW_RECORDING = "workflow_recording"
    TEACHING_SESSION = "teaching_session"


class TextOutputFormat(str, Enum):
    """Output format type."""
    WORKFLOW_GUIDE = "workflow_guide"
    KNOWLEDGE_BASE = "knowledge_base"


class TextVisibility(str, Enum):
    """Visibility options for generated content."""
    PRIVATE = "private"
    ORG_VIEW = "org:view"
    ORG_EDIT = "org:edit"


class TextSessionRef(BaseModel):
    """Text session reference - identifies the text generation request."""
    model_config = ConfigDict(extra='forbid')
    
    org_id: str = Field(..., min_length=1, description="Organization identifier")
    user_id: str = Field(..., min_length=1, description="Firebase user UID")
    user_email: Optional[str] = Field(None, description="User email address")
    session_id: str = Field(..., min_length=1, description="Unique session ID")
    content: str = Field(
        ..., 
        min_length=50, 
        max_length=50000, 
        description="Text content to generate context from (50-50000 chars)"
    )


class TextProcessingOptions(BaseModel):
    """Text processing configuration."""
    model_config = ConfigDict(extra='forbid')
    
    input_type: TextInputType = Field(..., description="Type of content to generate")
    output_format: TextOutputFormat = Field(..., description="Desired output format")
    model: str = Field(default="gemini-3-pro-preview", description="LLM model name")
    output_language: TextOutputLanguage = Field(
        default=TextOutputLanguage.AUTO,
        description="Output language. 'auto' detects from input."
    )


class TextTrigger(BaseModel):
    """Text Trigger v1.0 - JSON contract for text-to-context generation.
    
    Analogous to VideoTrigger but for text input instead of video.
    Published to Pub/Sub by MCP, consumed by video-forge.
    """
    model_config = ConfigDict(extra='forbid')
    
    version: Literal["1.0"] = Field(default="1.0", description="Trigger version")
    text_session: TextSessionRef = Field(..., description="Text session reference")
    processing_options: TextProcessingOptions = Field(
        ..., 
        description="Processing configuration"
    )
    visibility: TextVisibility = Field(
        default=TextVisibility.PRIVATE, 
        description="Data visibility"
    )
    source: Literal["mcp-generate"] = Field(
        default="mcp-generate", 
        description="Trigger source"
    )
    project_id: Optional[str] = Field(None, description="Project to add this context to")
    name: Optional[str] = Field(None, description="Optional user-provided name")


class TextGenerateResponse(BaseModel):
    """Response from text-to-context generation request."""
    model_config = ConfigDict(extra='forbid')
    
    status: Literal["accepted", "error"]
    session_id: str
    message: str
    estimated_seconds: Optional[int] = None
