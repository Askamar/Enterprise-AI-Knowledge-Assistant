FROM python:3.11-slim

WORKDIR /backend

# Install build dependencies if needed (e.g. for PyTorch / sentence-transformers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app source code
COPY ./app ./app

# Create folder for persistent uploads & chroma database
RUN mkdir -p /backend/app/uploads /backend/app/chroma_db /backend/models_cache

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV CHROMA_DB_DIR=/backend/app/chroma_db
ENV UPLOAD_DIR=/backend/app/uploads
ENV HF_HOME=/backend/models_cache

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
