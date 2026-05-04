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


class ParentAccountOut(BaseModel):
    id: int
    login: str
    displayName: str


class ParentAuthIn(BaseModel):
    login: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=4, max_length=64)
    display_name: str | None = Field(default=None, max_length=32)


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


class RoomSettingsOut(BaseModel):
    requireApproval: bool
    galleryEnabled: bool
    drawingLocked: bool
    soundEnabled: bool
    timer: int


class RoomPlayerOut(BaseModel):
    id: int
    name: str
    age: int = 6
    progress: int
    status: str
    rating: int = 0
    stageId: str
    drawingData: str | None = None


class RoomOut(BaseModel):
    code: str
    hostName: str
    activeMode: str
    activeStageId: str
    gameStarted: bool
    timerStarted: bool
    timerStartedAt: str | None = None
    timerEndsAt: str | None = None
    winnersRevealed: bool = False
    settings: RoomSettingsOut
    players: list[RoomPlayerOut]


class ParentAuthOut(BaseModel):
    token: str
    parent: ParentAccountOut
    room: RoomOut


class HostRoomIn(BaseModel):
    host_name: str = Field(min_length=2, max_length=32)
    room_code: str | None = Field(default=None, max_length=64)


class ChildRoomIn(BaseModel):
    child_name: str = Field(min_length=2, max_length=32)
    room_code: str = Field(min_length=4, max_length=64)


class RoomStateIn(BaseModel):
    active_mode: str | None = None
    active_stage_id: str | None = None
    game_started: bool | None = None
    drawing_locked: bool | None = None
    timer_started: bool | None = None
    winners_revealed: bool | None = None
    require_approval: bool | None = None
    gallery_enabled: bool | None = None
    sound_enabled: bool | None = None
    timer: int | None = Field(default=None, ge=2, le=10)
    reset_players: bool | None = None
    clear_drawings: bool | None = None


class RoomPlayerIn(BaseModel):
    child_name: str = Field(min_length=2, max_length=32)
    progress: int | None = Field(default=None, ge=0, le=100)
    status: str | None = None
    rating: int | None = Field(default=None, ge=0, le=5)
    stage_id: str | None = None
    drawing_data: str | None = None
