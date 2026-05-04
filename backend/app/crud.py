from __future__ import annotations

import json
import sqlite3
import uuid

from .database import ensure_user_defaults, hash_pin, title_for_level


def create_session(db: sqlite3.Connection, user_id: int) -> str:
    token = uuid.uuid4().hex
    db.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
    return token


def user_by_token(db: sqlite3.Connection, token: str) -> sqlite3.Row | None:
    return db.execute(
        """
        SELECT users.*
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ?
        """,
        (token,),
    ).fetchone()


def get_or_create_user(db: sqlite3.Connection, child_name: str, parent_pin: str = "1234") -> sqlite3.Row:
    user = db.execute("SELECT * FROM users WHERE child_name = ?", (child_name,)).fetchone()
    if user:
        ensure_user_defaults(db, int(user["id"]))
        return user

    cursor = db.execute(
        """
        INSERT INTO users (child_name, parent_pin_hash, unlocked_avatar_ids)
        VALUES (?, ?, ?)
        """,
        (child_name, hash_pin(parent_pin), json.dumps(["sun", "rocket"])),
    )
    user_id = int(cursor.lastrowid)
    ensure_user_defaults(db, user_id)
    return db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def serialize_player(user: sqlite3.Row) -> dict:
    return {
        "id": int(user["id"]),
        "name": user["child_name"],
        "title": title_for_level(int(user["level"])),
        "stars": int(user["stars"]),
        "dayStars": int(user["day_stars"]),
        "level": int(user["level"]),
        "avatarId": user["avatar_id"],
        "unlockedAvatarIds": json.loads(user["unlocked_avatar_ids"]),
    }


def drawings_for_user(db: sqlite3.Connection, user_id: int) -> list[dict]:
    rows = db.execute(
        """
        SELECT drawings.id, drawings.title, user_drawings.progress, drawings.palette,
               drawings.shadow_slot, user_drawings.completed
        FROM drawings
        JOIN user_drawings ON user_drawings.drawing_id = drawings.id
        WHERE user_drawings.user_id = ?
        ORDER BY drawings.rowid
        """,
        (user_id,),
    ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "progress": int(row["progress"]),
            "palette": json.loads(row["palette"]),
            "shadowSlot": int(row["shadow_slot"]),
            "completed": bool(row["completed"]),
        }
        for row in rows
    ]


def sync_achievements(db: sqlite3.Connection, user: sqlite3.Row) -> None:
    user_id = int(user["id"])
    saved_background = db.execute(
        "SELECT 1 FROM user_drawings WHERE user_id = ? AND background_kind != 'shadow' LIMIT 1",
        (user_id,),
    ).fetchone()
    rules = {
        "first-star": int(user["stars"]) >= 1,
        "daily-three": int(user["level"]) >= 2,
        "background-maker": saved_background is not None,
        "living-paper": int(user["stars"]) >= 5,
    }
    for achievement_id, unlocked in rules.items():
        db.execute(
            "UPDATE user_achievements SET unlocked = ? WHERE user_id = ? AND achievement_id = ?",
            (1 if unlocked else 0, user_id, achievement_id),
        )


def achievements_for_user(db: sqlite3.Connection, user: sqlite3.Row) -> list[dict]:
    sync_achievements(db, user)
    rows = db.execute(
        """
        SELECT achievements.*, user_achievements.unlocked
        FROM achievements
        JOIN user_achievements ON user_achievements.achievement_id = achievements.id
        WHERE user_achievements.user_id = ?
        ORDER BY achievements.rowid
        """,
        (int(user["id"]),),
    ).fetchall()
    return [
        {
            "id": row["id"],
            "icon": row["icon"],
            "title": row["title"],
            "description": row["description"],
            "unlocked": bool(row["unlocked"]),
            "rarity": row["rarity"],
        }
        for row in rows
    ]


def snapshot(db: sqlite3.Connection, user: sqlite3.Row) -> dict:
    return {
        "player": serialize_player(user),
        "drawings": drawings_for_user(db, int(user["id"])),
        "achievements": achievements_for_user(db, user),
    }


def claim_reward(db: sqlite3.Connection, user: sqlite3.Row, drawing_id: str) -> sqlite3.Row:
    user_id = int(user["id"])
    next_stars = int(user["stars"]) + 1
    next_day_stars = int(user["day_stars"]) + 1
    next_level = int(user["level"])
    if next_day_stars >= 3:
        next_level += 1
        next_day_stars = 0

    unlocked = set(json.loads(user["unlocked_avatar_ids"]))
    if next_level >= 2:
        unlocked.add("paint")
    if next_level >= 3:
        unlocked.add("sun")

    db.execute(
        """
        UPDATE users
        SET stars = ?, day_stars = ?, level = ?, unlocked_avatar_ids = ?
        WHERE id = ?
        """,
        (next_stars, next_day_stars, next_level, json.dumps(sorted(unlocked)), user_id),
    )
    db.execute(
        """
        UPDATE user_drawings
        SET progress = 100, completed = 1
        WHERE user_id = ? AND drawing_id = ?
        """,
        (user_id, drawing_id),
    )
    updated = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    sync_achievements(db, updated)
    return updated
