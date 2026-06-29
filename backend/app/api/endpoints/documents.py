import os
import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings
from app.api.models import DocumentMetadata
from app.core.document_processor import DocumentProcessor
from app.core.rag_engine import RAGEngine
from app.api.endpoints.settings import get_current_settings

router = APIRouter()

METADATA_FILE = os.path.join(settings.UPLOAD_DIR, "documents_metadata.json")

def load_metadata() -> List[dict]:
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_metadata(metadata: List[dict]):
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)

@router.get("", response_model=List[DocumentMetadata])
def list_documents():
    """
    List all uploaded documents and their details.
    """
    try:
        return load_metadata()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@router.post("/upload", response_model=DocumentMetadata)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document, chunk it, create embeddings, and store in ChromaDB.
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".pdf", ".docx", ".txt", ".md"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type '{ext}'. Only PDF, DOCX, TXT, and MD files are supported."
        )
    
    # Check if file with same name already exists in metadata
    meta_list = load_metadata()
    if any(m["filename"] == filename for m in meta_list):
        raise HTTPException(
            status_code=400,
            detail=f"Document with name '{filename}' already exists. Please delete it first or rename the file."
        )

    # Save physical file to disk
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    try:
        # Load current chunk configurations from settings
        curr_settings = get_current_settings()
        
        # Initialize processors
        doc_processor = DocumentProcessor(
            chunk_size=curr_settings.chunk_size,
            chunk_overlap=curr_settings.chunk_overlap
        )
        rag_engine = RAGEngine(settings)
        
        # Process document
        chunks = doc_processor.process_document(file_path, filename)
        chunk_count = len(chunks)
        
        # Add to ChromaDB
        if chunk_count > 0:
            rag_engine.add_documents(chunks)
            
        # Update metadata
        file_size_kb = round(os.path.getsize(file_path) / 1024, 2)
        new_meta = {
            "filename": filename,
            "file_size_kb": file_size_kb,
            "upload_date": datetime.now().isoformat(),
            "chunk_count": chunk_count
        }
        meta_list.append(new_meta)
        save_metadata(meta_list)
        
        return new_meta
    except Exception as e:
        # Cleanup file on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.delete("/{filename}", response_model=dict)
def delete_document(filename: str):
    """
    Delete a document, clean up its embeddings in ChromaDB, and remove the file from storage.
    """
    meta_list = load_metadata()
    doc_index = next((i for i, m in enumerate(meta_list) if m["filename"] == filename), None)
    
    if doc_index is None:
        raise HTTPException(status_code=404, detail=f"Document '{filename}' not found.")
        
    # Delete from ChromaDB
    try:
        rag_engine = RAGEngine(settings)
        rag_engine.delete_document(filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove document embeddings from vector database: {str(e)}")
        
    # Remove physical file
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            # Non-blocking error, log it or note it
            pass
            
    # Update metadata
    meta_list.pop(doc_index)
    save_metadata(meta_list)
    
    return {"message": f"Successfully deleted document '{filename}'"}
