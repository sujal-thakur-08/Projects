from datetime import datetime
from typing import Optional

from app.schemas.common import MongoModel


class UserPublic(MongoModel):
    id: str
    name: str
    username: str
    email: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "author"
    created_at: datetime
    updated_at: datetime
    follower_count: int = 0
    post_count: int = 0


class UserUpdate(MongoModel):
    name: str | None = None
    username: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
