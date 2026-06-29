import os
from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Enterprise AI Knowledge Assistant"
    API_V1_STR: str = "/api"
    
    # Storage settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", str(BASE_DIR / "chroma_db"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
    
    # RAG Settings
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", 1000))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", 200))
    
    # Embedding Model Settings
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    
    # LLM Settings
    LLM_PROVIDER: Literal["ollama", "groq"] = os.getenv("LLM_PROVIDER", "ollama")
    
    # Ollama Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Groq Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    
    # Model Generation Settings
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", 0.7))
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Ensure direct physical existence of dirs
settings = Settings()
os.makedirs(settings.CHROMA_DB_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
