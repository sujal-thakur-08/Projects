from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.deps import get_current_user, get_db
from app.schemas.user import UserPublic
from app.routers.auth import _user_public
from app.routers.posts import _build_post_response

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{username}", response_model=UserPublic)
async def get_user_profile(username: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"username": username.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_public(user)


@router.get("/me/posts")
async def my_posts(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    items = []
    cursor = db.posts.find({"author_id": current_user["_id"]}).sort("created_at", -1)
    async for post in cursor:
        items.append(await _build_post_response(post, db, str(current_user["_id"])))
    return items


@router.get("/me/bookmarks")
async def my_bookmarks(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    items = []
    cursor = db.posts.find({"bookmark_user_ids": current_user["_id"]}).sort("created_at", -1)
    async for post in cursor:
        items.append(await _build_post_response(post, db, str(current_user["_id"])))
    return items


@router.get("/me/liked")
async def my_liked(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    items = []
    cursor = db.posts.find({"like_user_ids": current_user["_id"]}).sort("created_at", -1)
    async for post in cursor:
        items.append(await _build_post_response(post, db, str(current_user["_id"])))
    return items
