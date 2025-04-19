import os
import time
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from db.database import get_db
from schemas.user import User

# Konfiguracja loggera
logger = logging.getLogger(__name__)

# Pobranie sekretnego klucza z zmiennej środowiskowej lub użycie domyślnej wartości
# UWAGA: W rzeczywistej implementacji zawsze używaj silnego, losowego klucza z zmiennych środowiskowych
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "SciSummarizeSecret123!NotForProduction")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 godzina

# Schemat bezpieczeństwa do uwierzytelniania JWT
security = HTTPBearer()

def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time, defaults to ACCESS_TOKEN_EXPIRE_MINUTES
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    # Ustaw czas wygaśnięcia tokenu
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({
        "exp": expire.timestamp(),
        "iat": datetime.utcnow().timestamp(),
    })
    
    # Zakoduj i podpisz token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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

async def get_current_user(
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