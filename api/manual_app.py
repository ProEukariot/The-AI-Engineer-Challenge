"""
Enhanced FastAPI application specifically for manual Q&A.

This application provides specialized endpoints for uploading and querying
user manuals with improved context understanding and manual-specific features.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI, AsyncOpenAI
import os
import tempfile
import shutil
import time
import uuid
from typing import Optional, Dict, Any, List
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required but not set")

# Import aimakerspace components
import sys
sys.path.append('/root/py/The-AI-Engineer-Challenge')
from aimakerspace.manual_rag import ManualRAGSystem, ManualParser
from aimakerspace.openai_utils.embedding import EmbeddingModel

# Initialize FastAPI application
app = FastAPI(title="Manual Q&A API", description="Specialized RAG system for user manual questions")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ManualUploadResponse(BaseModel):
    manual_id: str
    filename: str
    sections_count: int
    chunks_count: int
    sections: List[Dict[str, str]]
    message: str

class ManualQueryRequest(BaseModel):
    question: str
    manual_id: str
    model: Optional[str] = "gpt-4"
    include_sections: Optional[bool] = True

class ManualQueryResponse(BaseModel):
    answer: str
    relevant_sections: List[Dict[str, Any]]
    confidence: float

# Global state
manual_rag_system = ManualRAGSystem()
uploaded_manuals: Dict[str, Dict[str, Any]] = {}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "manual-qa"}

# Upload manual endpoint
@app.post("/api/upload-manual", response_model=ManualUploadResponse)
async def upload_manual(file: UploadFile = File(...)):
    """Upload and process a manual PDF for Q&A functionality."""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        try:
            # Generate unique manual ID
            manual_id = str(uuid.uuid4())
            
            # Load manual using specialized parser
            result = await manual_rag_system.load_manual(tmp_path, manual_id)
            
            # Store manual metadata
            uploaded_manuals[manual_id] = {
                "filename": file.filename,
                "upload_time": str(time.time()),
                "sections": result['sections']
            }
            
            return ManualUploadResponse(
                manual_id=manual_id,
                filename=file.filename,
                sections_count=result['sections_count'],
                chunks_count=result['total_chunks'],
                sections=result['sections'],
                message="Manual uploaded and processed successfully"
            )
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_path)
            
    except Exception as e:
        print(f"Error processing manual: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing manual: {str(e)}")

# Query manual endpoint
@app.post("/api/query-manual", response_model=ManualQueryResponse)
async def query_manual(request: ManualQueryRequest):
    """Query a specific manual with a question."""
    try:
        # Check if manual exists
        if request.manual_id not in uploaded_manuals:
            raise HTTPException(status_code=404, detail="Manual not found")
        
        # Search for relevant chunks
        relevant_chunks = manual_rag_system.search_manual(
            request.question, 
            request.manual_id, 
            k=5
        )
        
        if not relevant_chunks:
            return ManualQueryResponse(
                answer="I couldn't find relevant information in the manual for your question.",
                relevant_sections=[],
                confidence=0.0
            )
        
        # Create context from relevant chunks
        context_parts = []
        for chunk in relevant_chunks:
            section_info = {
                "title": chunk['title'],
                "type": chunk['section_type'],
                "page_number": chunk.get('page_number'),
                "similarity": chunk.get('similarity', 0.0)
            }
            context_parts.append(f"Section: {chunk['title']}\nContent: {chunk['content']}")
        
        context = "\n\n".join(context_parts)
        
        # Create specialized system prompt
        system_prompt = f"""You are a helpful assistant specialized in answering questions from user manuals and technical documentation.

IMPORTANT INSTRUCTIONS:
- Answer questions using ONLY the information provided in the context below
- If the answer cannot be found in the context, clearly state "I cannot find that information in the manual"
- For procedures, provide step-by-step instructions in the exact order they appear
- For troubleshooting, be specific about the problem and solution
- Include relevant section titles when available
- Be precise and technical when appropriate
- If you're unsure about something, say so rather than guessing

CONTEXT FROM THE MANUAL:
{context}

Please answer the user's question based on the above context from the manual."""
        
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Generate response
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.question}
            ],
            temperature=0.1,  # Low temperature for factual responses
            max_tokens=1000
        )
        
        answer = response.choices[0].message.content
        
        # Calculate confidence based on similarity scores
        avg_similarity = sum(chunk.get('similarity', 0) for chunk in relevant_chunks) / len(relevant_chunks)
        confidence = min(avg_similarity * 1.2, 1.0)  # Scale and cap at 1.0
        
        # Prepare relevant sections info
        relevant_sections = []
        if request.include_sections:
            for chunk in relevant_chunks:
                relevant_sections.append({
                    "title": chunk['title'],
                    "type": chunk['section_type'],
                    "page_number": chunk.get('page_number'),
                    "similarity": chunk.get('similarity', 0.0),
                    "preview": chunk['content'][:200] + "..." if len(chunk['content']) > 200 else chunk['content']
                })
        
        return ManualQueryResponse(
            answer=answer,
            relevant_sections=relevant_sections,
            confidence=confidence
        )
        
    except Exception as e:
        print(f"Error querying manual: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Streaming query endpoint for real-time responses
@app.post("/api/query-manual-stream")
async def query_manual_stream(request: ManualQueryRequest):
    """Query a manual with streaming response."""
    try:
        # Check if manual exists
        if request.manual_id not in uploaded_manuals:
            raise HTTPException(status_code=404, detail="Manual not found")
        
        # Search for relevant chunks
        relevant_chunks = manual_rag_system.search_manual(
            request.question, 
            request.manual_id, 
            k=5
        )
        
        if not relevant_chunks:
            async def empty_response():
                yield "I couldn't find relevant information in the manual for your question."
            return StreamingResponse(empty_response(), media_type="text/plain")
        
        # Create context
        context_parts = []
        for chunk in relevant_chunks:
            context_parts.append(f"Section: {chunk['title']}\nContent: {chunk['content']}")
        
        context = "\n\n".join(context_parts)
        
        # Create system prompt
        system_prompt = f"""You are a helpful assistant specialized in answering questions from user manuals and technical documentation.

IMPORTANT INSTRUCTIONS:
- Answer questions using ONLY the information provided in the context below
- If the answer cannot be found in the context, clearly state "I cannot find that information in the manual"
- For procedures, provide step-by-step instructions in the exact order they appear
- For troubleshooting, be specific about the problem and solution
- Include relevant section titles when available
- Be precise and technical when appropriate

CONTEXT FROM THE MANUAL:
{context}

Please answer the user's question based on the above context from the manual."""
        
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Create streaming response
        async def generate():
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.question}
                ],
                stream=True,
                temperature=0.1
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        print(f"Error in streaming query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# List uploaded manuals
@app.get("/api/manuals")
async def list_manuals():
    """List all uploaded manuals."""
    return {
        "manuals": [
            {
                "manual_id": manual_id,
                "filename": data["filename"],
                "upload_time": data["upload_time"],
                "sections": data["sections"]
            }
            for manual_id, data in uploaded_manuals.items()
        ]
    }

# Get manual details
@app.get("/api/manuals/{manual_id}")
async def get_manual_details(manual_id: str):
    """Get detailed information about a specific manual."""
    if manual_id not in uploaded_manuals:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    return {
        "manual_id": manual_id,
        **uploaded_manuals[manual_id]
    }

# Entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
