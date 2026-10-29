from datetime import datetime
from typing import Any, Optional

from pydantic import Field

from app.schemas.common import MongoModel


class PostBase(MongoModel):
    title: str = Field(min_length=3, max_length=180)
    content_html: str
    content_json: dict[str, Any] | None = None
    excerpt: str | None = None
    tags: list[str] = Field(default_factory=list)
    category: str | None = None
    cover_image: str | None = None
    status: str = Field(default="draft")


class PostCreate(PostBase):
    ai_summary: str | None = None


class PostUpdate(MongoModel):
    title: str | None = None
    content_html: str | None = None
    content_json: dict[str, Any] | None = None
    excerpt: str | None = None
    tags: list[str] | None = None
    category: str | None = None
    cover_image: str | None = None
    status: str | None = None


class PostPublic(MongoModel):
    id: str
    slug: str
    title: str
    content_html: str
    content_json: dict[str, Any] | None = None
    excerpt: str | None = None
    tags: list[str]
    category: str | None = None
    cover_image: str | None = None
    status: str
    author_id: str
    author_name: str
    author_username: str
    author_avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None
    summary: str | None = None
    reading_time_minutes: int = 1
    likes_count: int = 0
    bookmarks_count: int = 0
    comments_count: int = 0
    views_count: int = 0
    is_liked: bool = False
    is_bookmarked: bool = False


class RelatedPost(MongoModel):
    id: str
    slug: str
    title: str
    excerpt: str | None = None
    cover_image: str | None = None
    author_name: str
    created_at: datetime
    tags: list[str]
