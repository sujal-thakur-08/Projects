from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from mongomock_motor import AsyncMongoMockClient

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None
_using_mock = False


def get_client() -> AsyncIOMotorClient:
    global _client, _using_mock
    if _client is None:
        if _using_mock or get_settings().mongodb_uri.startswith("mock://"):
            _client = AsyncMongoMockClient()
            _using_mock = True
        else:
            _client = AsyncIOMotorClient(get_settings().mongodb_uri, serverSelectionTimeoutMS=2000)
    return _client


def use_mock_client() -> AsyncMongoMockClient:
    global _client, _using_mock
    _using_mock = True
    _client = AsyncMongoMockClient()
    return _client


def get_database() -> AsyncIOMotorDatabase:
    settings = get_settings()
    return get_client()[settings.mongodb_db]


def close_client() -> None:
    global _client, _using_mock
    if _client is not None:
        _client.close()
        _client = None
        _using_mock = False
