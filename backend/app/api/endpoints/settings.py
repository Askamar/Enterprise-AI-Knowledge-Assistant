import os
import json
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.api.models import SettingsModel

router = APIRouter()

SETTINGS_FILE = os.path.join(settings.UPLOAD_DIR, "app_settings.json")

def get_current_settings() -> SettingsModel:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Fallback to default if keys are missing
                return SettingsModel(**data)
        except Exception:
            pass
    # Default settings from environment variables/config
    return SettingsModel(
        llm_provider=settings.LLM_PROVIDER,
        ollama_base_url=settings.OLLAMA_BASE_URL,
        ollama_model=settings.OLLAMA_MODEL,
        groq_api_key=settings.GROQ_API_KEY,
        groq_model=settings.GROQ_MODEL,
        temperature=settings.TEMPERATURE,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )

def save_settings(new_settings: SettingsModel):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(new_settings.model_dump(), f, indent=4)

@router.get("", response_model=SettingsModel)
def get_settings():
    """
    Get current configuration settings for RAG and LLM models.
    """
    try:
        return get_current_settings()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load settings: {str(e)}")

@router.put("", response_model=SettingsModel)
def update_settings(payload: SettingsModel):
    """
    Update configuration settings.
    """
    try:
        save_settings(payload)
        # Update settings object values in memory as well
        settings.LLM_PROVIDER = payload.llm_provider
        settings.OLLAMA_BASE_URL = payload.ollama_base_url
        settings.OLLAMA_MODEL = payload.ollama_model
        settings.GROQ_API_KEY = payload.groq_api_key
        settings.GROQ_MODEL = payload.groq_model
        settings.TEMPERATURE = payload.temperature
        settings.CHUNK_SIZE = payload.chunk_size
        settings.CHUNK_OVERLAP = payload.chunk_overlap
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")
