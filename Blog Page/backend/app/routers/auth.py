from datetime import timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.deps import get_current_user, get_db
from app.schemas.auth import AuthResponse, Token, UserCreate, UserLogin, PasswordUpdate
from app.schemas.user import UserPublic, UserUpdate
from app.utils import now_utc

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_public(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "username": doc["username"],
        "email": doc["email"],
        "bio": doc.get("bio"),
        "avatar_url": doc.get("avatar_url"),
        "role": doc.get("role", "author"),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "follower_count": len(doc.get("followers", [])),
        "post_count": doc.get("post_count", 0),
    }


@router.post("/register", response_model=AuthResponse)
async def register_user(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db.users.find_one({"$or": [{"email": payload.email.lower()}, {"username": payload.username.lower()}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    is_first_user = await db.users.count_documents({}) == 0
    doc = {
        "name": payload.name.strip(),
        "username": payload.username.strip().lower(),
        "email": payload.email.lower(),
        "password_hash": get_password_hash(payload.password),
        "bio": "",
        "avatar_url": None,
        "role": "admin" if is_first_user else "author",
        "followers": [],
        "following": [],
        "bookmarked_post_ids": [],
        "liked_post_ids": [],
        "post_count": 0,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    token = create_access_token(str(result.inserted_id))
    return AuthResponse(access_token=token, user=_user_public(doc))


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    expires = timedelta(minutes=get_settings().access_token_expire_minutes)
    return AuthResponse(access_token=create_access_token(str(user["_id"]), expires_delta=expires), user=_user_public(user))


@router.get("/me", response_model=UserPublic)
async def read_me(current_user: dict = Depends(get_current_user)):
    return _user_public(current_user)


@router.put("/me", response_model=UserPublic)
async def update_me(
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    update_data = payload.model_dump(exclude_unset=True)
    if "username" in update_data and update_data["username"]:
        update_data["username"] = update_data["username"].lower()
        existing = await db.users.find_one({"username": update_data["username"], "_id": {"$ne": current_user["_id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
    update_data["updated_at"] = now_utc()
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return _user_public(updated)


@router.put("/me/password")
async def update_password(
    payload: PasswordUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password_hash": get_password_hash(payload.new_password), "updated_at": now_utc()}},
    )
    return {"message": "Password updated"}
