from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.deps import get_current_user, get_db, get_optional_current_user
from app.schemas.post import PostCreate, PostPublic, PostUpdate, RelatedPost
from app.services.ai import summarize_content, suggest_tags_and_category
from app.utils import build_slug, estimate_reading_time, extract_text_from_html, now_utc, pick_related_tags

router = APIRouter(prefix="/posts", tags=["posts"])


def _author_payload(user: dict) -> dict[str, Any]:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "username": user["username"],
        "avatar_url": user.get("avatar_url"),
    }


async def _build_post_response(post: dict, db: AsyncIOMotorDatabase, current_user_id: str | None = None) -> dict:
    author = await db.users.find_one({"_id": post["author_id"]})
    content_text = extract_text_from_html(post.get("content_html", ""))
    reading_time = post.get("reading_time_minutes") or estimate_reading_time(content_text)
    likes = post.get("like_user_ids", [])
    bookmarks = post.get("bookmark_user_ids", [])
    return {
        "id": str(post["_id"]),
        "slug": post["slug"],
        "title": post["title"],
        "content_html": post.get("content_html", ""),
        "content_json": post.get("content_json"),
        "excerpt": post.get("excerpt"),
        "tags": post.get("tags", []),
        "category": post.get("category"),
        "cover_image": post.get("cover_image"),
        "status": post.get("status", "draft"),
        "author_id": str(post["author_id"]),
        "author_name": author["name"] if author else "Unknown",
        "author_username": author["username"] if author else "unknown",
        "author_avatar_url": author.get("avatar_url") if author else None,
        "created_at": post["created_at"],
        "updated_at": post["updated_at"],
        "published_at": post.get("published_at"),
        "summary": post.get("summary"),
        "reading_time_minutes": reading_time,
        "likes_count": len(likes),
        "bookmarks_count": len(bookmarks),
        "comments_count": post.get("comments_count", 0),
        "views_count": post.get("views_count", 0),
        "is_liked": bool(current_user_id and current_user_id in likes),
        "is_bookmarked": bool(current_user_id and current_user_id in bookmarks),
    }


async def _ensure_unique_slug(db: AsyncIOMotorDatabase, title: str) -> str:
    slug = build_slug(title)
    while await db.posts.find_one({"slug": slug}):
        slug = build_slug(title)
    return slug


@router.get("")
async def list_posts(
    q: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    author: str | None = Query(default=None),
    category: str | None = Query(default=None),
    status_filter: str = Query(default="published", alias="status"),
    sort: str = Query(default="recent"),
    from_date: datetime | None = Query(default=None),
    to_date: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=100),
    current_user: dict | None = Depends(get_optional_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict[str, Any] = {}
    if status_filter != "all":
        query["status"] = status_filter
    if tag:
        query["tags"] = tag.lower()
    if category:
        query["category"] = category
    if from_date or to_date:
        query["created_at"] = {}
        if from_date:
            query["created_at"]["$gte"] = from_date
        if to_date:
            query["created_at"]["$lte"] = to_date
    if author:
        author_doc = await db.users.find_one({"username": author.lower()})
        if not author_doc:
            return {"items": [], "total": 0, "page": page, "limit": limit}
        query["author_id"] = author_doc["_id"]
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"excerpt": {"$regex": q, "$options": "i"}},
            {"content_html": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]

    sort_spec = [("created_at", -1)]
    if sort == "trending":
        sort_spec = [("views_count", -1), ("likes_count", -1), ("created_at", -1)]
    elif sort == "popular":
        sort_spec = [("likes_count", -1), ("views_count", -1), ("created_at", -1)]

    total = await db.posts.count_documents(query)
    cursor = db.posts.find(query).sort(sort_spec).skip((page - 1) * limit).limit(limit)
    items: list[dict] = []
    current_user_id = str(current_user["_id"]) if current_user else None
    async for post in cursor:
        items.append(await _build_post_response(post, db, current_user_id))
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/featured")
async def featured_posts(db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.posts.find({"status": "published"}).sort([("views_count", -1), ("likes_count", -1)]).limit(6)
    items: list[dict] = []
    async for post in cursor:
        items.append(await _build_post_response(post, db))
    return items


@router.get("/{slug}")
async def get_post(slug: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict | None = Depends(get_optional_current_user)):
    post = await db.posts.find_one({"slug": slug})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.posts.update_one({"_id": post["_id"]}, {"$inc": {"views_count": 1}})
    refreshed = await db.posts.find_one({"_id": post["_id"]})
    return await _build_post_response(refreshed, db, str(current_user["_id"]) if current_user else None)


@router.get("/id/{post_id}")
async def get_post_by_id(post_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict | None = Depends(get_optional_current_user)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return await _build_post_response(post, db, str(current_user["_id"]) if current_user else None)


@router.post("", response_model=PostPublic)
async def create_post(payload: PostCreate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    slug = await _ensure_unique_slug(db, payload.title)
    ai_summary = payload.ai_summary or await summarize_content(payload.content_html, payload.title)
    ai_tags = await suggest_tags_and_category(payload.content_html, payload.title)
    tags = sorted({*(tag.lower() for tag in payload.tags), *(tag.lower() for tag in ai_tags["tags"])} )
    category = payload.category or ai_tags["category"]
    excerpt = payload.excerpt or extract_text_from_html(payload.content_html)[:220]
    if len(excerpt) == 220:
        excerpt += "..."
    reading_time_minutes = estimate_reading_time(extract_text_from_html(payload.content_html))
    post = {
        "slug": slug,
        "title": payload.title.strip(),
        "content_html": payload.content_html,
        "content_json": payload.content_json,
        "excerpt": excerpt,
        "tags": tags,
        "category": category,
        "cover_image": payload.cover_image,
        "status": payload.status,
        "summary": ai_summary,
        "author_id": current_user["_id"],
        "created_at": now_utc(),
        "updated_at": now_utc(),
        "published_at": now_utc() if payload.status == "published" else None,
        "reading_time_minutes": reading_time_minutes,
        "views_count": 0,
        "comments_count": 0,
        "like_user_ids": [],
        "bookmark_user_ids": [],
    }
    result = await db.posts.insert_one(post)
    await db.users.update_one({"_id": current_user["_id"]}, {"$inc": {"post_count": 1}})
    created = await db.posts.find_one({"_id": result.inserted_id})
    return await _build_post_response(created, db, str(current_user["_id"]))


@router.put("/{post_id}", response_model=PostPublic)
async def update_post(post_id: str, payload: PostUpdate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    updates = payload.model_dump(exclude_unset=True)
    if updates.get("title") and updates["title"] != post["title"]:
        updates["slug"] = await _ensure_unique_slug(db, updates["title"])
    if updates.get("content_html"):
        updates["summary"] = await summarize_content(updates["content_html"], updates.get("title") or post["title"])
        tag_data = await suggest_tags_and_category(updates["content_html"], updates.get("title") or post["title"])
        updates.setdefault("tags", sorted({*(tag.lower() for tag in tag_data["tags"]), *(post.get("tags", []))}))
        updates.setdefault("category", tag_data["category"])
        updates.setdefault("reading_time_minutes", estimate_reading_time(extract_text_from_html(updates["content_html"])))
        if not updates.get("excerpt"):
            excerpt = extract_text_from_html(updates["content_html"])[:220]
            updates["excerpt"] = excerpt + ("..." if len(excerpt) == 220 else "")
    if updates.get("status") == "published" and not post.get("published_at"):
        updates["published_at"] = now_utc()
    updates["updated_at"] = now_utc()
    await db.posts.update_one({"_id": post["_id"]}, {"$set": updates})
    refreshed = await db.posts.find_one({"_id": post["_id"]})
    return await _build_post_response(refreshed, db, str(current_user["_id"]))


@router.delete("/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.posts.delete_one({"_id": post["_id"]})
    await db.comments.delete_many({"post_id": post["_id"]})
    await db.users.update_one({"_id": post["author_id"]}, {"$inc": {"post_count": -1}})
    return {"message": "Post deleted"}


@router.post("/{post_id}/publish", response_model=PostPublic)
async def publish_post(post_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.posts.update_one({"_id": post["_id"]}, {"$set": {"status": "published", "published_at": now_utc(), "updated_at": now_utc()}})
    refreshed = await db.posts.find_one({"_id": post["_id"]})
    return await _build_post_response(refreshed, db, str(current_user["_id"]))


@router.post("/{post_id}/like")
async def toggle_like(post_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user_id = current_user["_id"]
    liked_ids = post.get("like_user_ids", [])
    if user_id in liked_ids:
        await db.posts.update_one({"_id": post["_id"]}, {"$pull": {"like_user_ids": user_id}})
        await db.users.update_one({"_id": user_id}, {"$pull": {"liked_post_ids": post["_id"]}})
        liked = False
    else:
        await db.posts.update_one({"_id": post["_id"]}, {"$addToSet": {"like_user_ids": user_id}})
        await db.users.update_one({"_id": user_id}, {"$addToSet": {"liked_post_ids": post["_id"]}})
        liked = True
    refreshed = await db.posts.find_one({"_id": post["_id"]})
    return {"liked": liked, "likes_count": len(refreshed.get("like_user_ids", []))}


@router.post("/{post_id}/bookmark")
async def toggle_bookmark(post_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user_id = current_user["_id"]
    bookmarked_ids = post.get("bookmark_user_ids", [])
    if user_id in bookmarked_ids:
        await db.posts.update_one({"_id": post["_id"]}, {"$pull": {"bookmark_user_ids": user_id}})
        await db.users.update_one({"_id": user_id}, {"$pull": {"bookmarked_post_ids": post["_id"]}})
        bookmarked = False
    else:
        await db.posts.update_one({"_id": post["_id"]}, {"$addToSet": {"bookmark_user_ids": user_id}})
        await db.users.update_one({"_id": user_id}, {"$addToSet": {"bookmarked_post_ids": post["_id"]}})
        bookmarked = True
    refreshed = await db.posts.find_one({"_id": post["_id"]})
    return {"bookmarked": bookmarked, "bookmarks_count": len(refreshed.get("bookmark_user_ids", []))}


@router.get("/{post_id}/related", response_model=list[RelatedPost])
async def related_posts(post_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    cursor = db.posts.find({"_id": {"$ne": post["_id"]}, "status": "published"})
    candidates: list[tuple[int, dict[str, Any]]] = []
    async for candidate in cursor:
        score = pick_related_tags(post.get("tags", []), candidate.get("tags", []))
        if candidate.get("category") and candidate.get("category") == post.get("category"):
            score += 2
        if score:
            candidates.append((score, candidate))
    candidates.sort(key=lambda item: item[0], reverse=True)
    output: list[dict] = []
    for _, candidate in candidates[:4]:
        author = await db.users.find_one({"_id": candidate["author_id"]})
        output.append(
            {
                "id": str(candidate["_id"]),
                "slug": candidate["slug"],
                "title": candidate["title"],
                "excerpt": candidate.get("excerpt"),
                "cover_image": candidate.get("cover_image"),
                "author_name": author["name"] if author else "Unknown",
                "created_at": candidate["created_at"],
                "tags": candidate.get("tags", []),
            }
        )
    return output
