import os
from typing import List, Dict, Any, Tuple
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import Settings

class RAGEngine:
    def __init__(self, settings: Settings):
        self.settings = settings
        
        # Initialize embeddings model
        # Using HuggingFace embeddings which run locally
        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.settings.EMBEDDING_MODEL_NAME,
            cache_folder=os.path.join(self.settings.BASE_DIR, "models_cache")
        )
        
        # Initialize ChromaDB vector store
        self.vector_store = Chroma(
            persist_directory=self.settings.CHROMA_DB_DIR,
            embedding_function=self.embeddings,
            collection_name="enterprise_knowledge"
        )

    def add_documents(self, chunks: List[Document]):
        """
        Add document chunks to ChromaDB.
        """
        if not chunks:
            return
        self.vector_store.add_documents(chunks)

    def delete_document(self, filename: str):
        """
        Delete all chunks associated with a specific filename.
        """
        # ChromaDB delete using metadatas filter
        # Get all documents to find IDs matching filename, or use delete with where clause
        self.vector_store.delete(where={"filename": filename})

    def get_llm(self, custom_settings: Dict[str, Any] = None):
        """
        Initialize the LLM based on current settings or custom runtime settings.
        """
        provider = self.settings.LLM_PROVIDER
        temp = self.settings.TEMPERATURE
        
        if custom_settings:
            provider = custom_settings.get("llm_provider", provider)
            temp = float(custom_settings.get("temperature", temp))

        if provider == "groq":
            api_key = os.getenv("GROQ_API_KEY", self.settings.GROQ_API_KEY)
            model_name = self.settings.GROQ_MODEL
            if custom_settings:
                api_key = custom_settings.get("groq_api_key", api_key)
                model_name = custom_settings.get("groq_model", model_name)
            
            try:
                from langchain_groq import ChatGroq
                return ChatGroq(
                    groq_api_key=api_key,
                    model_name=model_name,
                    temperature=temp
                )
            except Exception:
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(
                    openai_api_key=api_key,
                    openai_api_base="https://api.groq.com/openai/v1",
                    model_name=model_name,
                    temperature=temp
                )
        else:
            # Default is Ollama
            base_url = self.settings.OLLAMA_BASE_URL
            model_name = self.settings.OLLAMA_MODEL
            if custom_settings:
                base_url = custom_settings.get("ollama_base_url", base_url)
                model_name = custom_settings.get("ollama_model", model_name)
                
            return ChatOllama(
                base_url=base_url,
                model=model_name,
                temperature=temp
            )

    def query(
        self, 
        user_query: str, 
        chat_history: List[Tuple[str, str]] = None,
        custom_settings: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Query the RAG engine:
        1. Retrieve relevant chunks from ChromaDB
        2. Construct system prompt with context
        3. Query LLM (Llama 3)
        4. Return response and references
        """
        # 1. Retrieve context
        # Retrieve top 4 most similar chunks
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 4})
        retrieved_docs = retriever.invoke(user_query)
        
        # Format context
        context_parts = []
        references = []
        
        for doc in retrieved_docs:
            source = doc.metadata.get("filename", "Unknown Source")
            page = doc.metadata.get("page", None)
            page_str = f" (Page {page + 1})" if page is not None else ""
            
            context_parts.append(f"Source: {source}{page_str}\nContent: {doc.page_content}\n---")
            
            references.append({
                "filename": source,
                "page": page + 1 if page is not None else None,
                "content": doc.page_content,
                "chunk_id": doc.metadata.get("chunk_id", "")
            })
            
        context = "\n".join(context_parts)
        
        # 2. Construct messages list for LLM
        system_prompt = (
            "You are an Enterprise AI Knowledge Assistant, a helpful and professional AI system designed to answer "
            "questions based on the provided corporate/enterprise documents.\n\n"
            "Use the retrieved document context below to answer the user's question. If the context does not contain "
            "the information needed to answer the question, state clearly that you do not have that information "
            "in the uploaded documents, but offer a general response if appropriate while noting it's not in the documents.\n\n"
            "Keep your response professional, well-structured (using bullet points if helpful), and concise.\n\n"
            "Retrieved Context:\n"
            f"{context}"
        )
        
        messages = [SystemMessage(content=system_prompt)]
        
        # Add chat history for multi-turn conversational context
        if chat_history:
            for role, text in chat_history[-5:]: # Keep last 5 turns to prevent token overflow
                if role.lower() == "user":
                    messages.append(HumanMessage(content=text))
                else:
                    messages.append(AIMessage(content=text))
                    
        # Add current query
        messages.append(HumanMessage(content=user_query))
        
        # 3. Call LLM
        llm = self.get_llm(custom_settings)
        
        try:
            response = llm.invoke(messages)
            answer = response.content
        except Exception as e:
            answer = f"Error generating response from LLM provider: {str(e)}"
            
        return {
            "answer": answer,
            "references": references
        }
