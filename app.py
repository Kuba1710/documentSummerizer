from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import os

# Create the FastAPI application
app = FastAPI(title="Document Summarizer")

# Setup templates directory
templates = Jinja2Templates(directory="templates")

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Render the home page."""
    return templates.TemplateResponse("base.html", {"request": request, "title": "Document Summarizer"})

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    # Use environment variables or safer defaults for host binding
    # In production, this should be configured through environment variables
    host = os.getenv("APP_HOST", "127.0.0.1")  # Bind to localhost by default
    port = int(os.getenv("APP_PORT", "8000"))
    reload_enabled = os.getenv("DEV_RELOAD", "true").lower() == "true"
    
    uvicorn.run("app:app", host=host, port=port, reload=reload_enabled) 