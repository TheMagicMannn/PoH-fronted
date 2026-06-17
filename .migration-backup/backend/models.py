"""Pydantic request/response models for PoH APIs."""
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


# ---- Auth ----
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    company: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=6)


# ---- Workspace ----
class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    sensitivity_profile: Optional[str] = None


class InviteMemberRequest(BaseModel):
    name: str
    email: EmailStr
    role: str = "analyst"
    password: str = Field(default="ChangeMe2026!", min_length=6)


# ---- Sites ----
class SiteCreate(BaseModel):
    name: str
    domain: str


# ---- Rules ----
class RuleCondition(BaseModel):
    field: str
    op: str
    value: Any


class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    enabled: bool = True
    conditions: List[RuleCondition]
    action: str = "flag"
    priority: int = 10


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    conditions: Optional[List[RuleCondition]] = None
    action: Optional[str] = None
    priority: Optional[int] = None


# ---- Actions ----
class SessionActionRequest(BaseModel):
    action: str  # block | review | trust | observe
    note: Optional[str] = None


class ConversionActionRequest(BaseModel):
    status: str  # accepted | suppressed | blocked | review
    note: Optional[str] = None


# ---- Integrations ----
class IntegrationConnect(BaseModel):
    provider: str


# ---- Investigations ----
class InvestigationCreate(BaseModel):
    title: str
    severity: str = "medium"
    cluster_id: Optional[str] = None
    notes: Optional[str] = ""


class InvestigationUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    note: Optional[str] = None


# ---- SDK ingestion ----
class CollectRequest(BaseModel):
    sdk_key: str
    fingerprint: Optional[str] = None
    signals: dict = Field(default_factory=dict)
    page: Optional[str] = None
    referrer: Optional[str] = None
    utm: dict = Field(default_factory=dict)
    session_id: Optional[str] = None


class ConvertRequest(BaseModel):
    sdk_key: str
    session_id: Optional[str] = None
    type: str = "conversion"
    value: float = 0
    currency: str = "USD"
    fingerprint: Optional[str] = None
    signals: dict = Field(default_factory=dict)
    utm: dict = Field(default_factory=dict)
