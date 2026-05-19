from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = datetime.now()

class UserInDB(User):
    pass
