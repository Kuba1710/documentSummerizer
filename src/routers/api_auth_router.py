from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, Response
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
import logging

from db.database import get_db
from schemas.auth import LoginSchema
from auth.service import AuthService
from auth.exceptions import AuthenticationError

# Configure logger
logger = logging.getLogger(__name__)

# Create API router with prefix /api/auth
router = APIRouter(prefix="/api/auth", tags=["api_auth"])
auth_service = AuthService()

@router.post("/login")
async def login_api(
    request: Request,
    login: str = Form(...),
    password: str = Form(...)
):
    """API endpoint for user login
    
    Args:
        login: Username
        password: User password
        
    Returns:
        Redirect to homepage on success
        Sets session cookie if login successful
    """
    try:
        # Attempt login
        login_data = LoginSchema(login=login, password=password)
        result = await auth_service.login(login_data.login, login_data.password)
        
        # Get access token
        token = result["session"]["access_token"]
        logger.info(f"Login successful for user: {login}")
        
        # Create redirect response
        response = RedirectResponse(
            url="/",
            status_code=status.HTTP_302_FOUND
        )
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            max_age=3600,  # 1 hour
            secure=False,  # Set to False for local development
            samesite="lax",
            path="/"
        )
        
        return response
    
    except AuthenticationError as e:
        logger.warning(f"Login failed for user '{login}': {e.message}")
        # Return to login page with error message
        return RedirectResponse(
            url=f"/login?error={e.message}",
            status_code=status.HTTP_302_FOUND
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        # Return to login page with generic error
        return RedirectResponse(
            url="/login?error=An unexpected error occurred",
            status_code=status.HTTP_302_FOUND
        )

@router.post("/logout")
async def logout_api(request: Request):
    """API endpoint for user logout
    
    Returns:
        Redirect to login page with logged_out=true
        Clears session cookie
    """
    response = RedirectResponse(
        url="/login?logged_out=true",
        status_code=status.HTTP_302_FOUND
    )
    
    # Clear session cookie
    response.delete_cookie(
        key="session_token",
        path="/"
    )
    
    return response

@router.post("/register")
async def register_api(
    request: Request,
    login: str = Form(...),
    password: str = Form(...),
    password_confirmation: str = Form(...)
):
    """API endpoint for user registration
    
    Args:
        login: Username
        password: User password
        password_confirmation: Password confirmation
        
    Returns:
        JSON response with success status and redirect URL
    """
    # Implementation will go here
    pass 