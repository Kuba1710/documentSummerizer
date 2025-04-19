from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from uuid import UUID
import logging

from models.summary import SummaryResponse
from services.summary_service import SummaryService
from db.database import get_db
from auth.jwt import get_current_user

# Konfiguracja loggera
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/documents", tags=["summaries"])


@router.post(
    "/{document_id}/summaries", 
    response_model=SummaryResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Generate a summary for a document",
    description="Processes a PDF document and generates a summary using the SciBert AI model. "
                "The summary will contain key elements from the document such as methodology, "
                "results, and conclusions."
)
async def generate_summary(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """Generate a new summary for a document
    
    Args:
        document_id: UUID of the document to summarize
        db: Database session dependency
        current_user: Current authenticated user dependency
        
    Returns:
        Newly created summary
        
    Raises:
        HTTPException: Various error status codes depending on the specific error
    """
    # Tworzenie instancji serwisu
    summary_service = SummaryService(db)
    
    try:
        # Generowanie podsumowania - SummaryService zajmuje się całym
        # procesem, w tym walidacją, wyodrębnianiem tekstu i przetwarzaniem AI
        summary = await summary_service.create_summary(document_id)
        return summary
        
    except HTTPException as ex:
        # Przekazujemy dalej HTTPException rzucone przez serwis
        # (404, 403, 422, itd.)
        raise
        
    except Exception as e:
        # Logowanie nieoczekiwanych błędów
        logger.error(f"Unexpected error generating summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the summary"
        ) 