#!/usr/bin/env python3
"""
Emergency super admin password reset.

Use this when admin@trizodiac.com (or any super admin) is locked out and cannot
reset themselves through the UI. Run from inside the container, or locally with
the production DB env vars set.

Usage:
    # Interactive (prompts for email + new password)
    python reset_super_admin.py

    # Non-interactive
    python reset_super_admin.py --email admin@trizodiac.com --password 'NewSecurePass123!'

    # Auto-generate a new password and print it
    python reset_super_admin.py --email admin@trizodiac.com --generate

Container example (one-shot):
    az containerapp exec \\
      --name jawda-app --resource-group jawda-rg \\
      --command "python reset_super_admin.py --email admin@trizodiac.com --generate"

Required env vars (same as the app): DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
"""
import argparse
import getpass
import secrets
import string
import sys

from auth import hash_password, ROLE_SUPER_ADMIN
from database import get_conn


def generate_password(length: int = 16) -> str:
    """Generate a secure readable password (no ambiguous characters)."""
    alphabet = (
        string.ascii_letters.replace("l", "").replace("I", "").replace("O", "")
        + string.digits.replace("0", "").replace("1", "")
        + "!@#$%"
    )
    return "".join(secrets.choice(alphabet) for _ in range(length))


def reset(email: str, new_password: str) -> bool:
    """Find a super admin by email and update their password.
    Returns True on success. Forces must_change_password=TRUE so the next
    login forces them to set their own password."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, email, role, is_active FROM users WHERE LOWER(email) = LOWER(%s)",
        (email,),
    )
    row = cur.fetchone()
    if not row:
        print(f"✗ No user found with email: {email}")
        cur.close()
        conn.close()
        return False

    user_id, user_email, role, is_active = row
    if role != ROLE_SUPER_ADMIN:
        print(f"✗ User {user_email} has role '{role}', not super_admin. Refusing to reset.")
        print("  Use the admin UI to reset non-super-admin users.")
        cur.close()
        conn.close()
        return False

    if not is_active:
        print(f"⚠ User {user_email} is currently inactive. Reactivating as part of reset.")

    password_hash = hash_password(new_password)
    cur.execute(
        """
        UPDATE users
        SET password_hash = %s,
            must_change_password = TRUE,
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = %s
        """,
        (password_hash, user_id),
    )
    conn.commit()
    cur.close()
    conn.close()

    print(f"✓ Password reset for super admin: {user_email}")
    print("  must_change_password = TRUE → user will be forced to set a new password on next login.")
    return True


def main():
    parser = argparse.ArgumentParser(description="Emergency super admin password reset")
    parser.add_argument("--email", help="Super admin email (default: prompt)")
    parser.add_argument("--password", help="New password (default: prompt or --generate)")
    parser.add_argument("--generate", action="store_true",
                        help="Auto-generate a secure password and print it")
    args = parser.parse_args()

    email = args.email or input("Super admin email: ").strip()
    if not email:
        print("✗ Email is required")
        sys.exit(1)

    if args.generate:
        new_password = generate_password()
        print(f"\n⚠ Generated temporary password (save this now — it will not be shown again):")
        print(f"\n    {new_password}\n")
    elif args.password:
        new_password = args.password
    else:
        new_password = getpass.getpass("New password (min 8 chars): ")
        confirm = getpass.getpass("Confirm new password: ")
        if new_password != confirm:
            print("✗ Passwords do not match")
            sys.exit(1)

    if len(new_password) < 8:
        print("✗ Password must be at least 8 characters")
        sys.exit(1)

    ok = reset(email, new_password)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
