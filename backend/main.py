import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.routes import router as api_router
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="EcoAI Guardian API",
    description="Backend API and Client for personal carbon footprint tracking, route analysis, and AI eco-coaching.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")

# Mount Static frontend assets
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, "index.html"))

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
