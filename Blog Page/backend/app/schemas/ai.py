from pydantic import Field

from app.schemas.common import MongoModel


class SummaryRequest(MongoModel):
    title: str | None = None
    content_html: str


class WritingAssistRequest(MongoModel):
    content_html: str
    instruction: str = Field(min_length=3, max_length=500)


class TagSuggestionRequest(MongoModel):
    title: str | None = None
    content_html: str
