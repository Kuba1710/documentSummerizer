from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging
from passlib.context import CryptContext
from typing import Any
from pydantic import BaseModel

from models.auth import LoginResponse, UserCreate, UserResponse
from schemas.user import User
from db.database import get_db
from auth.jwt import create_access_token

# Konfiguracja loggera
logger = logging.getLogger(__name__)

# Konfiguracja haszowania haseł
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["authentication"])

# Dodanie modelu do obsługi JSON dla logowania
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Register a new user
    
    Args:
        user_create: User creation data
        db: Database session
        
    Returns:
        Newly created user
        
    Raises:
        HTTPException: 409 if username already exists
    """
    # Sprawdź, czy użytkownik już istnieje
    stmt = select(User).where(User.username == user_create.username)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        logger.warning(f"Username already taken: {user_create.username}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )
    
    # Utwórz nowego użytkownika z zahaszowanym hasłem
    hashed_password = pwd_context.hash(user_create.password)
    
    db_user = User(
        username=user_create.username,
        password_hash=hashed_password
    )
    
    try:
        # Zapisz użytkownika w bazie danych
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        return UserResponse(
            id=db_user.id,
            username=db_user.username,
            created_at=db_user.created_at
        )
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Login and get access token using form data
    
    Args:
        form_data: OAuth2 form with username and password
        db: Database session
        
    Returns:
        Access token and user info
        
    Raises:
        HTTPException: 401 if invalid credentials
    """
    # Znajdź użytkownika po nazwie użytkownika
    stmt = select(User).where(User.username == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Sprawdź, czy użytkownik istnieje i czy hasło jest poprawne
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        logger.warning(f"Invalid login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Utwórz token JWT
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            created_at=user.created_at
        )
    )

# Dodanie alternatywnego endpointu dla logowania przez JSON
@router.post("/login/json", response_model=LoginResponse)
async def login_json(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Login and get access token using JSON
    
    Args:
        login_data: JSON with username and password
        db: Database session
        
    Returns:
        Access token and user info
        
    Raises:
        HTTPException: 401 if invalid credentials
    """
    # Znajdź użytkownika po nazwie użytkownika
    stmt = select(User).where(User.username == login_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Sprawdź, czy użytkownik istnieje i czy hasło jest poprawne
    if not user or not pwd_context.verify(login_data.password, user.password_hash):
        logger.warning(f"Invalid login attempt for user: {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Utwórz token JWT
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            created_at=user.created_at
        )
    )

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    """Logout user (invalidate token)
    
    Note: For a simple implementation, we don't maintain a token blacklist.
    The client should simply discard the token.
    In a production environment, you would add the token to a blacklist.
    
    Returns:
        204 No Content
    """
    # W prostej implementacji wystarczy, że klient usunie token
    # W produkcji dodalibyśmy token do czarnej listy
    return None 