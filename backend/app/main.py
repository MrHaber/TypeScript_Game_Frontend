from __future__ import annotations

import random

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import crud
from .database import connect, init_db
from .schemas import (
    AuthOut,
    AvatarIn,
    BackgroundIn,
    ClaimRewardIn,
    LoginIn,
    ParentControlsIn,
    ParentControlsOut,
    PlayerOut,
    RegisterIn,
    RoomCreateIn,
    RoomDrawingIn,
    RoomDrawingStatusIn,
    RoomJoinIn,
    RoomOut,
    RoomUpdateIn,
    SnapshotOut,
)

app = FastAPI(title="Uchi Drawing Game API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Нужно войти в профиль")
    token = authorization.removeprefix("Bearer ").strip()
    with connect() as db:
      user = crud.user_by_token(db, token)
      if user is None:
          raise HTTPException(status_code=401, detail="Сессия не найдена")
      return dict(user)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


def _room_row(db, code: str):
    room = db.execute("SELECT * FROM rooms WHERE code = ?", (code.upper(),)).fetchone()
    if room is None:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    return room


def _serialize_room(db, room) -> dict:
    players = db.execute(
        """
        SELECT id, child_name, age, progress, status
        FROM room_players
        WHERE room_id = ?
        ORDER BY joined_at, id
        """,
        (room["id"],),
    ).fetchall()
    drawings = db.execute(
        """
        SELECT id, player_id, child_name, stage_id, image_data, progress, status, created_at
        FROM room_drawings
        WHERE room_id = ?
        ORDER BY created_at, id
        """,
        (room["id"],),
    ).fetchall()
    return {
        "code": room["code"],
        "host_name": room["host_name"],
        "mode": room["mode"],
        "timer": int(room["timer"]),
        "stage_id": room["stage_id"],
        "started": bool(room["started"]),
        "locked": bool(room["locked"]),
        "players": [dict(player) for player in players],
        "drawings": [dict(drawing) for drawing in drawings],
    }


def _new_room_code(db) -> str:
    for _ in range(50):
        code = f"UCHI-{random.randint(100, 999)}"
        exists = db.execute("SELECT 1 FROM rooms WHERE code = ?", (code,)).fetchone()
        if exists is None:
            return code
    raise HTTPException(status_code=500, detail="Не удалось создать код комнаты")


def _validate_status(status: str) -> str:
    if status not in {"waiting", "approved", "hidden"}:
        raise HTTPException(status_code=400, detail="Неизвестный статус рисунка")
    return status


@app.post("/api/rooms", response_model=RoomOut)
def create_room(payload: RoomCreateIn):
    with connect() as db:
        code = _new_room_code(db)
        db.execute(
            """
            INSERT INTO rooms (code, host_name, mode, timer, stage_id, started, locked)
            VALUES (?, ?, ?, ?, ?, 0, 0)
            """,
            (code, payload.host_name, payload.mode, payload.timer, payload.stage_id),
        )
        room = _room_row(db, code)
        return _serialize_room(db, room)


@app.get("/api/rooms/{code}", response_model=RoomOut)
def get_room(code: str):
    with connect() as db:
        return _serialize_room(db, _room_row(db, code))


@app.post("/api/rooms/{code}/join", response_model=RoomOut)
def join_room(code: str, payload: RoomJoinIn):
    with connect() as db:
        room = _room_row(db, code)
        db.execute(
            """
            INSERT INTO room_players (room_id, child_name, age, progress, status)
            VALUES (?, ?, ?, 0, 'waiting')
            ON CONFLICT(room_id, child_name) DO UPDATE SET age = excluded.age
            """,
            (room["id"], payload.child_name, payload.age),
        )
        return _serialize_room(db, room)


@app.patch("/api/rooms/{code}", response_model=RoomOut)
def update_room(code: str, payload: RoomUpdateIn):
    with connect() as db:
        room = _room_row(db, code)
        data = payload.dict(exclude_unset=True)
        field_map = {
            "mode": "mode",
            "timer": "timer",
            "stage_id": "stage_id",
            "started": "started",
            "locked": "locked",
        }
        updates: list[str] = []
        values: list[object] = []
        for source, column in field_map.items():
            if source not in data or data[source] is None:
                continue
            value = data[source]
            if isinstance(value, bool):
                value = 1 if value else 0
            updates.append(f"{column} = ?")
            values.append(value)
        if updates:
            values.append(room["id"])
            db.execute(f"UPDATE rooms SET {', '.join(updates)} WHERE id = ?", values)
        updated = _room_row(db, code)
        return _serialize_room(db, updated)


@app.post("/api/rooms/{code}/drawings", response_model=RoomOut)
def save_room_drawing(code: str, payload: RoomDrawingIn):
    status = _validate_status(payload.status)
    with connect() as db:
        room = _room_row(db, code)
        player_id = payload.player_id
        if player_id is None:
            player = db.execute(
                "SELECT id FROM room_players WHERE room_id = ? AND child_name = ?",
                (room["id"], payload.child_name),
            ).fetchone()
            if player is None:
                cursor = db.execute(
                    """
                    INSERT INTO room_players (room_id, child_name, age, progress, status)
                    VALUES (?, ?, 6, ?, ?)
                    """,
                    (room["id"], payload.child_name, payload.progress, status),
                )
                player_id = int(cursor.lastrowid)
            else:
                player_id = int(player["id"])

        db.execute(
            """
            INSERT INTO room_drawings (room_id, player_id, child_name, stage_id, image_data, progress, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (room["id"], player_id, payload.child_name, payload.stage_id, payload.image_data, payload.progress, status),
        )
        db.execute(
            "UPDATE room_players SET progress = ?, status = ? WHERE id = ? AND room_id = ?",
            (payload.progress, status, player_id, room["id"]),
        )
        updated = _room_row(db, code)
        return _serialize_room(db, updated)


@app.patch("/api/rooms/{code}/drawings/{drawing_id}", response_model=RoomOut)
def update_room_drawing(code: str, drawing_id: int, payload: RoomDrawingStatusIn):
    status = _validate_status(payload.status)
    with connect() as db:
        room = _room_row(db, code)
        drawing = db.execute(
            "SELECT player_id FROM room_drawings WHERE id = ? AND room_id = ?",
            (drawing_id, room["id"]),
        ).fetchone()
        if drawing is None:
            raise HTTPException(status_code=404, detail="Рисунок не найден")
        db.execute(
            "UPDATE room_drawings SET status = ? WHERE id = ? AND room_id = ?",
            (status, drawing_id, room["id"]),
        )
        if drawing["player_id"] is not None:
            db.execute(
                "UPDATE room_players SET status = ? WHERE id = ? AND room_id = ?",
                (status, drawing["player_id"], room["id"]),
            )
        updated = _room_row(db, code)
        return _serialize_room(db, updated)


@app.post("/api/auth/register", response_model=AuthOut)
def register(payload: RegisterIn):
    with connect() as db:
        existing = db.execute("SELECT id FROM users WHERE child_name = ?", (payload.child_name,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Такой профиль уже есть, используй вход")
        user = crud.get_or_create_user(db, payload.child_name, payload.parent_pin)
        token = crud.create_session(db, int(user["id"]))
        data = crud.snapshot(db, user)
        return {**data, "token": token}


@app.post("/api/auth/login", response_model=AuthOut)
def login(payload: LoginIn):
    with connect() as db:
        user = db.execute("SELECT * FROM users WHERE child_name = ?", (payload.child_name,)).fetchone()
        if user is None:
            raise HTTPException(status_code=404, detail="Профиль не найден, сначала зарегистрируй ребенка")
        token = crud.create_session(db, int(user["id"]))
        data = crud.snapshot(db, user)
        return {**data, "token": token}


@app.get("/api/me", response_model=SnapshotOut)
def me(user=Depends(current_user)):
    with connect() as db:
        db_user = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        return crud.snapshot(db, db_user)


@app.post("/api/rewards/claim")
def claim_reward(payload: ClaimRewardIn, user=Depends(current_user)):
    with connect() as db:
        db_user = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        updated = crud.claim_reward(db, db_user, payload.drawing_id)
        return {
            "player": crud.serialize_player(updated),
            "achievements": crud.achievements_for_user(db, updated),
        }


@app.post("/api/drawings/background")
def save_background(payload: BackgroundIn, user=Depends(current_user)):
    if payload.background_kind not in {"shadow", "color", "art"}:
        raise HTTPException(status_code=400, detail="Неизвестный фон")
    with connect() as db:
        db.execute(
            """
            UPDATE user_drawings
            SET background_kind = ?
            WHERE user_id = ? AND drawing_id = ?
            """,
            (payload.background_kind, user["id"], payload.drawing_id),
        )
        db_user = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        crud.sync_achievements(db, db_user)
        for drawing in crud.drawings_for_user(db, int(user["id"])):
            if drawing["id"] == payload.drawing_id:
                return drawing
    raise HTTPException(status_code=404, detail="Рисунок не найден")


@app.patch("/api/profile/avatar", response_model=PlayerOut)
def update_avatar(payload: AvatarIn, user=Depends(current_user)):
    with connect() as db:
        db_user = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        if payload.avatar_id not in crud.serialize_player(db_user)["unlockedAvatarIds"]:
            raise HTTPException(status_code=403, detail="Аватар пока закрыт")
        db.execute("UPDATE users SET avatar_id = ? WHERE id = ?", (payload.avatar_id, user["id"]))
        updated = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        return crud.serialize_player(updated)


@app.patch("/api/parent/controls", response_model=ParentControlsOut)
def update_parent_controls(payload: ParentControlsIn, user=Depends(current_user)):
    with connect() as db:
        db.execute(
            """
            INSERT INTO parent_controls (user_id, require_export_approval)
            VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET require_export_approval = excluded.require_export_approval
            """,
            (user["id"], 1 if payload.require_export_approval else 0),
        )
        return {"require_export_approval": payload.require_export_approval}
