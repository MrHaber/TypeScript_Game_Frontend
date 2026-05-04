from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from pathlib import Path

DB_PATH = Path(os.getenv("UCHI_DB_PATH", Path(__file__).resolve().parent.parent / "uchi_game.sqlite3"))

TITLES_BY_LEVEL = ["Юный художник", "Искатель звезд", "Мастер бумаги", "Герой историй"]

BASE_DRAWINGS = [
    ("forest-band", "Рисунок", 60, ["#9fd6b6", "#f9d66d", "#ff8c66"], 1, 0),
    ("space-friends", "Рисунок", 20, ["#92b7ff", "#ffd166", "#ef476f"], 2, 0),
    ("city-day", "Рисунок", 100, ["#8ecae6", "#ffb703", "#fb8500"], 1, 1),
    ("candy-park", "Рисунок", 45, ["#ffc6ff", "#bdb2ff", "#a0c4ff"], 2, 0),
    ("sea-quest", "Рисунок", 80, ["#80ed99", "#57cc99", "#38a3a5"], 1, 0),
    ("snow-stage", "Рисунок", 10, ["#caf0f8", "#ffd6a5", "#fdffb6"], 2, 0),
]

BASE_ACHIEVEMENTS = [
    ("first-star", "Star", "Первая звезда", "Завершить первый рисунок и получить награду.", "common"),
    ("daily-three", "Trophy", "Три за день", "Собрать 3 звезды за день и повысить уровень.", "rare"),
    ("background-maker", "Palette", "Мастер фона", "Сохранить рисунок с собственным вариантом фона.", "common"),
    ("living-paper", "Sparkles", "Живой герой", "Открыть анимированного персонажа из бумажного рисунка.", "epic"),
]


def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode("utf-8")).hexdigest()


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              child_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
              parent_pin_hash TEXT NOT NULL,
              stars INTEGER NOT NULL DEFAULT 0,
              day_stars INTEGER NOT NULL DEFAULT 0,
              level INTEGER NOT NULL DEFAULT 1,
              avatar_id TEXT NOT NULL DEFAULT 'sun',
              unlocked_avatar_ids TEXT NOT NULL DEFAULT '["sun","rocket"]',
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sessions (
              token TEXT PRIMARY KEY,
              user_id INTEGER NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS parent_accounts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              login TEXT NOT NULL UNIQUE COLLATE NOCASE,
              display_name TEXT NOT NULL,
              password_hash TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS parent_sessions (
              token TEXT PRIMARY KEY,
              parent_id INTEGER NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(parent_id) REFERENCES parent_accounts(id)
            );

            CREATE TABLE IF NOT EXISTS drawings (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              progress INTEGER NOT NULL,
              palette TEXT NOT NULL,
              shadow_slot INTEGER NOT NULL,
              completed INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS user_drawings (
              user_id INTEGER NOT NULL,
              drawing_id TEXT NOT NULL,
              progress INTEGER NOT NULL,
              completed INTEGER NOT NULL,
              background_kind TEXT NOT NULL DEFAULT 'shadow',
              PRIMARY KEY(user_id, drawing_id),
              FOREIGN KEY(user_id) REFERENCES users(id),
              FOREIGN KEY(drawing_id) REFERENCES drawings(id)
            );

            CREATE TABLE IF NOT EXISTS achievements (
              id TEXT PRIMARY KEY,
              icon TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              rarity TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS user_achievements (
              user_id INTEGER NOT NULL,
              achievement_id TEXT NOT NULL,
              unlocked INTEGER NOT NULL DEFAULT 0,
              PRIMARY KEY(user_id, achievement_id),
              FOREIGN KEY(user_id) REFERENCES users(id),
              FOREIGN KEY(achievement_id) REFERENCES achievements(id)
            );

            CREATE TABLE IF NOT EXISTS parent_controls (
              user_id INTEGER PRIMARY KEY,
              require_export_approval INTEGER NOT NULL DEFAULT 1,
              FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS rooms (
              code TEXT PRIMARY KEY,
              parent_id INTEGER,
              host_name TEXT NOT NULL,
              active_mode TEXT NOT NULL DEFAULT 'drawing',
              active_stage_id TEXT NOT NULL DEFAULT 'forest',
              game_started INTEGER NOT NULL DEFAULT 0,
              drawing_locked INTEGER NOT NULL DEFAULT 0,
              timer_started INTEGER NOT NULL DEFAULT 0,
              timer_started_at TEXT,
              winners_revealed INTEGER NOT NULL DEFAULT 0,
              require_approval INTEGER NOT NULL DEFAULT 1,
              gallery_enabled INTEGER NOT NULL DEFAULT 0,
              sound_enabled INTEGER NOT NULL DEFAULT 1,
              timer INTEGER NOT NULL DEFAULT 5,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(parent_id) REFERENCES parent_accounts(id)
            );

            CREATE TABLE IF NOT EXISTS room_players (
              room_code TEXT NOT NULL,
              child_name TEXT NOT NULL,
              progress INTEGER NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'drawing',
              rating INTEGER NOT NULL DEFAULT 0,
              stage_id TEXT NOT NULL DEFAULT 'forest',
              drawing_data TEXT,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY(room_code, child_name COLLATE NOCASE),
              FOREIGN KEY(room_code) REFERENCES rooms(code)
            );
            """
        )

        ensure_room_tables(db)

        for drawing in BASE_DRAWINGS:
            db.execute(
                """
                INSERT OR IGNORE INTO drawings (id, title, progress, palette, shadow_slot, completed)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (drawing[0], drawing[1], drawing[2], json.dumps(drawing[3]), drawing[4], drawing[5]),
            )

        for achievement in BASE_ACHIEVEMENTS:
            db.execute(
                """
                INSERT OR IGNORE INTO achievements (id, icon, title, description, rarity)
                VALUES (?, ?, ?, ?, ?)
                """,
                achievement,
            )

        demo = db.execute("SELECT id FROM users WHERE child_name = ?", ("Миша",)).fetchone()
        if demo is None:
            cursor = db.execute(
                """
                INSERT INTO users (child_name, parent_pin_hash, stars, day_stars, level, avatar_id, unlocked_avatar_ids)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                ("Миша", hash_pin("1234"), 3, 2, 1, "rocket", json.dumps(["sun", "rocket"])),
            )
            demo_id = int(cursor.lastrowid)
            ensure_user_defaults(db, demo_id)


def ensure_room_tables(db: sqlite3.Connection) -> None:
    room_columns = {row["name"] for row in db.execute("PRAGMA table_info(rooms)").fetchall()}
    if room_columns and "parent_id" not in room_columns:
        db.execute("ALTER TABLE rooms ADD COLUMN parent_id INTEGER")
        room_columns.add("parent_id")
    if room_columns and "winners_revealed" not in room_columns:
        db.execute("ALTER TABLE rooms ADD COLUMN winners_revealed INTEGER NOT NULL DEFAULT 0")
        room_columns.add("winners_revealed")
    if room_columns and "timer_started_at" not in room_columns:
        db.execute("ALTER TABLE rooms ADD COLUMN timer_started_at TEXT")
        room_columns.add("timer_started_at")

    required_room_columns = {
        "code",
        "parent_id",
        "host_name",
        "active_mode",
        "active_stage_id",
        "game_started",
        "drawing_locked",
        "timer_started",
        "timer_started_at",
        "winners_revealed",
        "require_approval",
        "gallery_enabled",
        "sound_enabled",
        "timer",
    }
    if not required_room_columns.issubset(room_columns):
        db.execute("DROP TABLE IF EXISTS rooms")
        db.execute(
            """
            CREATE TABLE rooms (
              code TEXT PRIMARY KEY,
              parent_id INTEGER,
              host_name TEXT NOT NULL,
              active_mode TEXT NOT NULL DEFAULT 'drawing',
              active_stage_id TEXT NOT NULL DEFAULT 'forest',
              game_started INTEGER NOT NULL DEFAULT 0,
              drawing_locked INTEGER NOT NULL DEFAULT 0,
              timer_started INTEGER NOT NULL DEFAULT 0,
              timer_started_at TEXT,
              winners_revealed INTEGER NOT NULL DEFAULT 0,
              require_approval INTEGER NOT NULL DEFAULT 1,
              gallery_enabled INTEGER NOT NULL DEFAULT 0,
              sound_enabled INTEGER NOT NULL DEFAULT 1,
              timer INTEGER NOT NULL DEFAULT 5,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(parent_id) REFERENCES parent_accounts(id)
            )
            """
        )

    player_columns = {row["name"] for row in db.execute("PRAGMA table_info(room_players)").fetchall()}
    required_player_columns = {"room_code", "child_name", "progress", "status", "rating", "stage_id", "drawing_data"}
    if not required_player_columns.issubset(player_columns):
        db.execute("DROP TABLE IF EXISTS room_players")
        db.execute(
            """
            CREATE TABLE room_players (
              room_code TEXT NOT NULL,
              child_name TEXT NOT NULL,
              progress INTEGER NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'drawing',
              rating INTEGER NOT NULL DEFAULT 0,
              stage_id TEXT NOT NULL DEFAULT 'forest',
              drawing_data TEXT,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY(room_code, child_name COLLATE NOCASE),
              FOREIGN KEY(room_code) REFERENCES rooms(code)
            )
            """
        )


def ensure_user_defaults(db: sqlite3.Connection, user_id: int) -> None:
    for drawing in BASE_DRAWINGS:
        db.execute(
            """
            INSERT OR IGNORE INTO user_drawings (user_id, drawing_id, progress, completed)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, drawing[0], drawing[2], drawing[5]),
        )

    for achievement in BASE_ACHIEVEMENTS:
        db.execute(
            """
            INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked)
            VALUES (?, ?, 0)
            """,
            (user_id, achievement[0]),
        )

    db.execute(
        "INSERT OR IGNORE INTO parent_controls (user_id, require_export_approval) VALUES (?, 1)",
        (user_id,),
    )


def title_for_level(level: int) -> str:
    return TITLES_BY_LEVEL[min(max(level, 1), len(TITLES_BY_LEVEL)) - 1]
