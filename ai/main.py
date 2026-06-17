import logging
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.ai import router as ai_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ai-service")

app = FastAPI(
    title="TechPrep AI Service",
    description="Python FastAPI Microservice powering AI interview question generation, parsing, and grading",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it runs internally behind Fastify, allow all or fastify specifically
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai_router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "TechPrep AI Service is running"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Run server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
