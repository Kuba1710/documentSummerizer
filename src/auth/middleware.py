from fastapi import Request
from auth.service import AuthService
import logging

# Set up logger
logger = logging.getLogger(__name__)

async def auth_middleware(request: Request, call_next):
    # Pobieranie tokenu sesji z ciasteczka
    session_token = request.cookies.get("session_token")
    
    # Domyślnie użytkownik jest niezalogowany
    request.state.authenticated = False
    request.state.user = None
    
    # Jeśli token istnieje, sprawdzamy jego ważność
    if session_token:
        auth_service = AuthService()
        try:
            user = await auth_service.validate_session(session_token)
            if user:
                request.state.authenticated = True
                request.state.user = user
                logger.debug(f"User authenticated: {user}")
            else:
                logger.debug("Session token validation failed - no user returned")
        except Exception as e:
            # Token jest nieprawidłowy lub wygasł - ignorujemy błąd
            logger.debug(f"Session validation error: {str(e)}")
            pass
    else:
        logger.debug("No session token in cookies")
    
    # Kontynuujemy obsługę żądania
    response = await call_next(request)
    return response 