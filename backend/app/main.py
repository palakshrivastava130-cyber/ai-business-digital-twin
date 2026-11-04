"""
AI Business Digital Twin - FastAPI Application
Main entry point for the backend API server.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db, close_db
from app.services.ml_service import ml_service
from app.services.llm_service import llm_service
from app.routers import data, simulation, advisor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    settings = get_settings()
    
    print("=" * 60)
    print("  AI Business Digital Twin - Starting Up")
    print("=" * 60)
    
    # Initialize database
    print("\n[1/3] Initializing database...")
    try:
        await init_db()
        print("  Database tables created/verified.")
        
        # Auto-seed if empty
        import app.database as db_mod
        from app.services.seed_data import seed_database
        async with db_mod.async_session() as session:
            await seed_database(session)
    except Exception as e:
        print(f"  WARNING: Database init failed: {e}")
        print("  The API will start but DB-dependent endpoints may fail.")
    
    # Load ML models
    print("\n[2/3] Loading ML models...")
    try:
        ml_service.load_models()
    except Exception as e:
        print(f"  WARNING: ML model loading failed: {e}")
        print("  Simulation endpoints may return default predictions.")
    
    # Initialize LLM
    print("\n[3/3] Initializing LLM service...")
    llm_service.initialize()
    
    print("\n" + "=" * 60)
    print(f"  Server ready at http://{settings.BACKEND_HOST}:{settings.BACKEND_PORT}")
    print(f"  API docs at http://localhost:{settings.BACKEND_PORT}/docs")
    print(f"  Frontend CORS: {settings.FRONTEND_URL}")
    print("=" * 60 + "\n")
    
    yield
    
    # Shutdown
    print("\nShutting down...")
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="AI Business Digital Twin",
    description="AI-driven Digital Twin platform for business simulation and predictive analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(data.router)
app.include_router(simulation.router)
app.include_router(advisor.router)


@app.get("/", tags=["Health"])
async def root():
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "service": "AI Business Digital Twin API",
        "version": "1.0.0",
    }


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Detailed health check with component status."""
    return {
        "status": "healthy",
        "components": {
            "ml_models": ml_service._loaded,
            "llm_service": llm_service._initialized,
        },
    }
