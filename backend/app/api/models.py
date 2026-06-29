from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict, Any

class ChatMessageInput(BaseModel):
    query: str = Field(..., description="The user question/query.")
    chat_history: Optional[List[Tuple[str, str]]] = Field(
        None, 
        description="List of tuples representing previous turns: [('user', 'query'), ('assistant', 'response')]"
    )

class ReferenceSource(BaseModel):
    filename: str
    page: Optional[int] = None
    content: str
    chunk_id: str

class ChatMessageOutput(BaseModel):
    answer: str
    references: List[ReferenceSource]

class SettingsModel(BaseModel):
    llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    temperature: float = 0.7
    chunk_size: int = 1000
    chunk_overlap: int = 200

class DocumentMetadata(BaseModel):
    filename: str
    file_size_kb: float
    upload_date: str
    chunk_count: int
