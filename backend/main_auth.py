"""
HighView Auth API
Run locally:  uvicorn main_auth:app --reload --port 8000
Deploy:       set PORT env var; Railway/Render inject it automatically
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router

app = FastAPI(title="HighView Auth API", version="1.0.0")

# Allow the Vercel frontend and localhost dev server.
# Set ALLOWED_ORIGINS env var to a comma-separated list in production.
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


@app.get("/")
def root():
    return {"message": "HighView Auth API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
