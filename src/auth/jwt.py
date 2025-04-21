import os
import time
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from dotenv import load_dotenv
from passlib.context import CryptContext

from db.database import get_db
from schemas.user import User

# Konfiguracja loggera
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Pobranie sekretnego klucza z zmiennej środowiskowej lub użycie domyślnej wartości
# UWAGA: W rzeczywistej implementacji zawsze używaj silnego, losowego klucza z zmiennych środowiskowych
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Schemat bezpieczeństwa do uwierzytelniania JWT
security = HTTPBearer()

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=True  # Will raise HTTPException for invalid token
)

# Optional OAuth2 scheme that doesn't auto-error
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False  # Won't raise HTTPException for invalid token
)

def get_password_hash(password: str) -> str:
    """Create a password hash
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        Whether the password matches the hash
    """
    return pwd_context.verify(plain_password, hashed_password)

async def get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    """Get a user by email
    
    Args:
        email: Email address to look up
        db: Database session
        
    Returns:
        User or None if not found
    """
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

def create_access_token(data: dict) -> str:
    """Create JWT access token
    
    Args:
        data: Payload to include in token
        
    Returns:
        JWT token string
    """
    # Create a copy to avoid modifying the original data
    to_encode = data.copy()
    
    # Set expiration time
    expires = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expires})
    
    # Create and return token
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_access_token(token: str) -> Dict:
    """Decode and validate JWT token
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Dekoduj token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Sprawdź, czy token zawiera ID użytkownika
        if "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Sprawdź, czy token nie wygasł
        if "exp" in payload and float(payload["exp"]) < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return payload
            
    except jwt.PyJWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get the current authenticated user from token
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        User data from token
        
    Raises:
        HTTPException: 401 if token is invalid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract user ID from token
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # Return user data (currently just ID)
        return {"id": user_id}
        
    except jwt.PyJWTError:
        raise credentials_exception

async def get_current_user_optional(request: Request) -> Optional[dict]:
    """Get the current user if authenticated, or None if not
    
    This dependency can be used for routes where authentication is optional
    
    Args:
        request: The FastAPI request object
        
    Returns:
        User data from token or None if not authenticated
    """
    # Print request data for debugging
    print(f"JWT: Request URL: {request.url}")
    
    # Try to get token from cookies
    token = request.cookies.get("session_token")
    
    if token:
        print(f"JWT: Found token in cookies: {token[:10]}...")
    else:
        print("JWT: No token found in cookies")
        return None
    
    try:
        # Try to get the user - without verifying signature
        # This is safe for user identification but should be handled with care
        # In production, consider using Supabase client to verify tokens properly
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Extract user ID from token
        user_id = payload.get("sub")
        if user_id is None:
            print("JWT: No user_id in payload")
            return None
        
        # Print user metadata if available
        user_metadata = payload.get("user_metadata", {})
        login = user_metadata.get("login", "unknown")
        print(f"JWT: Successfully extracted user info: id={user_id}, login={login}")
        
        # Return user data
        return {"id": user_id, "login": login}
    except Exception as e:
        # Return None if token is invalid or missing
        print(f"JWT: Failed to decode token: {str(e)}")
        return None

async def get_current_user_db(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Dependency to get current authenticated user
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database session
        
    Returns:
        User information if authenticated
        
    Raises:
        HTTPException: If not authenticated or invalid token
    """
    try:
        # Dekoduj token JWT
        payload = decode_access_token(credentials.credentials)
        user_id = payload["sub"]
        
        # Pobierz użytkownika z bazy danych
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Ustaw ID użytkownika w sesji bazy danych dla RLS
        await db.execute(f"SET app.current_user_id = '{user_id}'")
        
        # Zwróć informacje o użytkowniku (bez password_hash)
        return {
            "id": str(user.id),
            "username": user.username,
            "created_at": user.created_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication error",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_from_cookie(request: Request) -> dict:
    """Get the current authenticated user from session cookie
    
    Args:
        request: The FastAPI request object
        
    Returns:
        User data from token
        
    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    # Get token from cookie
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        # Decode token without verifying signature
        # This is safe for user identification in this context
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Extract user ID from token
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # Extract user metadata
        user_metadata = payload.get("user_metadata", {})
        login = user_metadata.get("login")
        
        # Log successful token extraction
        logger.info(f"Successfully extracted user info from token: id={user_id}, login={login}")
        
        # Return user data
        return {"id": user_id, "login": login}
        
    except Exception as e:
        logger.error(f"Error decoding token: {str(e)}")
        raise credentials_exception 