from __future__ import annotations

import hashlib
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "uchi_game.sqlite3"

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
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              code TEXT NOT NULL UNIQUE COLLATE NOCASE,
              host_name TEXT NOT NULL,
              mode TEXT NOT NULL DEFAULT 'drawing',
              timer INTEGER NOT NULL DEFAULT 5,
              stage_id TEXT NOT NULL DEFAULT 'forest',
              started INTEGER NOT NULL DEFAULT 0,
              locked INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS room_players (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              room_id INTEGER NOT NULL,
              child_name TEXT NOT NULL,
              age INTEGER NOT NULL DEFAULT 6,
              progress INTEGER NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'waiting',
              joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(room_id, child_name),
              FOREIGN KEY(room_id) REFERENCES rooms(id)
            );

            CREATE TABLE IF NOT EXISTS room_drawings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              room_id INTEGER NOT NULL,
              player_id INTEGER,
              child_name TEXT NOT NULL,
              stage_id TEXT NOT NULL,
              image_data TEXT NOT NULL,
              progress INTEGER NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'waiting',
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(room_id) REFERENCES rooms(id),
              FOREIGN KEY(player_id) REFERENCES room_players(id)
            );
            """
        )

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
