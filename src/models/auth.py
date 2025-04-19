from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    """Base model for user operations"""
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    """Model for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    """API response model for user operations"""
    id: UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

class LoginResponse(BaseModel):
    """API response model for successful login"""
    access_token: str
    token_type: str
    user: UserResponse 