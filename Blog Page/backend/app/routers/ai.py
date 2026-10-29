from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.schemas.ai import SummaryRequest, TagSuggestionRequest, WritingAssistRequest
from app.services.ai import continue_writing, summarize_content, suggest_tags_and_category

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/summarize")
async def summarize(payload: SummaryRequest, current_user: dict = Depends(get_current_user)):
    return {"summary": await summarize_content(payload.content_html, payload.title)}


@router.post("/assist")
async def assist(payload: WritingAssistRequest, current_user: dict = Depends(get_current_user)):
    return {"suggestion": await continue_writing(payload.content_html, payload.instruction)}


@router.post("/tags")
async def tag_suggestions(payload: TagSuggestionRequest, current_user: dict = Depends(get_current_user)):
    return await suggest_tags_and_category(payload.content_html, payload.title)
