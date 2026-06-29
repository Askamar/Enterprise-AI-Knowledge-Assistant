# Enterprise AI Knowledge Assistant

An enterprise-ready Retrieval-Augmented Generation (RAG) platform where users can upload documents (PDF, DOCX, TXT, MD) and have contextual conversations powered by **Llama 3** (local via Ollama or Cloud via Groq), **FastAPI**, **LangChain**, and **ChromaDB**, all bundled in a premium glassmorphic **React** interface.

---

## Key Features
- **File Ingestion**: Upload corporate documents. Chunks text, extracts metadata, computes embeddings, and stores them in ChromaDB automatically.
- **RAG Engine**: Performs similarity searches across uploaded documents and uses matched contexts to construct prompts.
- **Dynamic Configuration**: Change LLM sources (Ollama vs. Groq), temperatures, and text chunking parameters on the fly.
- **Source Citations**: Visual indicator of documents referenced during generation, complete with text fragment inspectors.
- **Premium UI**: Modern, dark glassmorphic interface with loading animations and responsive controls.

---

## Quick Start Guide

### Prerequisites
1. **Docker & Docker Compose**: Ensure Docker Desktop is installed and running on your system.
2. **Ollama (Optional - for local LLM execution)**:
   - Download and install Ollama from [ollama.com](https://ollama.com).
   - In your command line, download Llama 3:
     ```bash
     ollama pull llama3
     ```

### 1. Launch the Application
Run Docker Compose in the project root directory:
```bash
docker compose up --build
```
This command builds the images and spins up:
- **Frontend**: Serves the React SPA at [http://localhost:3000](http://localhost:3000)
- **Backend**: Exposes the FastAPI endpoints at [http://localhost:8000](http://localhost:8000)

### 2. Connect to Groq Cloud (Alternative)
If you prefer not to run Llama 3 locally:
1. Open the **System Configuration** panel on the left sidebar.
2. Select **Groq Cloud API** as the provider.
3. Input your Groq API Key and click **Save Configuration**.
4. *(Optional)* You can supply your API key as an environment variable in the `docker-compose.yml` or a `.env` file in the backend folder.

---

## Project Structure
- `backend/`: FastAPI application code (FastAPI routers, LangChain RAG pipeline, and document loaders).
- `frontend/`: React single page application built using Vite and styled with premium custom CSS.
- `docker-compose.yml`: Combines backend and frontend containers with persistent local volumes for document uploads, database indexing, and HuggingFace models.
