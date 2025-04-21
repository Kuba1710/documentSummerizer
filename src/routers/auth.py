from fastapi import APIRouter, Request, Response, Depends, HTTPException, status, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import os
from schemas.auth import RegisterSchema, LoginSchema, ResetPasswordSchema, SetNewPasswordSchema
from auth.service import AuthService
from auth.exceptions import AuthenticationError, RegistrationError, ResetPasswordError

router = APIRouter(prefix="/auth", tags=["auth"])
# Fix template directory path to use absolute path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))
auth_service = AuthService()

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if request.state.authenticated:
        return RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("auth/login.html", {"request": request})

@router.post("/login", response_class=HTMLResponse)
async def login(
    request: Request,
    login: str = Form(...),
    password: str = Form(...)
):
    try:
        # Próba logowania
        login_data = LoginSchema(login=login, password=password)
        result = await auth_service.login(login_data.login, login_data.password)
        
        # Przekierowanie z ciasteczkiem sesji
        response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
        response.set_cookie(
            key="session_token",
            value=result["session"]["access_token"],
            httponly=True,
            max_age=3600,  # 1 godzina
            secure=True,
            samesite="lax"
        )
        return response
    
    except AuthenticationError as e:
        return templates.TemplateResponse(
            "auth/login.html",
            {"request": request, "login": login, "error_message": e.message}
        )
    except Exception as e:
        return templates.TemplateResponse(
            "auth/login.html",
            {"request": request, "login": login, "error_message": "Wystąpił nieoczekiwany błąd"}
        )

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    if request.state.authenticated:
        return RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse("auth/register.html", {"request": request})

@router.post("/register", response_class=HTMLResponse)
async def register(
    request: Request,
    login: str = Form(...),
    password: str = Form(...),
    password_confirmation: str = Form(...)
):
    try:
        # Walidacja danych rejestracji
        register_data = RegisterSchema(
            login=login,
            password=password,
            password_confirmation=password_confirmation
        )
        
        # Próba rejestracji
        result = await auth_service.register(register_data.login, register_data.password)
        
        # Przekierowanie na stronę logowania
        response = RedirectResponse(
            url="/auth/login?registered=true",
            status_code=status.HTTP_302_FOUND
        )
        return response
    
    except RegistrationError as e:
        return templates.TemplateResponse(
            "auth/register.html",
            {
                "request": request,
                "login": login,
                "error_message": e.message
            }
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "auth/register.html",
            {
                "request": request,
                "login": login,
                "error_message": str(e)
            }
        )
    except Exception as e:
        return templates.TemplateResponse(
            "auth/register.html",
            {
                "request": request,
                "login": login,
                "error_message": "Wystąpił nieoczekiwany błąd"
            }
        )

@router.get("/logout")
async def logout(request: Request):
    try:
        await auth_service.logout()
        response = RedirectResponse(
            url="/auth/login?logged_out=true",
            status_code=status.HTTP_302_FOUND
        )
        response.delete_cookie("session_token")
        return response
    except Exception:
        return RedirectResponse(
            url="/",
            status_code=status.HTTP_302_FOUND
        )

@router.get("/reset-password", response_class=HTMLResponse)
async def reset_password_page(request: Request):
    return templates.TemplateResponse("auth/reset_password.html", {"request": request})

@router.post("/reset-password", response_class=HTMLResponse)
async def reset_password(
    request: Request,
    login: str = Form(...)
):
    try:
        reset_data = ResetPasswordSchema(login=login)
        await auth_service.reset_password(reset_data.login)
        return templates.TemplateResponse(
            "auth/reset_password_sent.html",
            {"request": request}
        )
    except ResetPasswordError as e:
        return templates.TemplateResponse(
            "auth/reset_password.html",
            {"request": request, "login": login, "error_message": e.message}
        )
    except Exception:
        return templates.TemplateResponse(
            "auth/reset_password.html",
            {"request": request, "login": login, "error_message": "Wystąpił nieoczekiwany błąd"}
        )

@router.get("/set-new-password", response_class=HTMLResponse)
async def set_new_password_page(request: Request, token: str):
    return templates.TemplateResponse(
        "auth/set_new_password.html",
        {"request": request, "token": token}
    )

@router.post("/set-new-password", response_class=HTMLResponse)
async def set_new_password(
    request: Request,
    token: str = Form(...),
    password: str = Form(...),
    password_confirmation: str = Form(...)
):
    try:
        set_password_data = SetNewPasswordSchema(
            token=token,
            password=password,
            password_confirmation=password_confirmation
        )
        await auth_service.set_new_password(set_password_data.token, set_password_data.password)
        return RedirectResponse(
            url="/auth/login?password_reset=true",
            status_code=status.HTTP_302_FOUND
        )
    except ResetPasswordError as e:
        return templates.TemplateResponse(
            "auth/set_new_password.html",
            {
                "request": request,
                "token": token,
                "error_message": e.message
            }
        )
    except ValueError as e:
        return templates.TemplateResponse(
            "auth/set_new_password.html",
            {
                "request": request,
                "token": token,
                "error_message": str(e)
            }
        )
    except Exception:
        return templates.TemplateResponse(
            "auth/set_new_password.html",
            {
                "request": request,
                "token": token,
                "error_message": "Wystąpił nieoczekiwany błąd"
            }
        ) 