from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.deps import get_db, require_admin
from app.routers.auth import _user_public
from app.routers.posts import _build_post_response
from app.utils import now_utc

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
async def overview(admin: dict = Depends(require_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    users = await db.users.count_documents({})
    posts = await db.posts.count_documents({})
    published = await db.posts.count_documents({"status": "published"})
    reported_comments = await db.comments.count_documents({"reported": True})
    return {
        "users": users,
        "posts": posts,
        "published_posts": published,
        "reported_comments": reported_comments,
    }


@router.get("/users")
async def list_users(admin: dict = Depends(require_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    items = []
    cursor = db.users.find().sort("created_at", -1)
    async for user in cursor:
        items.append(_user_public(user))
    return items


@router.get("/posts")
async def list_all_posts(admin: dict = Depends(require_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    items = []
    cursor = db.posts.find().sort("created_at", -1)
    async for post in cursor:
        items.append(await _build_post_response(post, db))
    return items


@router.get("/comments/reported")
async def reported_comments(admin: dict = Depends(require_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    items = []
    cursor = db.comments.find({"reported": True}).sort("updated_at", -1)
    async for comment in cursor:
        user = await db.users.find_one({"_id": comment["author_id"]})
        items.append(
            {
                "id": str(comment["_id"]),
                "post_id": str(comment["post_id"]),
                "author_name": user["name"] if user else "Unknown",
                "content": comment["content"],
                "reason": comment.get("report_reason"),
                "created_at": comment["created_at"],
            }
        )
    return items


@router.patch("/users/{user_id}")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(require_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    if role not in {"author", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role, "updated_at": now_utc()}})
    return {"message": "User updated"}


@router.delete("/comments/{comment_id}")
async def remove_reported_comment(comment_id: str, admin: dict = Depends(require_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.comments.delete_one({"_id": ObjectId(comment_id)})
    return {"message": "Comment removed"}
