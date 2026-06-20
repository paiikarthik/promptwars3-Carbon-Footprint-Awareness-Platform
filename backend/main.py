import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from api.routes import router as api_router
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_cors_origins() -> list[str]:
    origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]

app = FastAPI(
    title="EcoAI Guardian API",
    description="Backend API and Client for personal carbon footprint tracking, route analysis, and AI eco-coaching.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self)"
    return response

# Mount API routes
app.include_router(api_router, prefix="/api")

# Mount Static frontend assets
static_dir = Path(__file__).resolve().parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/")
async def root():
    return FileResponse(static_dir / "index.html")

@app.get("/api/health")
async def health():
    # Detect mode status
    has_gemini = "YES" if os.getenv("GEMINI_API_KEY") else "NO (Running LLM Simulator)"
    has_firebase = "YES" if os.getenv("FIREBASE_CREDENTIALS") else "NO (Running Local JSON DB)"
    has_maps = "YES" if os.getenv("GOOGLE_MAPS_API_KEY") else "NO (Running Mock Geolocation)"
    
    return {
        "status": "online",
        "app_name": "EcoAI Guardian API",
        "mode_configurations": {
            "google_gemini": has_gemini,
            "firebase_firestore": has_firebase,
            "google_maps": has_maps
        },
        "message": "Welcome to EcoAI Guardian!"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
