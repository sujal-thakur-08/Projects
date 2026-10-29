from __future__ import annotations

from bson import ObjectId


def serialize_object_id(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [serialize_object_id(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize_object_id(item) for key, item in value.items()}
    return value


def serialize_document(document: dict | None) -> dict | None:
    if document is None:
        return None
    return serialize_object_id(document)
