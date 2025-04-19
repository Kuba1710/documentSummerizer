from sqlalchemy import Column, Text, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .base import Base


class Summary(Base):
    """SQLAlchemy model for summaries table"""
    __tablename__ = "summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    is_current = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Summary(id={self.id}, document_id={self.document_id}, version={self.version}, is_current={self.is_current})>" 