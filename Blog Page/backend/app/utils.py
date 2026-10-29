from __future__ import annotations

import re
from datetime import datetime, timezone
from html import unescape
from typing import Iterable

from bson import ObjectId
from slugify import slugify


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def build_slug(title: str) -> str:
    base = slugify(title) or "post"
    suffix = str(ObjectId())[-6:]
    return f"{base}-{suffix}"


def estimate_reading_time(text: str) -> int:
    words = re.findall(r"\w+", unescape(text or ""))
    return max(1, round(len(words) / 200))


def extract_text_from_html(content: str) -> str:
    text = re.sub(r"<script.*?</script>", " ", content or "", flags=re.S | re.I)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", unescape(text)).strip()


def pick_related_tags(tags: Iterable[str], other_tags: Iterable[str]) -> int:
    return len(set(tag.lower() for tag in tags) & set(tag.lower() for tag in other_tags))
