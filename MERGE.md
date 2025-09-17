# Merge Instructions for PDF Upload and RAG Functionality

This document provides instructions for merging the PDF upload and RAG functionality feature branch back to the main branch.

## Overview

This feature adds comprehensive PDF upload and RAG (Retrieval Augmented Generation) functionality to the existing chat application:

- **Backend**: New endpoints for PDF upload, processing, and RAG-based chat
- **Frontend**: Tabbed interface with PDF upload and RAG chat capabilities
- **RAG System**: Uses the `aimakerspace` library for PDF processing and vector search

## Changes Made

### Backend Changes (`api/app.py`)
- Added PDF upload endpoint (`/api/upload-pdf`)
- Added RAG chat endpoint (`/api/rag-chat`)
- Added PDF listing endpoint (`/api/pdfs`)
- Integrated `aimakerspace` library for PDF processing and vector operations
- Added new data models for RAG requests

### Frontend Changes (`frontend/app/page.tsx`)
- Added tabbed interface (General Chat / PDF RAG Chat)
- Added PDF upload functionality
- Added PDF selection dropdown
- Added RAG chat interface
- Enhanced UI with proper styling and error handling

### Dependencies (`api/requirements.txt`)
- Added `PyPDF2==3.0.1` for PDF processing
- Added `numpy>=1.21.0` for vector operations
- Added `python-dotenv==1.0.0` for environment variable management

## Merge Instructions

### Option 1: GitHub Pull Request (Recommended)

1. **Push the feature branch to GitHub:**
   ```bash
   git push origin feature/pdf-upload-rag
   ```

2. **Create a Pull Request:**
   - Go to the GitHub repository
   - Click "Compare & pull request" for the `feature/pdf-upload-rag` branch
   - Add a descriptive title: "Add PDF Upload and RAG Functionality"
   - Add description explaining the changes
   - Request review from team members
   - Merge the PR after approval

### Option 2: GitHub CLI

1. **Push the feature branch:**
   ```bash
   git push origin feature/pdf-upload-rag
   ```

2. **Create and merge PR using GitHub CLI:**
   ```bash
   # Create pull request
   gh pr create --title "Add PDF Upload and RAG Functionality" \
                --body "This PR adds comprehensive PDF upload and RAG functionality using the aimakerspace library." \
                --base main \
                --head feature/pdf-upload-rag

   # Merge the pull request
   gh pr merge --merge --delete-branch
   ```

### Option 3: Direct Git Merge (Local)

1. **Switch to main branch:**
   ```bash
   git checkout main
   ```

2. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

3. **Merge feature branch:**
   ```bash
   git merge feature/pdf-upload-rag
   ```

4. **Push to main:**
   ```bash
   git push origin main
   ```

5. **Delete feature branch:**
   ```bash
   git branch -d feature/pdf-upload-rag
   git push origin --delete feature/pdf-upload-rag
   ```

## Testing After Merge

1. **Install dependencies:**
   ```bash
   cd api
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Start backend:**
   ```bash
   cd api
   source venv/bin/activate
   python app.py
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Test functionality:**
   - Upload a PDF file
   - Ask questions about the PDF content
   - Verify RAG responses are based on PDF content only

## Key Features

- **PDF Upload**: Users can upload PDF files which are automatically processed and indexed
- **Vector Search**: Uses embeddings to find relevant content from PDFs
- **RAG Chat**: Chat interface that only answers based on uploaded PDF content
- **Context-Aware**: LLM is instructed to only use information from the provided PDF context
- **Streaming Responses**: Real-time streaming of AI responses
- **Error Handling**: Comprehensive error handling for upload and processing failures

## Dependencies

The application now requires:
- Python 3.8+ with virtual environment
- Node.js 18+ for frontend
- OpenAI API key for both general chat and RAG functionality
- Sufficient memory for vector operations (PDFs are processed in-memory)

## Notes

- PDFs are processed and stored in memory (not persisted to disk)
- Vector databases are created per PDF upload
- The system supports multiple PDFs but processes them independently
- All PDF processing uses the `aimakerspace` library as requested
