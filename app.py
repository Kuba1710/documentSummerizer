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
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 