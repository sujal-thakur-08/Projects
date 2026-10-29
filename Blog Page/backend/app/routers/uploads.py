from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse

from app.core.config import get_settings

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    settings = get_settings()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "upload").suffix.lower()
    safe_name = f"{uuid4().hex}{suffix}"
    file_path = upload_dir / safe_name
    with file_path.open("wb") as handle:
        handle.write(await file.read())
    return {"url": f"{settings.public_base_url.rstrip('/')}/{settings.upload_dir}/{safe_name}", "filename": safe_name}


@router.get("/{filename}")
async def serve_file(filename: str):
    settings = get_settings()
    file_path = Path(settings.upload_dir) / filename
    return FileResponse(file_path)
