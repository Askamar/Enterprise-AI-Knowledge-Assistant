import os
from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, PyPDFLoader, Docx2txtLoader

class DocumentProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            add_start_index=True,
        )

    def load_document(self, file_path: str) -> List[Document]:
        """
        Load a document from a file path. Supports PDF, DOCX, TXT, and MD.
        """
        ext = os.path.splitext(file_path)[1].lower()
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            if ext == ".pdf":
                loader = PyPDFLoader(file_path)
                return loader.load()
            elif ext == ".docx":
                loader = Docx2txtLoader(file_path)
                return loader.load()
            elif ext in [".txt", ".md"]:
                loader = TextLoader(file_path, encoding="utf-8")
                return loader.load()
            else:
                # Fallback text load for other text-based files
                try:
                    loader = TextLoader(file_path, encoding="utf-8")
                    return loader.load()
                except Exception:
                    raise ValueError(f"Unsupported file extension: {ext}")
        except Exception as e:
            raise RuntimeError(f"Error loading file {file_path}: {str(e)}")

    def process_document(self, file_path: str, filename: str) -> List[Document]:
        """
        Load a file and split it into chunks.
        Adds metadata like filename and file size to the chunks.
        """
        # Load documents
        docs = self.load_document(file_path)
        
        # Add filename and custom metadata before splitting
        file_size_bytes = os.path.getsize(file_path)
        file_size_kb = round(file_size_bytes / 1024, 2)
        
        for doc in docs:
            doc.metadata["filename"] = filename
            doc.metadata["file_size_kb"] = file_size_kb
            # Ensure path is just a clean string
            if "source" in doc.metadata:
                doc.metadata["source"] = filename

        # Split into chunks
        chunks = self.text_splitter.split_documents(docs)
        
        # Add unique chunk id
        for i, chunk in enumerate(chunks):
            # For cite tracking
            chunk.metadata["chunk_id"] = f"{filename}_chunk_{i}"
            
        return chunks
