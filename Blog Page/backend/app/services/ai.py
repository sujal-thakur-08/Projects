from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.core.config import get_settings
from app.utils import extract_text_from_html


async def _anthropic_call(system_prompt: str, user_prompt: str) -> str | None:
    settings = get_settings()
    if not settings.anthropic_api_key:
        return None
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 500,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("content", [])
        if content:
            return "".join(part.get("text", "") for part in content if part.get("type") == "text").strip()
    return None


async def _openai_call(system_prompt: str, user_prompt: str) -> str | None:
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "content-type": "application/json",
            },
            json={
                "model": settings.openai_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.4,
                "max_tokens": 500,
            },
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices", [])
        if choices:
            return choices[0]["message"]["content"].strip()
    return None


async def generate_ai_text(system_prompt: str, user_prompt: str, fallback: str) -> str:
    for caller in (_anthropic_call, _openai_call):
        try:
            result = await caller(system_prompt, user_prompt)
            if result:
                return result
        except Exception:
            continue
    return fallback


async def summarize_content(content_html: str, title: str | None = None) -> str:
    content = extract_text_from_html(content_html)
    fallback = content[:240].rstrip()
    if len(content) > 240:
        fallback += "..."
    prompt = f"Title: {title or 'Untitled'}\n\nContent:\n{content}\n\nWrite a concise 2-3 sentence summary."
    return await generate_ai_text("You write clean article summaries.", prompt, fallback or "A concise summary is unavailable.")


async def suggest_tags_and_category(content_html: str, title: str | None = None) -> dict[str, Any]:
    content = extract_text_from_html(content_html)
    fallback_tags = []
    for token in re.findall(r"[A-Za-z][A-Za-z0-9-]{2,}", f"{title or ''} {content}")[:8]:
        normalized = token.lower()
        if normalized not in fallback_tags:
            fallback_tags.append(normalized)
    fallback = {"tags": fallback_tags[:5], "category": "General" if not fallback_tags else fallback_tags[0].title()}
    prompt = (
        f"Title: {title or 'Untitled'}\n\nContent:\n{content}\n\n"
        "Return valid JSON with keys tags and category. tags must be a short array of 3-6 strings. category must be a single string."
    )
    text = await generate_ai_text("You classify blog posts with tags and categories.", prompt, json.dumps(fallback))
    try:
        parsed = json.loads(text)
        return {"tags": parsed.get("tags", fallback["tags"]), "category": parsed.get("category", fallback["category"])}
    except Exception:
        return fallback


async def continue_writing(content_html: str, instruction: str) -> str:
    content = extract_text_from_html(content_html)
    fallback = f"Continue by expanding the current idea around: {instruction}."
    prompt = f"Draft so far:\n{content}\n\nWriter instruction:\n{instruction}\n\nContinue the draft with practical, clear prose."
    return await generate_ai_text("You are an expert blog writing assistant.", prompt, fallback)
