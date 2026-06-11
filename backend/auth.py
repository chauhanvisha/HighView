import os
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
import sqlite3
import hashlib
import secrets
from typing import Optional

router = APIRouter()
security = HTTPBearer()

# Configuration — set JWT_SECRET_KEY in environment (never commit a real secret)
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-only-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

VALID_ROLES = {"student", "staff", "teacher", "admin"}

# Database setup — DB_PATH can be overridden via env for persistent cloud storage
from pathlib import Path
BASE_DIR = Path(__file__).parent
DB_PATH = os.environ.get("DB_PATH", str(BASE_DIR / "data" / "users.db"))


def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            institution TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


init_db()


# ── Pydantic models ───────────────────────────────────────────────────────────

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    role: str
    institution: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    type: str
    institution: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${pwd_hash}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, pwd_hash = hashed_password.split("$")
        return hashlib.sha256((plain_password + salt).encode()).hexdigest() == pwd_hash
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_email(email: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None


def create_user(user_data: UserSignup) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, role, institution) VALUES (?, ?, ?, ?, ?)",
            (user_data.email, hash_password(user_data.password), user_data.fullName, user_data.role, user_data.institution),
        )
        conn.commit()
        user_id = cursor.lastrowid
        return user_id
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    finally:
        conn.close()


def decode_token(credentials: HTTPAuthorizationCredentials) -> str:
    """Decode a Bearer JWT and return the user's email."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def _user_response(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["full_name"],
        "type": user["role"],
        "institution": user["institution"],
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    if user_data.role not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
    if len(user_data.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters")

    create_user(user_data)
    user = get_user_by_email(user_data.email)
    token = create_access_token(
        data={"sub": user["email"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "user": _user_response(user)}


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = get_user_by_email(credentials.email)

    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Allow "staff" on the frontend to match "teacher" stored in DB and vice‑versa
    if credentials.role:
        frontend_role = credentials.role
        db_role = user["role"]
        staff_aliases = {"staff", "teacher"}
        role_matches = frontend_role == db_role or (frontend_role in staff_aliases and db_role in staff_aliases)
        if not role_matches:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"This account is registered as '{db_role}'. Please use the correct login.",
            )

    token = create_access_token(
        data={"sub": user["email"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "user": _user_response(user)}


@router.get("/me", response_model=UserResponse)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    email = decode_token(credentials)
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _user_response(user)


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    email = decode_token(credentials)
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters")

    new_hash = hash_password(data.new_password)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (new_hash, email))
    conn.commit()
    conn.close()

    return {"message": "Password updated successfully"}


@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}
