# Merge Instructions for Feature: Web Scraping Docs Helper

## Overview
This feature transforms the PDF RAG system into a web scraping docs helper that can scrape webpages and use them for RAG-based question answering.

## Changes Made
- **Web Scraping**: Added robust web scraping functionality using requests and BeautifulSoup
- **Backend API**: Replaced PDF upload endpoints with URL scraping endpoints
- **Frontend UI**: Updated interface to accept URLs instead of PDF files
- **RAG Pipeline**: Modified to work with scraped web content
- **Dependencies**: Added web scraping libraries to requirements.txt

## New Features
- **URL Input**: Users can input any webpage URL to scrape
- **Smart Content Extraction**: Extracts clean text, titles, headings, and links
- **Document Management**: Track multiple scraped documents
- **Enhanced RAG**: Context-aware responses with document metadata

## Merge Instructions

### Option 1: GitHub Pull Request (Recommended)
1. Push the feature branch to GitHub:
   ```bash
   git push origin feature/web-scraping-docs-helper
   ```

2. Create a Pull Request on GitHub:
   - Go to the repository on GitHub
   - Click "Compare & pull request" for the `feature/web-scraping-docs-helper` branch
   - Add a descriptive title: "Transform app into docs helper with web scraping"
   - Add description explaining the changes
   - Request review from team members if applicable
   - Merge the PR once approved

### Option 2: GitHub CLI
1. Push the feature branch:
   ```bash
   git push origin feature/web-scraping-docs-helper
   ```

2. Create and merge the PR using GitHub CLI:
   ```bash
   # Create the PR
   gh pr create --title "Transform app into docs helper with web scraping" \
     --body "This PR transforms the PDF RAG system into a web scraping docs helper. Changes include:
     - Added web scraping functionality with requests and BeautifulSoup
     - Replaced PDF upload with URL input
     - Updated all API endpoints for document-based workflow
     - Enhanced frontend UI for web scraping
     - Added comprehensive error handling and validation"

   # Merge the PR (after review)
   gh pr merge --squash
   ```

### Option 3: Direct Merge (Not Recommended for Production)
If you need to merge directly without a PR:
```bash
# Switch to main branch
git checkout main

# Merge the feature branch
git merge --squash feature/web-scraping-docs-helper

# Commit the merge
git commit -m "Merge feature: Transform app into docs helper with web scraping"

# Push to main
git push origin main

# Delete the feature branch
git branch -d feature/web-scraping-docs-helper
git push origin --delete feature/web-scraping-docs-helper
```

## Testing After Merge
1. **Install Dependencies**:
   ```bash
   cd api
   pip install -r requirements.txt
   ```

2. **Backend Testing**:
   - Test URL scraping endpoint (`/api/scrape-url`)
   - Test RAG chat endpoint (`/api/rag-chat`)
   - Test document listing endpoint (`/api/documents`)
   - Verify health check endpoint (`/api/health`)

3. **Frontend Testing**:
   - Test URL input and scraping functionality
   - Test document selection and chat
   - Verify error handling for invalid URLs
   - Test with various website types

4. **Integration Testing**:
   - Test complete workflow: URL → Scrape → Chat
   - Test with different types of websites
   - Verify RAG responses are contextually accurate

## New API Endpoints

### Web Scraping
- **POST** `/api/scrape-url` - Scrape a webpage URL
  - Request: `{"url": "https://example.com", "model": "gpt-4.1"}`
  - Response: Document metadata with doc_id

### Document Management
- **GET** `/api/documents` - List all scraped documents
  - Response: Array of document metadata

### RAG Chat
- **POST** `/api/rag-chat` - Chat with scraped document
  - Request: `{"user_message": "question", "doc_id": "uuid", "model": "gpt-4.1"}`
  - Response: Streaming text response

## Environment Variables
- `OPENAI_API_KEY` - Required for OpenAI API access

## Dependencies Added
- `requests==2.31.0` - HTTP requests for web scraping
- `beautifulsoup4==4.12.2` - HTML parsing
- `lxml==4.9.3` - XML/HTML parser
- `urllib3==2.0.7` - URL utilities

## Files Modified
- `aimakerspace/web_scraper.py` - New web scraping utility
- `api/app.py` - Updated API endpoints
- `api/requirements.txt` - Added web scraping dependencies
- `frontend/app/page.tsx` - Updated UI for URL input
- `api/.env.example` - Environment variable template

## Breaking Changes
- **API**: `/api/upload-pdf` endpoint removed
- **API**: `/api/pdfs` endpoint replaced with `/api/documents`
- **Frontend**: PDF upload UI replaced with URL input
- **Data Models**: PDF-based models replaced with document-based models

## Benefits
- **Versatility**: Can scrape any webpage, not just PDFs
- **Real-time Content**: Access to live web content
- **Better UX**: Simple URL input instead of file upload
- **Rich Metadata**: Extracts titles, headings, and structure
- **Robust Error Handling**: Handles various website types and errors

## Rollback Plan
If issues are discovered after merge:
1. Revert the merge commit:
   ```bash
   git revert <merge-commit-hash>
   ```
2. Or create a hotfix branch to restore PDF functionality if needed

## Usage Examples
1. **Scrape Documentation**:
   - Input: `https://docs.python.org/3/tutorial/`
   - Result: Scraped Python tutorial content for RAG

2. **Scrape API Documentation**:
   - Input: `https://platform.openai.com/docs/api-reference`
   - Result: OpenAI API docs available for questions

3. **Scrape Blog Posts**:
   - Input: `https://blog.example.com/technical-article`
   - Result: Article content for technical Q&A
