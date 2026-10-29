from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import MongoModel


class Token(MongoModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(MongoModel):
    name: str = Field(min_length=2, max_length=80)
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(MongoModel):
    email: EmailStr
    password: str


class PasswordUpdate(MongoModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class AuthResponse(MongoModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
