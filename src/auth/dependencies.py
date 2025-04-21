from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def require_auth(request: Request):
    """
    Funkcja dependency do ochrony endpointów wymagających autentykacji
    """
    if not request.state.authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieautoryzowany dostęp",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return request.state.user 