from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
import os
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from auth.jwt import get_current_user_optional

# Konfiguracja loggera
logger = logging.getLogger(__name__)

# Konfiguracja szablonów
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

router = APIRouter(tags=["pages"])


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
    # TODO: Fetch document and summary from database
    
    return templates.TemplateResponse(
        "summary_editor.html", 
        {
            "request": request, 
            "title": "Summary - SciSummarize",
            "document_id": document_id,
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