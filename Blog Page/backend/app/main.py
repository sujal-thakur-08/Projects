from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.database import close_client, get_database, use_mock_client
from app.routers import admin, ai, auth, comments, posts, uploads, users

settings = get_settings()
app = FastAPI(title=settings.project_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path(settings.upload_dir)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount(f"/{settings.upload_dir}", StaticFiles(directory=upload_dir), name="uploads")

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)
app.include_router(posts.router, prefix=settings.api_v1_prefix)
app.include_router(comments.router, prefix=settings.api_v1_prefix)
app.include_router(ai.router, prefix=settings.api_v1_prefix)
app.include_router(admin.router, prefix=settings.api_v1_prefix)
app.include_router(uploads.router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
async def startup_event() -> None:
    db = get_database()
    try:
        await db.command("ping")
    except Exception:
        use_mock_client()
        db = get_database()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.posts.create_index("slug", unique=True)
    await db.posts.create_index([("status", 1), ("created_at", -1)])
    await db.posts.create_index([("tags", 1)])
    await db.comments.create_index([("post_id", 1), ("created_at", 1)])
    await db.comments.create_index([("reported", 1), ("updated_at", -1)])


@app.on_event("shutdown")
async def shutdown_event() -> None:
    close_client()


@app.get("/")
async def healthcheck():
    return {"status": "ok", "service": settings.project_name}


@app.get("/api/v1/health")
async def api_healthcheck():
    return {"status": "healthy"}
