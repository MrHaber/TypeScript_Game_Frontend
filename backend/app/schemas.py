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
