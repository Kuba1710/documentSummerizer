from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class SummaryBase(BaseModel):
    """Base model for summary operations"""
    content: str


class SummaryCreate(SummaryBase):
    """Model for creating a new summary"""
    document_id: UUID


class SummaryInDB(SummaryBase):
    """Model representing a summary in the database"""
    id: UUID
    document_id: UUID
    version: int
    is_current: bool
    created_at: datetime


class SummaryResponse(SummaryInDB):
    """API response model for summary operations"""
    class Config:
        from_attributes = True  # Renamed from orm_mode in Pydantic v2 