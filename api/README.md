# PDF RAG Chat API Backend

This is a FastAPI-based backend service that provides a PDF RAG (Retrieval-Augmented Generation) chat interface using OpenAI's API.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- An OpenAI API key

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install the required dependencies:
```bash
pip install fastapi uvicorn openai pydantic
```

3. Set up environment variables:
```bash
export OPENAI_API_KEY="your_openai_api_key_here"
```
Or create a `.env` file in the `api` directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the Server

1. Make sure you're in the `api` directory:
```bash
cd api
```

2. Start the server:
```bash
python app.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### PDF Upload Endpoint
- **URL**: `/api/upload-pdf`
- **Method**: POST
- **Request**: Multipart form data with PDF file
- **Response**: PDF metadata including pdf_id for RAG operations

### RAG Chat Endpoint
- **URL**: `/api/rag-chat`
- **Method**: POST
- **Request Body**:
```json
{
    "user_message": "string",
    "model": "gpt-4.1-mini",  // optional
    "pdf_id": "string"  // ID from PDF upload
}
```
- **Response**: Streaming text response based on PDF content

### List PDFs Endpoint
- **URL**: `/api/pdfs`
- **Method**: GET
- **Response**: List of uploaded PDFs with metadata

### Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response**: `{"status": "ok"}`

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## CORS Configuration

The API is configured to accept requests from any origin (`*`). This can be modified in the `app.py` file if you need to restrict access to specific domains.

## Error Handling

The API includes basic error handling for:
- Missing `OPENAI_API_KEY` environment variable (server startup error)
- Invalid API keys
- OpenAI API errors
- General server errors

All errors will return a 500 status code with an error message.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key for authentication |

**Note**: The server will fail to start if the `OPENAI_API_KEY` environment variable is not set. 