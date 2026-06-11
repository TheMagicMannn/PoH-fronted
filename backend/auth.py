"""JWT email/password auth with multi-tenant workspaces and roles."""
import os
import uuid
import secrets
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, Request, Response, HTTPException, Depends

from db import db
from models import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

JWT_ALGORITHM = "HS256"
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

ROLE_RANK = {"viewer": 0, "analyst": 1, "admin": 2, "owner": 3}


def now_utc():
    return datetime.now(timezone.utc)


def now_iso():
    return now_utc().isoformat()


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now_utc() + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": now_utc() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")
    return access


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "workspace_id": user.get("workspace_id"),
        "created_at": user.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(min_role: str):
    async def checker(user: dict = Depends(get_current_user)):
        if ROLE_RANK.get(user.get("role"), 0) < ROLE_RANK.get(min_role, 0):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker


# ---- Brute force ----
async def _check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= 5:
        locked_until = rec.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > now_utc():
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")


async def _record_failure(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    count = (rec.get("count", 0) if rec else 0) + 1
    update = {"identifier": identifier, "count": count, "updated_at": now_iso()}
    if count >= 5:
        update["locked_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)


async def _clear_failures(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


async def _create_workspace_for(user_id: str, name: str) -> str:
    ws_id = str(uuid.uuid4())
    await db.workspaces.insert_one({
        "id": ws_id,
        "name": name,
        "owner_id": user_id,
        "sensitivity_profile": "balanced",
        "plan": "Growth",
        "created_at": now_iso(),
    })
    # Default site + SDK key
    site_id = str(uuid.uuid4())
    sdk_key = "poh_" + secrets.token_hex(16)
    await db.sites.insert_one({
        "id": site_id,
        "workspace_id": ws_id,
        "name": name,
        "domain": "example.com",
        "sdk_key": sdk_key,
        "created_at": now_iso(),
    })
    return ws_id


@auth_router.post("/register")
async def register(body: RegisterRequest, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user_id = str(uuid.uuid4())
    ws_name = (body.company or f"{body.name.split(' ')[0]}'s Workspace").strip()
    ws_id = await _create_workspace_for(user_id, ws_name)
    user = {
        "id": user_id,
        "name": body.name,
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "owner",
        "workspace_id": ws_id,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    set_auth_cookies(response, user_id, email)
    return public_user(user)


@auth_router.post("/login")
async def login(body: LoginRequest, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await _check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await _record_failure(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await _clear_failures(identifier)
    set_auth_cookies(response, user["id"], email)
    return public_user(user)


@auth_router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@auth_router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@auth_router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    set_auth_cookies(response, user["id"], user["email"])
    return public_user(user)


@auth_router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user["id"],
            "expires_at": (now_utc() + timedelta(hours=1)).isoformat(),
            "used": False,
            "created_at": now_iso(),
        })
        print(f"[PoH] Password reset link: /reset-password?token={token}")
    return {"message": "If that email exists, a reset link has been sent."}


@auth_router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    rec = await db.password_reset_tokens.find_one({"token": body.token})
    if not rec or rec.get("used"):
        raise HTTPException(status_code=400, detail="Invalid or used reset token")
    if datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(status_code=400, detail="Reset token expired")
    await db.users.update_one({"id": rec["user_id"]}, {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"message": "Password updated successfully"}


async def seed_admin():
    """Seed the demo admin/owner and ensure indexes."""
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.sites.create_index("sdk_key")
    await db.password_reset_tokens.create_index("expires_at")
    await db.login_attempts.create_index("identifier")

    admin_email = os.environ.get("ADMIN_EMAIL", "analyst@poh.io").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "PohDemo2026!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        user_id = str(uuid.uuid4())
        ws_id = str(uuid.uuid4())
        await db.workspaces.insert_one({
            "id": ws_id,
            "name": "Northwind Demand Gen",
            "owner_id": user_id,
            "sensitivity_profile": "balanced",
            "plan": "Scale",
            "created_at": now_iso(),
        })
        await db.sites.insert_one({
            "id": str(uuid.uuid4()),
            "workspace_id": ws_id,
            "name": "northwind.io",
            "domain": "northwind.io",
            "sdk_key": "poh_demo_northwind_live_key",
            "created_at": now_iso(),
        })
        await db.users.insert_one({
            "id": user_id,
            "name": "Avery Chen",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "owner",
            "workspace_id": ws_id,
            "created_at": now_iso(),
        })
        return ws_id
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    return existing["workspace_id"] if existing else None
