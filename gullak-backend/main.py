from datetime import datetime, timedelta
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import Base, engine, get_db
from models import Checkin, FriendRequest, Goal, GroupGoal, GroupGoalMember, User
from schemas import (
    AmountRequest,
    CheckinCreate,
    CheckinOut,
    FriendRequestBody,
    FriendRequestOut,
    GoalCreate,
    GoalOut,
    GoalUpdate,
    GroupGoalCreate,
    GroupGoalOut,
    GroupGoalUpdate,
    LoginRequest,
    NudgeRequest,
    RegisterRequest,
    SearchUserOut,
    TokenResponse,
    UserPublic,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gullak API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def token_response(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user), name=user.name, username=user.username, user_id=user.id)


def ensure_positive_amount(amount: float) -> None:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")


def friend_pair_filter(user_a: int, user_b: int):
    return or_(
        and_(FriendRequest.from_user_id == user_a, FriendRequest.to_user_id == user_b),
        and_(FriendRequest.from_user_id == user_b, FriendRequest.to_user_id == user_a),
    )


def serialize_group_goal(goal: GroupGoal) -> GroupGoalOut:
    members = [
        {
            "user_id": member.user_id,
            "name": member.user.name,
            "username": member.user.username,
            "saved_amount": member.saved_amount,
            "nudged_at": member.nudged_at,
        }
        for member in goal.members
    ]
    saved_amount = sum(member.saved_amount for member in goal.members)
    member_count = max(1, len(goal.members))
    return GroupGoalOut(
        id=goal.id,
        creator_id=goal.creator_id,
        name=goal.name,
        target_amount=goal.target_amount,
        saved_amount=saved_amount,
        deadline=goal.deadline,
        emoji=goal.emoji,
        created_at=goal.created_at,
        per_member_share=goal.target_amount / member_count,
        members=members,
    )


def accepted_friend_ids(db: Session, user_id: int) -> list[int]:
    result = []
    accepted = db.query(FriendRequest).filter(
        FriendRequest.status == "accepted",
        or_(FriendRequest.from_user_id == user_id, FriendRequest.to_user_id == user_id),
    ).all()
    for request in accepted:
        result.append(request.to_user_id if request.from_user_id == user_id else request.from_user_id)
    return result


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(or_(User.phone == payload.phone, User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone or username already exists")
    user = User(
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        username=payload.username.strip(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return token_response(user)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    return token_response(user)


@app.get("/dashboard/summary")
def dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_spent = db.query(func.coalesce(func.sum(Checkin.amount), 0)).filter(Checkin.user_id == current_user.id, Checkin.decision == "spent").scalar()
    total_saved = db.query(func.coalesce(func.sum(Goal.saved_amount), 0)).filter(Goal.user_id == current_user.id).scalar()
    goals_count = db.query(Goal).filter(Goal.user_id == current_user.id).count()
    return {
        "monthly_budget": current_user.monthly_budget,
        "total_spent": total_spent,
        "total_saved": total_saved,
        "goals_count": goals_count,
    }


@app.post("/goals", response_model=GoalOut)
def create_goal(payload: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = Goal(user_id=current_user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@app.get("/goals", response_model=list[GoalOut])
def list_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Goal).filter(Goal.user_id == current_user.id).order_by(Goal.created_at.desc()).all()


@app.patch("/goals/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, payload: GoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return goal


@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}


@app.patch("/goals/{goal_id}/add-savings", response_model=GoalOut)
def add_savings(goal_id: int, payload: AmountRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_positive_amount(payload.amount)
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.saved_amount = min(goal.target_amount, goal.saved_amount + payload.amount)
    db.commit()
    db.refresh(goal)
    return goal


@app.post("/group-goals", response_model=GroupGoalOut)
def create_group_goal(payload: GroupGoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member_ids = sorted(set(payload.member_ids + [current_user.id]))
    valid_members = db.query(User).filter(User.id.in_(member_ids)).all()
    if len(valid_members) != len(member_ids):
        raise HTTPException(status_code=400, detail="One or more members were not found")
    group = GroupGoal(
        creator_id=current_user.id,
        name=payload.name,
        target_amount=payload.target_amount,
        deadline=payload.deadline,
        emoji=payload.emoji,
    )
    db.add(group)
    db.flush()
    for user_id in member_ids:
        db.add(GroupGoalMember(group_goal_id=group.id, user_id=user_id))
    db.commit()
    return serialize_group_goal(
        db.query(GroupGoal).options(joinedload(GroupGoal.members).joinedload(GroupGoalMember.user)).filter(GroupGoal.id == group.id).first()
    )


@app.get("/group-goals", response_model=list[GroupGoalOut])
def list_group_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = (
        db.query(GroupGoal)
        .join(GroupGoalMember)
        .options(joinedload(GroupGoal.members).joinedload(GroupGoalMember.user))
        .filter(GroupGoalMember.user_id == current_user.id)
        .order_by(GroupGoal.created_at.desc())
        .all()
    )
    return [serialize_group_goal(goal) for goal in goals]


@app.get("/group-goals/{group_goal_id}", response_model=GroupGoalOut)
def get_group_goal(group_goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(GroupGoal).options(joinedload(GroupGoal.members).joinedload(GroupGoalMember.user)).filter(GroupGoal.id == group_goal_id).first()
    if not goal or current_user.id not in [member.user_id for member in goal.members]:
        raise HTTPException(status_code=404, detail="Group goal not found")
    return serialize_group_goal(goal)


@app.patch("/group-goals/{group_goal_id}", response_model=GroupGoalOut)
def update_group_goal(group_goal_id: int, payload: GroupGoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(GroupGoal).options(joinedload(GroupGoal.members).joinedload(GroupGoalMember.user)).filter(GroupGoal.id == group_goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Group goal not found")
    if goal.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can edit this group goal")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return serialize_group_goal(goal)


@app.delete("/group-goals/{group_goal_id}")
def delete_group_goal(group_goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(GroupGoal).filter(GroupGoal.id == group_goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Group goal not found")
    if goal.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this group goal")
    db.delete(goal)
    db.commit()
    return {"message": "Group goal deleted"}


@app.post("/group-goals/{group_goal_id}/contribute", response_model=GroupGoalOut)
def contribute_group_goal(group_goal_id: int, payload: AmountRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_positive_amount(payload.amount)
    member = db.query(GroupGoalMember).filter(GroupGoalMember.group_goal_id == group_goal_id, GroupGoalMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Group goal not found")
    member.saved_amount += payload.amount
    db.commit()
    goal = db.query(GroupGoal).options(joinedload(GroupGoal.members).joinedload(GroupGoalMember.user)).filter(GroupGoal.id == group_goal_id).first()
    return serialize_group_goal(goal)


@app.post("/group-goals/{group_goal_id}/nudge", response_model=GroupGoalOut)
def nudge_group_goal(group_goal_id: int, payload: NudgeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_member = db.query(GroupGoalMember).filter(GroupGoalMember.group_goal_id == group_goal_id, GroupGoalMember.user_id == current_user.id).first()
    target_member = db.query(GroupGoalMember).filter(GroupGoalMember.group_goal_id == group_goal_id, GroupGoalMember.user_id == payload.member_user_id).first()
    if not current_member or not target_member:
        raise HTTPException(status_code=404, detail="Group member not found")
    target_member.nudged_at = datetime.utcnow()
    db.commit()
    goal = db.query(GroupGoal).options(joinedload(GroupGoal.members).joinedload(GroupGoalMember.user)).filter(GroupGoal.id == group_goal_id).first()
    return serialize_group_goal(goal)


@app.get("/friends", response_model=list[UserPublic])
def list_friends(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ids = accepted_friend_ids(db, current_user.id)
    if not ids:
        return []
    return db.query(User).filter(User.id.in_(ids)).order_by(User.name).all()


@app.get("/friends/search", response_model=list[SearchUserOut])
def search_friends(q: str = Query(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    term = f"%{q.strip()}%"
    users = db.query(User).filter(User.id != current_user.id, or_(User.name.ilike(term), User.username.ilike(term), User.phone.ilike(term))).limit(20).all()
    accepted_ids = set(accepted_friend_ids(db, current_user.id))
    sent_ids = {
        request.to_user_id
        for request in db.query(FriendRequest).filter(FriendRequest.from_user_id == current_user.id, FriendRequest.status == "pending").all()
    }
    result = []
    for user in users:
        relationship = "none"
        if user.id in accepted_ids:
            relationship = "friends"
        elif user.id in sent_ids:
            relationship = "sent"
        result.append(SearchUserOut(id=user.id, name=user.name, phone=user.phone, username=user.username, relationship=relationship))
    return result


@app.post("/friends/request")
def send_friend_request(payload: FriendRequestBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot add yourself")
    target = db.get(User, payload.user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(FriendRequest).filter(friend_pair_filter(current_user.id, payload.user_id)).first()
    if existing:
        if existing.status == "rejected":
            existing.from_user_id = current_user.id
            existing.to_user_id = payload.user_id
            existing.status = "pending"
        else:
            raise HTTPException(status_code=400, detail="Friend request already exists")
    else:
        db.add(FriendRequest(from_user_id=current_user.id, to_user_id=payload.user_id))
    db.commit()
    return {"message": "Friend request sent"}


@app.post("/friends/accept/{request_id}", response_model=FriendRequestOut)
def accept_friend_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    request = db.query(FriendRequest).options(joinedload(FriendRequest.from_user), joinedload(FriendRequest.to_user)).filter(FriendRequest.id == request_id, FriendRequest.to_user_id == current_user.id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    request.status = "accepted"
    db.commit()
    db.refresh(request)
    return request


@app.post("/friends/reject/{request_id}", response_model=FriendRequestOut)
def reject_friend_request(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    request = db.query(FriendRequest).options(joinedload(FriendRequest.from_user), joinedload(FriendRequest.to_user)).filter(FriendRequest.id == request_id, FriendRequest.to_user_id == current_user.id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    request.status = "rejected"
    db.commit()
    db.refresh(request)
    return request


@app.delete("/friends/{user_id}")
def remove_friend(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    request = db.query(FriendRequest).filter(friend_pair_filter(current_user.id, user_id), FriendRequest.status == "accepted").first()
    if not request:
        raise HTTPException(status_code=404, detail="Friend not found")
    db.delete(request)
    db.commit()
    return {"message": "Friend removed"}


@app.get("/friends/requests/pending", response_model=list[FriendRequestOut])
def pending_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(FriendRequest)
        .options(joinedload(FriendRequest.from_user), joinedload(FriendRequest.to_user))
        .filter(FriendRequest.to_user_id == current_user.id, FriendRequest.status == "pending")
        .order_by(FriendRequest.created_at.desc())
        .all()
    )


@app.post("/checkins", response_model=CheckinOut)
def create_checkin(payload: CheckinCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_positive_amount(payload.amount)
    if payload.decision not in {"spent", "skipped"}:
        raise HTTPException(status_code=400, detail="Decision must be spent or skipped")
    checkin = Checkin(user_id=current_user.id, **payload.model_dump())
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@app.get("/checkins/history", response_model=list[CheckinOut])
def checkin_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Checkin).filter(Checkin.user_id == current_user.id).order_by(Checkin.created_at.desc()).limit(20).all()


@app.get("/checkins/weekly-summary")
def weekly_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    start = datetime.utcnow() - timedelta(days=7)
    spent_rows = db.query(Checkin).filter(Checkin.user_id == current_user.id, Checkin.decision == "spent", Checkin.created_at >= start).all()
    total_spent = sum(row.amount for row in spent_rows)
    totals = {}
    for row in spent_rows:
        totals[row.category] = totals.get(row.category, 0) + row.amount
    breakdown = [{"category": key, "amount": value} for key, value in sorted(totals.items(), key=lambda item: item[1], reverse=True)]
    top_category = breakdown[0]["category"] if breakdown else None
    return {"total_spent": total_spent, "top_category": top_category, "spend_by_category": breakdown}
