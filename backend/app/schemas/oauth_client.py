from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OAuthClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    redirect_uris: list[str] = Field(..., min_length=1)
    allowed_scopes: str = Field(default="openid profile email", max_length=255)


class OAuthClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    redirect_uris: Optional[list[str]] = None
    allowed_scopes: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class OAuthClientResponse(BaseModel):
    client_id: str
    name: str
    redirect_uris: list[str]
    allowed_scopes: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OAuthClientCreatedResponse(OAuthClientResponse):
    """Returned only at creation — includes plain-text secret (shown once)."""
    client_secret: str


class OAuthClientSecretResponse(BaseModel):
    """Returned only at secret regeneration — includes plain-text secret (shown once)."""
    client_id: str
    client_secret: str
