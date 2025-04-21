from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Request
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
import logging
import os
import shutil
from pathlib import Path
import json

from models.summary import SummaryResponse
from services.summary_service import SummaryService
from db.database import get_db
from auth.jwt import get_current_user, get_current_user_from_cookie

# Konfiguracja loggera
logger = logging.getLogger(__name__)

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create summaries directory if it doesn't exist
SUMMARIES_DIR = Path("summaries")
SUMMARIES_DIR.mkdir(exist_ok=True)

router = APIRouter(prefix="/api/documents", tags=["summaries"])


@router.post(
    "/upload", 
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document for summarization",
    description="Uploads a document file (PDF) for summarization."
)
async def upload_document(
    file: UploadFile = File(...),
    summaryLength: str = Form("medium"),
    customLength: Optional[int] = Form(None),
    focusAreas: Optional[List[str]] = Form(None),
    includeKeypoints: bool = Form(True),
    includeTables: bool = Form(False),
    includeReferences: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """Upload a document file for processing
    
    Args:
        file: The document file to upload
        summaryLength: Length preference for summary (short, medium, long, custom)
        customLength: Custom word count if summaryLength is custom
        focusAreas: Areas to focus on in the summary
        includeKeypoints: Whether to include key points
        includeTables: Whether to include tables and figures
        includeReferences: Whether to include references
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Created document ID
        
    Raises:
        HTTPException: Various error codes based on specific errors
    """
    try:
        logger.info(f"Uploading document: {file.filename}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF files are accepted"
            )
        
        # Create a unique filename
        document_id = UUID.uuid4()
        file_path = UPLOAD_DIR / f"{document_id}.pdf"
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Log options
        logger.info(f"Summary options: length={summaryLength}, customLength={customLength}, "
                   f"focusAreas={focusAreas}, includeKeypoints={includeKeypoints}, "
                   f"includeTables={includeTables}, includeReferences={includeReferences}")
        
        # Return the document ID
        return {
            "success": True,
            "documentId": str(document_id),
            "message": "Document uploaded successfully"
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while uploading the document"
        )


@router.post(
    "/{document_id}/summaries", 
    status_code=status.HTTP_201_CREATED,
    summary="Generate a summary for a document",
    description="Processes a PDF document and generates a summary using the SciBert AI model. "
                "The summary will contain key elements from the document such as methodology, "
                "results, and conclusions."
)
async def generate_summary(
    document_id: UUID,
    request: Request
) -> Any:
    """Generate a new summary for a document
    
    Args:
        document_id: UUID of the document to summarize
        request: FastAPI request object for cookie extraction
        
    Returns:
        Newly created summary
        
    Raises:
        HTTPException: Various error status codes depending on the specific error
    """
    # Authenticate user from cookie before proceeding
    current_user = await get_current_user_from_cookie(request)
    
    try:
        # Use None for db_session to bypass database authentication
        # This is a temporary solution since we're using file storage
        summary_service = SummaryService(None)
        
        # Generate summary without database connection
        summary = await summary_service.create_summary(document_id)
        return summary
        
    except HTTPException as ex:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error generating summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the summary"
        )


@router.get(
    "/{document_id}/summaries", 
    status_code=status.HTTP_200_OK,
    summary="Get the summary for a document",
    description="Retrieves the generated summary for a document."
)
async def get_summary(
    document_id: UUID,
    request: Request
) -> Any:
    """Get the summary for a document
    
    Args:
        document_id: UUID of the document
        request: FastAPI request object for cookie extraction
        
    Returns:
        Summary for the document
        
    Raises:
        HTTPException: Various error status codes depending on the specific error
    """
    # Authenticate user from cookie before proceeding
    current_user = await get_current_user_from_cookie(request)
    
    try:
        # Check if summary exists in file
        summary_file = Path("summaries") / f"{document_id}.json"
        logger.info(f"Looking for summary file: {summary_file}")
        
        if not summary_file.exists():
            logger.warning(f"Summary file not found: {summary_file}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Summary not found"
            )
            
        # Read summary from file
        with open(summary_file, "r") as f:
            summary = json.load(f)
            logger.info(f"Summary loaded successfully for document: {document_id}")
            
        return summary
        
    except HTTPException:
        raise
        
    except Exception as e:
        logger.error(f"Error retrieving summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving the summary"
        ) 