from fastapi import Request
from auth.service import AuthService
import logging

# Set up logger
logger = logging.getLogger(__name__)

async def auth_middleware(request: Request, call_next):
    # Check for test mode header - allow bypassing auth for E2E tests
    is_test_mode = request.headers.get("X-Test-Mode") == "true"
    
    if is_test_mode:
        print(f"TEST MODE DETECTED - Authentication check bypassed for path: {request.url.path}")
        request.state.authenticated = True
        request.state.user = {"id": "test-user-id", "login": "test-user"}
        response = await call_next(request)
        return response
    
    # Pobieranie tokenu sesji z ciasteczka
    session_token = request.cookies.get("session_token")
    
    # Print all cookies for debugging
    print(f"Request path: {request.url.path}")
    print(f"All cookies: {request.cookies}")
    
    # Domyślnie użytkownik jest niezalogowany
    request.state.authenticated = False
    request.state.user = None
    
    # Jeśli token istnieje, sprawdzamy jego ważność
    if session_token:
        print(f"Found session token: {session_token[:10]}... (truncated)")
        auth_service = AuthService()
        try:
            user = await auth_service.validate_session(session_token)
            if user:
                request.state.authenticated = True
                request.state.user = user
                print(f"User authenticated: {user}")
            else:
                print("Session token validation failed - no user returned")
        except Exception as e:
            # Token jest nieprawidłowy lub wygasł - ignorujemy błąd
            print(f"Session validation error: {str(e)}")
            pass
    else:
        print("No session token in cookies")
    
    # Kontynuujemy obsługę żądania
    response = await call_next(request)
    return response 