from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


def _default_now() -> datetime:
    return datetime.now()


class User(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = Field(default_factory=_default_now)


class UserInDB(User):
    pass
