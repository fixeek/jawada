"""
Authentication module — JWT tokens, password hashing, user CRUD.
"""
import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from psycopg2.extras import RealDictCursor

from database import get_conn

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    # Allow fallback only in local dev (when DB_HOST is localhost)
    if os.environ.get("DB_HOST", "localhost") == "localhost":
        JWT_SECRET = "dev-secret-local-only-do-not-use-in-production"
        print("⚠ WARNING: Using local dev JWT secret. Set JWT_SECRET env var for production.")
    else:
        raise RuntimeError(
            "JWT_SECRET environment variable is required. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 12

# Roles
ROLE_SUPER_ADMIN = "super_admin"
ROLE_CLINIC_ADMIN = "clinic_admin"
ROLE_QUALITY_OFFICER = "quality_officer"
ROLE_VIEWER = "viewer"

ALL_ROLES = [ROLE_SUPER_ADMIN, ROLE_CLINIC_ADMIN, ROLE_QUALITY_OFFICER, ROLE_VIEWER]


# ── Password hashing ───────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except Exception:
        return False


# ── JWT tokens ─────────────────────────────────────────────────────────────

def create_token(user_id: int, email: str, role: str, facility_id: Optional[int] = None) -> str:
    """Create a JWT token for a user."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "facility_id": facility_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token. Returns payload or None if invalid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# ── User CRUD ──────────────────────────────────────────────────────────────

class EmailAlreadyExistsError(Exception):
    """Raised when trying to create a user with an email that already exists."""
    pass


def create_user(email: str, password: str, full_name: str, role: str,
                facility_id: Optional[int] = None,
                must_change_password: bool = False) -> dict:
    """Create a new user. Returns user dict (without password hash).
    Raises EmailAlreadyExistsError if a user (active or inactive) already exists with this email.
    To re-add a soft-deleted user, the admin must reactivate them via reactivate_user()."""
    if role not in ALL_ROLES:
        raise ValueError(f"Invalid role: {role}")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    email_lower = email.strip().lower()

    # Check for existing user (active or inactive)
    cur.execute(
        "SELECT id, email, is_active, facility_id FROM users WHERE email_lower = %s",
        (email_lower,),
    )
    existing = cur.fetchone()
    if existing:
        cur.close()
        conn.close()
        raise EmailAlreadyExistsError(
            f"A user with email '{email}' already exists "
            f"({'active' if existing['is_active'] else 'deactivated'})."
        )

    password_hash = hash_password(password)

    cur.execute("""
        INSERT INTO users (email, email_lower, password_hash, full_name, role, facility_id, must_change_password)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, email, full_name, role, facility_id, is_active, must_change_password, created_at
    """, (email.strip(), email_lower, password_hash, full_name, role, facility_id, must_change_password))

    user = dict(cur.fetchone())
    conn.commit()
    cur.close()
    conn.close()

    if user.get("created_at"):
        user["created_at"] = user["created_at"].isoformat()
    return user


def get_user_by_email(email: str) -> Optional[dict]:
    """Get a user by email (with password hash)."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT u.*, f.name as facility_name
        FROM users u
        LEFT JOIN facilities f ON u.facility_id = f.id
        WHERE u.email_lower = %s
    """, (email.strip().lower(),))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[dict]:
    """Get a user by ID (without password hash)."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT u.id, u.email, u.full_name, u.role, u.facility_id, u.is_active,
               u.must_change_password, u.last_login, u.created_at,
               f.name as facility_name
        FROM users u
        LEFT JOIN facilities f ON u.facility_id = f.id
        WHERE u.id = %s
    """, (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    user = dict(row)
    if user.get("created_at"):
        user["created_at"] = user["created_at"].isoformat()
    if user.get("last_login"):
        user["last_login"] = user["last_login"].isoformat()
    return user


def list_users_for_facility(facility_id: int) -> list:
    """List all users belonging to a facility."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, email, full_name, role, is_active, last_login, created_at
        FROM users
        WHERE facility_id = %s
        ORDER BY created_at DESC
    """, (facility_id,))
    rows = [dict(r) for r in cur.fetchall()]
    cur.close()
    conn.close()
    for r in rows:
        if r.get("created_at"): r["created_at"] = r["created_at"].isoformat()
        if r.get("last_login"): r["last_login"] = r["last_login"].isoformat()
    return rows


def list_all_facilities() -> list:
    """Super admin: list all facilities."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT f.*,
               (SELECT COUNT(*) FROM users WHERE facility_id = f.id) as user_count,
               (SELECT COUNT(*) FROM uploads WHERE facility_id = f.id) as upload_count
        FROM facilities f
        ORDER BY f.created_at DESC
    """)
    rows = [dict(r) for r in cur.fetchall()]
    cur.close()
    conn.close()
    for r in rows:
        if r.get("created_at"): r["created_at"] = r["created_at"].isoformat()
    return rows


def create_facility(name: str, license_no: str = None, doh_facility_id: str = None,
                    address: str = None, contact_name: str = None,
                    contact_email: str = None, contact_phone: str = None) -> int:
    """Create a new facility."""
    conn = get_conn()
    cur = conn.cursor()
    name_lower = name.strip().lower()

    cur.execute("""
        INSERT INTO facilities (name, name_lower, license_no, doh_facility_id,
                                address, contact_name, contact_email, contact_phone)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (name.strip(), name_lower, license_no, doh_facility_id,
          address, contact_name, contact_email, contact_phone))

    facility_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return facility_id


def update_user_password(user_id: int, new_password: str, must_change: bool = False):
    """Update a user's password.
    must_change=True is used for admin-initiated resets — forces user to set their own
    password on next login. Defaults to False (self-service change)."""
    conn = get_conn()
    cur = conn.cursor()
    password_hash = hash_password(new_password)
    cur.execute("""
        UPDATE users
        SET password_hash = %s, must_change_password = %s, updated_at = NOW()
        WHERE id = %s
    """, (password_hash, must_change, user_id))
    conn.commit()
    cur.close()
    conn.close()


def update_last_login(user_id: int):
    """Update user's last login timestamp."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()


def deactivate_user(user_id: int):
    """Soft-delete: mark user as inactive."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = %s",
        (user_id,),
    )
    conn.commit()
    cur.close()
    conn.close()


def reactivate_user(user_id: int):
    """Reactivate a soft-deleted user."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = %s",
        (user_id,),
    )
    conn.commit()
    cur.close()
    conn.close()


# Backwards compat alias — old code paths call delete_user
def delete_user(user_id: int):
    """Soft-delete a user (kept for compatibility — calls deactivate_user)."""
    deactivate_user(user_id)


def deactivate_facility(facility_id: int):
    """Soft-delete: mark facility as inactive (and all its users)."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE facilities SET is_active = FALSE WHERE id = %s", (facility_id,))
    cur.execute("UPDATE users SET is_active = FALSE WHERE facility_id = %s", (facility_id,))
    conn.commit()
    cur.close()
    conn.close()


def reactivate_facility(facility_id: int):
    """Reactivate a facility (does NOT auto-reactivate users — admin must do that)."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE facilities SET is_active = TRUE WHERE id = %s", (facility_id,))
    conn.commit()
    cur.close()
    conn.close()


# ── Seeding ────────────────────────────────────────────────────────────────

def seed_super_admin():
    """Create default super admin if it doesn't exist."""
    existing = get_user_by_email("admin@trizodiac.com")
    if existing:
        return None  # Already exists

    user = create_user(
        email="admin@trizodiac.com",
        password="ChangeMe2026!",
        full_name="TriZodiac Super Admin",
        role=ROLE_SUPER_ADMIN,
        facility_id=None,
        must_change_password=True,
    )
    return user
