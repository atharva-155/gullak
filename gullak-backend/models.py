from datetime import date, datetime
from sqlalchemy import Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    monthly_budget: Mapped[float] = mapped_column(Float, default=5000)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    saved_amount: Mapped[float] = mapped_column(Float, default=0)
    deadline: Mapped[date] = mapped_column(Date, nullable=False)
    emoji: Mapped[str] = mapped_column(String(20), default="🎯")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")


class GroupGoal(Base):
    __tablename__ = "group_goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    deadline: Mapped[date] = mapped_column(Date, nullable=False)
    emoji: Mapped[str] = mapped_column(String(20), default="👥")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    creator = relationship("User")
    members = relationship("GroupGoalMember", back_populates="group_goal", cascade="all, delete-orphan")


class GroupGoalMember(Base):
    __tablename__ = "group_goal_members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_goal_id: Mapped[int] = mapped_column(ForeignKey("group_goals.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    saved_amount: Mapped[float] = mapped_column(Float, default=0)
    nudged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    group_goal = relationship("GroupGoal", back_populates="members")
    user = relationship("User")


class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])


class Checkin(Base):
    __tablename__ = "checkins"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    goal_id: Mapped[int | None] = mapped_column(ForeignKey("goals.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    decision: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    goal = relationship("Goal")
