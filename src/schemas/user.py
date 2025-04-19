from sqlalchemy import Column, String, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .base import Base


class User(Base):
    """SQLAlchemy model for users table"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Dodaj ograniczenie na długość nazwy użytkownika (min. 3 znaki)
    __table_args__ = (
        CheckConstraint("length(username) >= 3", name="username_length_check"),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>" 