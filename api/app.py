# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI, AsyncOpenAI
from dotenv import load_dotenv
import os
import time
import uuid
from typing import Optional, Dict, Any

load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required but not set")

# Import aimakerspace components for RAG functionality
import sys
sys.path.append('/root/py/The-AI-Engineer-Challenge')
from aimakerspace.text_utils import CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.web_scraper import WebScraper

# Initialize FastAPI application with a title
app = FastAPI(title="Docs Helper API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)


# Define the data model for web scraping requests
class WebScrapeRequest(BaseModel):
    url: str               # URL to scrape
    model: Optional[str] = "gpt-4.1"  # Optional model selection with default

# Define the data model for RAG chat requests
class RAGChatRequest(BaseModel):
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1"  # Optional model selection with default
    doc_id: str           # ID of the scraped document to use for context

# Global state for managing scraped documents and vector databases
doc_storage: Dict[str, Dict[str, Any]] = {}  # Store document metadata and vector databases


# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Web scraping endpoint
@app.post("/api/scrape-url")
async def scrape_url(request: WebScrapeRequest):
    """Scrape a webpage and process it for RAG functionality."""
    try:
        # Initialize web scraper
        scraper = WebScraper()
        
        # Scrape the URL
        scraped_data = scraper.scrape_url(request.url)
        
        if scraped_data.get('error'):
            raise HTTPException(status_code=400, detail=f"Failed to scrape URL: {scraped_data['error']}")
        
        if not scraped_data.get('content'):
            raise HTTPException(status_code=400, detail="No content extracted from the URL")
        
        # Split the content into chunks
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_texts([scraped_data['content']])
        
        # Create vector database with custom embedding model
        from aimakerspace.openai_utils.embedding import EmbeddingModel
        
        # Create a custom embedding model with the environment API key
        embedding_model = EmbeddingModel()
        embedding_model.openai_api_key = OPENAI_API_KEY
        embedding_model.client = OpenAI(api_key=OPENAI_API_KEY)
        embedding_model.async_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        vector_db = VectorDatabase(embedding_model)
        await vector_db.abuild_from_list(chunks)
        
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Store document metadata and vector database
        doc_storage[doc_id] = {
            "url": scraped_data['url'],
            "title": scraped_data.get('title', ''),
            "vector_db": vector_db,
            "chunks": chunks,
            "scrape_time": str(time.time()),
            "word_count": scraped_data.get('word_count', 0),
            "char_count": scraped_data.get('char_count', 0)
        }
        
        return {
            "doc_id": doc_id,
            "url": scraped_data['url'],
            "title": scraped_data.get('title', ''),
            "chunks_count": len(chunks),
            "word_count": scraped_data.get('word_count', 0),
            "message": "URL scraped and indexed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")

# RAG Chat endpoint
@app.post("/api/rag-chat")
async def rag_chat(request: RAGChatRequest):
    """Chat with the scraped document using RAG functionality."""
    try:
        # Check if document exists
        if request.doc_id not in doc_storage:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_data = doc_storage[request.doc_id]
        vector_db = doc_data["vector_db"]
        
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
        
        # Get document metadata for context
        doc_title = doc_data.get('title', 'Unknown Document')
        doc_url = doc_data.get('url', 'Unknown URL')
        
        # Create system message that instructs the LLM to only use the provided context
        system_message = f"""You are a helpful assistant that answers questions based ONLY on the provided context from a scraped web document. 

DOCUMENT INFORMATION:
- Title: {doc_title}
- URL: {doc_url}

IMPORTANT RULES:
- Only answer questions using information from the provided context below
- If the answer cannot be found in the context, say "I cannot find that information in the provided document"
- Do not make up or infer information that is not explicitly stated in the context
- Be precise and cite specific parts of the context when relevant
- When referencing information, mention that it comes from the scraped document

Context from the document:
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

# List scraped documents endpoint
@app.get("/api/documents")
async def list_documents():
    """List all scraped documents."""
    return {
        "documents": [
            {
                "doc_id": doc_id,
                "url": data["url"],
                "title": data.get("title", "Untitled"),
                "chunks_count": len(data["chunks"]),
                "word_count": data.get("word_count", 0),
                "scrape_time": data["scrape_time"]
            }
            for doc_id, data in doc_storage.items()
        ]
    }

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8001
    uvicorn.run(app, host="0.0.0.0", port=8001)
