from __future__ import annotations

from collections import defaultdict

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.deps import get_current_user, get_db
from app.schemas.comment import CommentCreate, CommentPublic
from app.utils import now_utc

router = APIRouter(prefix="/posts", tags=["comments"])


def _comment_payload(comment: dict, author: dict | None) -> dict:
    return {
        "id": str(comment["_id"]),
        "post_id": str(comment["post_id"]),
        "author_id": str(comment["author_id"]),
        "author_name": author["name"] if author else "Unknown",
        "author_username": author["username"] if author else "unknown",
        "author_avatar_url": author.get("avatar_url") if author else None,
        "content": comment["content"],
        "parent_id": str(comment["parent_id"]) if comment.get("parent_id") else None,
        "created_at": comment["created_at"],
        "updated_at": comment["updated_at"],
        "replies": [],
        "reported": comment.get("reported", False),
        "report_reason": comment.get("report_reason"),
    }


async def _build_comment_tree(post_id: ObjectId, db: AsyncIOMotorDatabase) -> list[dict]:
    comments: list[dict] = []
    cursor = db.comments.find({"post_id": post_id}).sort("created_at", 1)
    users: dict[ObjectId, dict] = {}
    raw: list[dict] = []
    async for comment in cursor:
        raw.append(comment)
        if comment["author_id"] not in users:
            user = await db.users.find_one({"_id": comment["author_id"]})
            if user:
                users[comment["author_id"]] = user
    by_id: dict[ObjectId, dict] = {}
    children: defaultdict[ObjectId | None, list[dict]] = defaultdict(list)
    for comment in raw:
        payload = _comment_payload(comment, users.get(comment["author_id"]))
        by_id[comment["_id"]] = payload
        children[comment.get("parent_id")].append(payload)
    for payload in by_id.values():
        comment_id = ObjectId(payload["id"])
        payload["replies"] = children.get(comment_id, [])
    return children.get(None, [])


@router.get("/{post_id}/comments", response_model=list[CommentPublic])
async def get_comments(post_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    post_oid = ObjectId(post_id)
    return await _build_comment_tree(post_oid, db)


@router.post("/{post_id}/comments", response_model=CommentPublic)
async def create_comment(
    post_id: str,
    payload: CommentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    parent_id = ObjectId(payload.parent_id) if payload.parent_id else None
    if parent_id and not await db.comments.find_one({"_id": parent_id, "post_id": post["_id"]}):
        raise HTTPException(status_code=400, detail="Parent comment not found")
    comment = {
        "post_id": post["_id"],
        "author_id": current_user["_id"],
        "content": payload.content.strip(),
        "parent_id": parent_id,
        "reported": False,
        "report_reason": None,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    result = await db.comments.insert_one(comment)
    await db.posts.update_one({"_id": post["_id"]}, {"$inc": {"comments_count": 1}})
    comment["_id"] = result.inserted_id
    author = current_user
    return _comment_payload(comment, author)


@router.put("/comments/{comment_id}", response_model=CommentPublic)
async def update_comment(
    comment_id: str,
    payload: CommentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["author_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.comments.update_one({"_id": comment["_id"]}, {"$set": {"content": payload.content.strip(), "updated_at": now_utc()}})
    refreshed = await db.comments.find_one({"_id": comment["_id"]})
    return _comment_payload(refreshed, current_user)


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment["author_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.comments.delete_one({"_id": comment["_id"]})
    await db.posts.update_one({"_id": comment["post_id"]}, {"$inc": {"comments_count": -1}})
    return {"message": "Comment deleted"}


@router.post("/comments/{comment_id}/report")
async def report_comment(
    comment_id: str,
    reason: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    await db.comments.update_one({"_id": comment["_id"]}, {"$set": {"reported": True, "report_reason": reason, "updated_at": now_utc()}})
    return {"message": "Comment reported"}
