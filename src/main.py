import json
import logging
import time
from contextlib import asynccontextmanager
from typing import Union

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from db.database import init_db
from routers import summary_router, page_router
from routers.auth import router as auth_router
from auth.middleware import auth_middleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os

# Konfiguracja loggera
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the FastAPI application
    
    Handles startup and shutdown events
    """
    # Startup: inicjalizacja bazy danych
    logger.info("Initializing database...")
    await init_db()
    
    # Zwróć kontrolę do aplikacji
    yield
    
    # Shutdown: operacje czyszczenia
    logger.info("Application shutting down...")


# Inicjalizacja aplikacji FastAPI
app = FastAPI(
    title="SciSummarize API",
    description="API for automatic summarization of scientific and academic texts",
    version="1.0.0",
    lifespan=lifespan,
)

# Konfiguracja ścieżek do szablonów i plików statycznych
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# Montowanie plików statycznych
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Dodawanie CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # W produkcji określ dozwolone domeny
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware do logowania żądań
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log request details and timing"""
    start_time = time.time()
    
    # Log the request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    # Process the request
    response = await call_next(request)
    
    # Calculate and log the processing time
    process_time = (time.time() - start_time) * 1000
    logger.info(f"Response: {response.status_code} (took {process_time:.2f}ms)")
    
    return response

# Dodanie middleware autentykacji
app.middleware("http")(auth_middleware)

# Dodawanie routerów
app.include_router(summary_router.router)
app.include_router(auth_router)
app.include_router(page_router.router)

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify the API is running"""
    return {"status": "ok", "message": "API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 