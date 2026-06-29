from fastapi import APIRouter, HTTPException
from app.config import settings
from app.api.models import ChatMessageInput, ChatMessageOutput
from app.core.rag_engine import RAGEngine
from app.api.endpoints.settings import get_current_settings

router = APIRouter()

@router.post("/message", response_model=ChatMessageOutput)
def chat_message(payload: ChatMessageInput):
    """
    Send a message to the assistant, retrieving context and generating an answer.
    """
    try:
        # Load active configuration settings dynamically
        curr_settings = get_current_settings()
        
        # Instantiate RAGEngine with current configuration parameters
        rag_engine = RAGEngine(settings)
        
        # Prepare custom settings dict for LLM generation
        custom_settings = {
            "llm_provider": curr_settings.llm_provider,
            "ollama_base_url": curr_settings.ollama_base_url,
            "ollama_model": curr_settings.ollama_model,
            "groq_api_key": curr_settings.groq_api_key,
            "groq_model": curr_settings.groq_model,
            "temperature": curr_settings.temperature
        }
        
        # Query the RAG system
        result = rag_engine.query(
            user_query=payload.query,
            chat_history=payload.chat_history or [],
            custom_settings=custom_settings
        )
        
        return ChatMessageOutput(
            answer=result["answer"],
            references=result["references"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during chat processing: {str(e)}"
        )
