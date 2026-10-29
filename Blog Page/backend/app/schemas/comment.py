from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import MongoModel


class CommentCreate(MongoModel):
    content: str
    parent_id: Optional[str] = None


class CommentPublic(MongoModel):
    id: str
    post_id: str
    author_id: str
    author_name: str
    author_username: str
    author_avatar_url: Optional[str] = None
    content: str
    parent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    replies: list["CommentPublic"] = Field(default_factory=list)
    reported: bool = False
    report_reason: Optional[str] = None


CommentPublic.model_rebuild()
