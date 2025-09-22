# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI, AsyncOpenAI
import os
import tempfile
import shutil
import time
import uuid
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required but not set")

# Import aimakerspace components for RAG functionality
import sys
sys.path.append('/root/py/The-AI-Engineer-Challenge')
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)


# Define the data model for RAG chat requests
class RAGChatRequest(BaseModel):
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1"  # Optional model selection with default
    pdf_id: str           # ID of the uploaded PDF to use for context

# Global state for managing PDFs and vector databases
pdf_storage: Dict[str, Dict[str, Any]] = {}  # Store PDF metadata and vector databases


# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# PDF Upload endpoint
@app.post("/api/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...)
):
    """Upload and process a PDF file for RAG functionality."""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Create temporary file to store the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        try:
            # Load PDF using aimakerspace library
            pdf_loader = PDFLoader(tmp_path)
            pdf_loader.load_file()
            
            if not pdf_loader.documents:
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
            # Split the document into chunks
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_texts(pdf_loader.documents)
            
            # Create vector database with custom embedding model that uses the provided API key
            from aimakerspace.openai_utils.embedding import EmbeddingModel
            
            # Create a custom embedding model with the environment API key
            embedding_model = EmbeddingModel()
            embedding_model.openai_api_key = OPENAI_API_KEY
            embedding_model.client = OpenAI(api_key=OPENAI_API_KEY)
            embedding_model.async_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
            
            vector_db = VectorDatabase(embedding_model)
            await vector_db.abuild_from_list(chunks)
            
            # Generate unique PDF ID
            pdf_id = str(uuid.uuid4())
            
            # Store PDF metadata and vector database
            pdf_storage[pdf_id] = {
                "filename": file.filename,
                "vector_db": vector_db,
                "chunks": chunks,
                "upload_time": str(time.time())
            }
            
            return {
                "pdf_id": pdf_id,
                "filename": file.filename,
                "chunks_count": len(chunks),
                "message": "PDF uploaded and indexed successfully"
            }
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_path)
            
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# RAG Chat endpoint
@app.post("/api/rag-chat")
async def rag_chat(request: RAGChatRequest):
    """Chat with the PDF using RAG functionality."""
    try:
        # Check if PDF exists
        if request.pdf_id not in pdf_storage:
            raise HTTPException(status_code=404, detail="PDF not found")
        
        pdf_data = pdf_storage[request.pdf_id]
        vector_db = pdf_data["vector_db"]
        
        # Update the embedding model with the environment API key for search
        if hasattr(vector_db, 'embedding_model'):
            vector_db.embedding_model.openai_api_key = OPENAI_API_KEY
            vector_db.embedding_model.client = OpenAI(api_key=OPENAI_API_KEY)
            vector_db.embedding_model.async_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        # Search for relevant chunks
        relevant_chunks = vector_db.search_by_text(
            request.user_message, 
            k=5,  # Get top 5 most relevant chunks
            return_as_text=True
        )
        
        # Create context from relevant chunks
        context = "\n\n".join(relevant_chunks)
        
        # Create system message that instructs the LLM to only use the provided context
        system_message = f"""You are a helpful assistant that answers questions based ONLY on the provided context from a PDF document. 

IMPORTANT RULES:
- Only answer questions using information from the provided context below
- If the answer cannot be found in the context, say "I cannot find that information in the provided document"
- Do not make up or infer information that is not explicitly stated in the context
- Be precise and cite specific parts of the context when relevant

Context from the PDF:
{context}"""
        
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model or "gpt-4.1",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        print(f"Error in RAG chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# List uploaded PDFs endpoint
@app.get("/api/pdfs")
async def list_pdfs():
    """List all uploaded PDFs."""
    return {
        "pdfs": [
            {
                "pdf_id": pdf_id,
                "filename": data["filename"],
                "chunks_count": len(data["chunks"]),
                "upload_time": data["upload_time"]
            }
            for pdf_id, data in pdf_storage.items()
        ]
    }

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8001)
