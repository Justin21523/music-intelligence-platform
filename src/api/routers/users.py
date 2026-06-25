"""Users list endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from src.api.deps import DbConn

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users(limit: int = 200, db: DbConn = DbConn) -> dict:
    """Return user IDs and usernames (for recommendation dropdowns)."""
    rows = db.execute(
        "SELECT user_id, username FROM users ORDER BY user_id LIMIT ?",
        [limit],
    ).fetchall()
    return {"users": [{"user_id": r[0], "username": r[1]} for r in rows]}
