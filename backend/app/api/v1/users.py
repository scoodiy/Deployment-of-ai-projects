from fastapi import APIRouter, Depends, HTTPException, status
from ...schemas.user import UserCreate, UserLogin, UserResponse, Token
from ...core.security import get_password_hash, verify_password, create_access_token, get_current_user
from ...api.deps import get_db
from ...utils import generate_id

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: dict = Depends(get_db)):
    for u in db["users"].values():
        if u["username"] == user_in.username:
            raise HTTPException(status_code=400, detail="Username already registered")
    user_id = generate_id()
    user = {
        "id": user_id,
        "username": user_in.username,
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
        "is_active": True,
        "is_admin": False,
    }
    db["users"][user_id] = user
    return UserResponse(**{k: v for k, v in user.items() if k != "hashed_password"})

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: dict = Depends(get_db)):
    user = None
    for u in db["users"].values():
        if u["username"] == credentials.username:
            user = u
            break
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": user["id"], "username": user["username"]})
    return Token(access_token=token)

@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user), db: dict = Depends(get_db)):
    u = db["users"].get(user["user_id"])
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**{k: v for k, v in u.items() if k != "hashed_password"})

@router.put("/me", response_model=UserResponse)
async def update_me(update: dict, user: dict = Depends(get_current_user), db: dict = Depends(get_db)):
    u = db["users"].get(user["user_id"])
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    for key in ["email"]:
        if key in update:
            u[key] = update[key]
    return UserResponse(**{k: v for k, v in u.items() if k != "hashed_password"})
