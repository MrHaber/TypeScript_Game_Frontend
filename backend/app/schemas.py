from pydantic import BaseModel, Field


class PlayerOut(BaseModel):
    id: int
    name: str
    title: str
    stars: int
    dayStars: int
    level: int
    avatarId: str
    unlockedAvatarIds: list[str]


class DrawingOut(BaseModel):
    id: str
    title: str
    progress: int
    palette: list[str]
    shadowSlot: int
    completed: bool


class AchievementOut(BaseModel):
    id: str
    icon: str
    title: str
    description: str
    unlocked: bool
    rarity: str


class SnapshotOut(BaseModel):
    player: PlayerOut
    drawings: list[DrawingOut]
    achievements: list[AchievementOut]


class AuthOut(SnapshotOut):
    token: str


class LoginIn(BaseModel):
    child_name: str = Field(min_length=2, max_length=32)


class RegisterIn(LoginIn):
    parent_pin: str = Field(min_length=4, max_length=12)


class ClaimRewardIn(BaseModel):
    drawing_id: str


class AvatarIn(BaseModel):
    avatar_id: str


class BackgroundIn(BaseModel):
    drawing_id: str
    background_kind: str


class ParentControlsIn(BaseModel):
    require_export_approval: bool


class ParentControlsOut(BaseModel):
    require_export_approval: bool


class RoomPlayerOut(BaseModel):
    id: int
    child_name: str
    age: int
    progress: int
    status: str


class RoomDrawingOut(BaseModel):
    id: int
    player_id: int | None = None
    child_name: str
    stage_id: str
    image_data: str
    progress: int
    status: str
    created_at: str


class RoomOut(BaseModel):
    code: str
    host_name: str
    mode: str
    timer: int
    stage_id: str
    started: bool
    locked: bool
    players: list[RoomPlayerOut]
    drawings: list[RoomDrawingOut]


class RoomCreateIn(BaseModel):
    host_name: str = Field(min_length=2, max_length=40)
    mode: str = Field(default="drawing", max_length=24)
    timer: int = Field(default=5, ge=1, le=30)
    stage_id: str = Field(default="forest", max_length=64)


class RoomJoinIn(BaseModel):
    child_name: str = Field(min_length=2, max_length=32)
    age: int = Field(default=6, ge=3, le=12)


class RoomUpdateIn(BaseModel):
    mode: str | None = Field(default=None, max_length=24)
    timer: int | None = Field(default=None, ge=1, le=30)
    stage_id: str | None = Field(default=None, max_length=64)
    started: bool | None = None
    locked: bool | None = None


class RoomDrawingIn(BaseModel):
    player_id: int | None = None
    child_name: str = Field(min_length=2, max_length=32)
    stage_id: str = Field(max_length=64)
    image_data: str = Field(min_length=32)
    progress: int = Field(default=0, ge=0, le=100)
    status: str = Field(default="waiting", max_length=16)


class RoomDrawingStatusIn(BaseModel):
    status: str = Field(max_length=16)
