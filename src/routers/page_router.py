from fastapi import APIRouter, Request, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
import os
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from auth.jwt import get_current_user, get_current_user_optional
import shutil
import uuid
from pathlib import Path
from typing import List, Optional, Any

# Konfiguracja loggera
logger = logging.getLogger(__name__)

# Konfiguracja szablonów
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

router = APIRouter(tags=["pages"])

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("/", include_in_schema=False)
async def home_page(
    request: Request,
    current_user: dict = Depends(get_current_user_optional)
):
    """Render the homepage"""
    return templates.TemplateResponse(
        "base.html", 
        {
            "request": request, 
            "title": "SciSummarize - Document Summarization Platform",
            "user": current_user
        }
    )


@router.get("/login", include_in_schema=False)
async def login_page(request: Request):
    """Render login page"""
    return templates.TemplateResponse(
        "auth/login.html", 
        {
            "request": request, 
            "title": "Login - SciSummarize"
        }
    )


@router.get("/register", include_in_schema=False)
async def register_page(request: Request):
    """Render registration page"""
    return templates.TemplateResponse(
        "auth/register.html", 
        {
            "request": request, 
            "title": "Register - SciSummarize"
        }
    )


@router.get("/documents/upload", include_in_schema=False)
async def upload_document_page(
    request: Request,
    current_user: dict = Depends(get_current_user_optional)
):
    """Render document upload page"""
    # Enhanced debug print
    print(f"Upload page requested. Authentication state:")
    print(f"- URL: {request.url}")
    print(f"- current_user from dependency: {current_user}")
    print(f"- request.state.authenticated: {request.state.authenticated}")
    print(f"- request.state.user: {request.state.user}")
    print(f"- cookies: {list(request.cookies.keys())}")
    
    # Logic for allowing access - check both current_user and authenticated state
    authenticated = current_user is not None or request.state.authenticated
    
    if authenticated:
        # Print the authentication source
        if current_user:
            print(f"User authenticated via dependency: {current_user}")
        if request.state.authenticated:
            print(f"User authenticated via middleware: {request.state.user}")
            
        # Get user info from either source
        user_data = current_user if current_user else request.state.user
        
        # Log the user data that will be used
        print(f"Rendering upload page for user: {user_data}")
        
        return templates.TemplateResponse(
            "upload.html", 
            {
                "request": request, 
                "title": "Upload Document - SciSummarize",
                "user": user_data
            }
        )
    else:
        print("No authentication found - redirecting to login")
        return templates.TemplateResponse(
            "auth/login.html", 
            {
                "request": request, 
                "title": "Login - SciSummarize",
                "message": "Please login to upload documents"
            }
        )


@router.get("/documents/{document_id}", include_in_schema=False)
async def view_document_page(
    document_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """Render document view page"""
    # TODO: Fetch document from database
    
    return templates.TemplateResponse(
        "document_view.html", 
        {
            "request": request, 
            "title": "Document - SciSummarize",
            "document_id": document_id,
            "user": current_user
        }
    )


@router.get("/documents/{document_id}/summary", include_in_schema=False)
async def view_summary_page(
    document_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """Render summary view page"""
    try:
        # Check authentication
        if not current_user and not request.state.authenticated:
            return templates.TemplateResponse(
                "auth/login.html", 
                {
                    "request": request, 
                    "title": "Login - SciSummarize",
                    "message": "Please login to view summaries"
                }
            )
        
        # Use either current_user from dependency or from request state
        user_data = current_user if current_user else request.state.user
        
        # Try to fetch the summary using the API
        import httpx
        
        # Use relative URL and base_url to make the request
        url = f"/api/documents/{document_id}/summaries"
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        
        cookies = {}
        if "session_token" in request.cookies:
            cookies["session_token"] = request.cookies["session_token"]
        
        async with httpx.AsyncClient(base_url=base_url, cookies=cookies) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                summary = response.json()
                logger.info(f"Summary fetched successfully for document: {document_id}")
                
                # Parse file path to get document name for display purposes
                file_path = Path("uploads") / f"{document_id}.pdf"
                document_name = "Unknown document"
                
                if file_path.exists():
                    try:
                        import fitz  # PyMuPDF
                        doc = fitz.open(file_path)
                        document_name = file_path.name
                        
                        # Try to get title from PDF metadata
                        if doc.metadata and doc.metadata.get("title"):
                            document_name = doc.metadata.get("title")
                        
                        doc.close()
                    except Exception as e:
                        logger.error(f"Error getting document metadata: {str(e)}")
                
                return templates.TemplateResponse(
                    "summary.html", 
                    {
                        "request": request, 
                        "title": f"Summary - {document_name}",
                        "document_id": document_id,
                        "document_name": document_name,
                        "summary": summary,
                        "user": user_data
                    }
                )
            elif response.status_code == 404:
                # Summary not found, show error message
                return templates.TemplateResponse(
                    "error.html", 
                    {
                        "request": request, 
                        "title": "Summary Not Found - SciSummarize",
                        "error_title": "Summary Not Found",
                        "error_message": "The requested summary was not found. It may have been deleted or hasn't been generated yet.",
                        "user": user_data
                    }
                )
            else:
                # Other error, show error message
                return templates.TemplateResponse(
                    "error.html", 
                    {
                        "request": request, 
                        "title": "Error - SciSummarize",
                        "error_title": "Error Fetching Summary",
                        "error_message": f"An error occurred while fetching the summary. Error code: {response.status_code}",
                        "user": user_data
                    }
                )
                
    except Exception as e:
        logger.error(f"Error in view_summary_page: {str(e)}")
        return templates.TemplateResponse(
            "error.html", 
            {
                "request": request, 
                "title": "Error - SciSummarize",
                "error_title": "Error",
                "error_message": "An unexpected error occurred while fetching the summary.",
                "user": current_user
            }
        )


@router.get("/settings", include_in_schema=False)
async def settings_page(
    request: Request,
    current_user: dict = Depends(get_current_user_optional)
):
    """Render settings page"""
    # Check both dependency and request state
    if not current_user and not request.state.authenticated:
        return templates.TemplateResponse(
            "auth/login.html", 
            {
                "request": request, 
                "title": "Login - SciSummarize",
                "message": "Please login to access settings"
            }
        )
    
    # Use either current_user from dependency or from request state
    user_data = current_user if current_user else request.state.user
    
    return templates.TemplateResponse(
        "settings.html", 
        {
            "request": request, 
            "title": "Settings - SciSummarize",
            "user": user_data
        }
    )


@router.get("/search", include_in_schema=False)
async def search_page(
    request: Request,
    q: str = "",
    current_user: dict = Depends(get_current_user_optional)
):
    """Render search page"""
    return templates.TemplateResponse(
        "home.html", 
        {
            "request": request, 
            "title": "Search - SciSummarize",
            "query": q,
            "user": current_user
        }
    )


@router.post("/upload-document", include_in_schema=False)
async def proxy_upload_document(
    request: Request,
    file: UploadFile = File(...),
    summaryLength: str = Form("medium"),
    customLength: Optional[int] = Form(None),
    focusAreas: Optional[List[str]] = Form(None),
    includeKeypoints: bool = Form(True),
    includeTables: bool = Form(False),
    includeReferences: bool = Form(False),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Proxy endpoint for document upload that uses middleware authentication"""
    # Check if user is authenticated using the middleware's authentication
    if not request.state.authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    
    try:
        logger.info(f"Upload proxy - document: {file.filename}")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF files are accepted"
            )
        
        # Create a unique filename
        document_id = uuid.uuid4()
        file_path = UPLOAD_DIR / f"{document_id}.pdf"
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Log options
        logger.info(f"Upload proxy - options: length={summaryLength}, customLength={customLength}, "
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
        logger.error(f"Upload proxy - error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while uploading the document"
        ) 