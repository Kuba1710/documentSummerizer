from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta
from .base import Base


class Document(Base):
    """SQLAlchemy model for documents table"""
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size_kb = Column(Integer, nullable=False)
    upload_timestamp = Column(DateTime, default=func.now(), nullable=False)
    expiration_timestamp = Column(DateTime, default=lambda: datetime.now() + timedelta(hours=24), nullable=False)
    
    def __repr__(self):
        return f"<Document(id={self.id}, title='{self.title}', user_id={self.user_id})>"
        
    @property
    def time_remaining(self):
        """Calculate and return the time remaining until the document expires
        
        Returns:
            String representation of time remaining (e.g., "12 hours, 30 minutes")
        """
        if datetime.now() > self.expiration_timestamp:
            return "Expired"
            
        time_delta = self.expiration_timestamp - datetime.now()
        total_seconds = time_delta.total_seconds()
        
        # Oblicz godziny, minuty i sekundy
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        
        if hours > 0:
            return f"{hours} {'hours' if hours > 1 else 'hour'}, {minutes} {'minutes' if minutes > 1 else 'minute'}"
        else:
            return f"{minutes} {'minutes' if minutes > 1 else 'minute'}" 