from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import crud
from .database import connect, init_db
from .schemas import (
    AuthOut,
    AvatarIn,
    BackgroundIn,
    ClaimRewardIn,
    ChildRoomIn,
    HostRoomIn,
    LoginIn,
    ParentControlsIn,
    ParentControlsOut,
    PlayerOut,
    RegisterIn,
    RoomOut,
    RoomPlayerIn,
    RoomStateIn,
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


@app.post("/api/rooms/host", response_model=RoomOut)
def host_room(payload: HostRoomIn):
    with connect() as db:
        room = crud.get_or_create_room(db, payload.host_name, payload.room_code)
        return crud.serialize_room(db, room)


@app.post("/api/rooms/child", response_model=RoomOut)
def child_room(payload: ChildRoomIn):
    with connect() as db:
        room = crud.join_room(db, payload.child_name, payload.room_code)
        if room is None:
            raise HTTPException(status_code=404, detail="Комната не найдена")
        return crud.serialize_room(db, room)


@app.get("/api/rooms/{room_code}", response_model=RoomOut)
def room_snapshot(room_code: str):
    with connect() as db:
        room = crud.room_by_code(db, room_code)
        if room is None:
            raise HTTPException(status_code=404, detail="Комната не найдена")
        return crud.serialize_room(db, room)


@app.patch("/api/rooms/{room_code}", response_model=RoomOut)
def patch_room(room_code: str, payload: RoomStateIn):
    with connect() as db:
        room = crud.update_room_state(db, room_code, payload.dict(exclude_unset=True))
        if room is None:
            raise HTTPException(status_code=404, detail="Комната не найдена")
        return crud.serialize_room(db, room)


@app.patch("/api/rooms/{room_code}/players", response_model=RoomOut)
def patch_room_player(room_code: str, payload: RoomPlayerIn):
    with connect() as db:
        room = crud.update_room_player(db, room_code, payload.dict(exclude_unset=True))
        if room is None:
            raise HTTPException(status_code=404, detail="Комната не найдена")
        return crud.serialize_room(db, room)
