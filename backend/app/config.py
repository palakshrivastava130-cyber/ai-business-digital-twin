"""
Application configuration using Pydantic Settings.
Loads from environment variables or .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/digital_twin"
    DATABASE_URL_SYNC: str = "postgresql://postgres:password@localhost:5432/digital_twin"
    
    # Google Gemini
    GEMINI_API_KEY: str = ""
    
    # Server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    
    # JWT Authentication Settings
    JWT_SECRET_KEY: str = "supersecretkey_digitaltwin_2026_enterprise_production_node"
    JWT_ALGORITHM: str = "HS256"
    
    # ML Models
    MODEL_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml", "models")
    
    # Data
    DATA_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml", "data")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
