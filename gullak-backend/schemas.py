from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class TokenResponse(BaseModel):
    access_token: str
    name: str
    username: str
    user_id: int


class RegisterRequest(BaseModel):
    name: str
    phone: str
    username: str
    password: str


class LoginRequest(BaseModel):
    phone: str
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    username: str


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    deadline: date
    emoji: str = "🎯"


class GoalUpdate(BaseModel):
    name: str | None = None
    target_amount: float | None = None
    deadline: date | None = None
    emoji: str | None = None


class AmountRequest(BaseModel):
    amount: float


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    target_amount: float
    saved_amount: float
    deadline: date
    emoji: str
    created_at: datetime


class GroupGoalCreate(BaseModel):
    name: str
    target_amount: float
    deadline: date
    emoji: str = "👥"
    member_ids: list[int]


class GroupGoalUpdate(BaseModel):
    name: str | None = None
    target_amount: float | None = None
    deadline: date | None = None
    emoji: str | None = None


class NudgeRequest(BaseModel):
    member_user_id: int


class GroupMemberOut(BaseModel):
    user_id: int
    name: str
    username: str
    saved_amount: float
    nudged_at: datetime | None = None


class GroupGoalOut(BaseModel):
    id: int
    creator_id: int
    name: str
    target_amount: float
    saved_amount: float
    deadline: date
    emoji: str
    created_at: datetime
    per_member_share: float
    members: list[GroupMemberOut]


class FriendRequestBody(BaseModel):
    user_id: int


class FriendRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_user: UserPublic
    to_user: UserPublic
    status: str
    created_at: datetime


class SearchUserOut(BaseModel):
    id: int
    name: str
    phone: str
    username: str
    relationship: str


class CheckinCreate(BaseModel):
    amount: float
    category: str
    decision: str
    goal_id: int | None = None


class CheckinOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    goal_id: int | None
    amount: float
    category: str
    decision: str
    created_at: datetime
