# Manual RAG System - Merge Instructions

## Overview

This feature branch implements a specialized RAG (Retrieval-Augmented Generation) system specifically designed for answering questions from user manuals. The system includes:

- **Specialized Manual Parser**: Intelligently parses PDF manuals with section detection
- **Enhanced Chunking Strategy**: Preserves manual structure and context
- **Manual-Aware RAG System**: Optimized for technical documentation Q&A
- **Modern Frontend Interface**: User-friendly Next.js application
- **Enhanced API**: Specialized endpoints for manual Q&A

## Files Added/Modified

### New Files:
- `aimakerspace/manual_rag.py` - Core manual RAG system
- `api/manual_app.py` - Specialized API for manual Q&A
- `frontend/` - Complete Next.js frontend application
- `test_manual_rag.py` - Test script for the system
- `test_manual_simple.py` - Simple component tests

### Frontend Structure:
```
frontend/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── components/
│       ├── ManualUpload.tsx
│       ├── ManualList.tsx
│       └── ManualQuery.tsx
└── README.md
```

## Key Features

### 1. Manual-Specific Parsing
- Detects sections, procedures, troubleshooting, and specifications
- Preserves manual structure and context
- Intelligent section classification

### 2. Enhanced Q&A Experience
- Real-time streaming responses
- Confidence scoring for answers
- Source section highlighting
- Manual-specific prompts

### 3. Modern UI/UX
- Clean, accessible design with excellent contrast
- Drag-and-drop manual upload
- Real-time chat interface
- Section-aware responses

## Dependencies

### Backend Dependencies:
- PyPDF2 (for PDF processing)
- FastAPI (already available)
- OpenAI (already available)

### Frontend Dependencies:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (icons)

## Installation & Setup

### Backend Setup:
1. Install dependencies:
```bash
pip install PyPDF2
```

2. Run the manual API:
```bash
cd api
python manual_app.py
```

### Frontend Setup:
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set environment variables:
```bash
# Create .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002
```

3. Run development server:
```bash
npm run dev
```

## Testing

Run the component tests:
```bash
python3 test_manual_simple.py
```

## API Endpoints

### Manual Management:
- `POST /api/upload-manual` - Upload and process manuals
- `GET /api/manuals` - List uploaded manuals
- `GET /api/manuals/{manual_id}` - Get manual details

### Q&A:
- `POST /api/query-manual` - Ask questions (non-streaming)
- `POST /api/query-manual-stream` - Ask questions (streaming)

## Merge Instructions

### Option 1: GitHub Pull Request

1. Push the feature branch:
```bash
git add .
git commit -m "feat: Add specialized Manual RAG system for user manual Q&A

- Implement manual-specific parsing and chunking
- Add enhanced API endpoints for manual Q&A
- Create modern Next.js frontend interface
- Include real-time streaming and confidence scoring
- Add comprehensive testing and documentation"

git push origin feature/manual-rag-system
```

2. Create a Pull Request on GitHub:
   - Title: "feat: Add specialized Manual RAG system for user manual Q&A"
   - Description: Include this MERGE_MANUAL_RAG.md content
   - Review the changes and merge

### Option 2: GitHub CLI

1. Push the feature branch:
```bash
git add .
git commit -m "feat: Add specialized Manual RAG system for user manual Q&A

- Implement manual-specific parsing and chunking
- Add enhanced API endpoints for manual Q&A
- Create modern Next.js frontend interface
- Include real-time streaming and confidence scoring
- Add comprehensive testing and documentation"

git push origin feature/manual-rag-system
```

2. Create and merge PR using GitHub CLI:
```bash
gh pr create --title "feat: Add specialized Manual RAG system for user manual Q&A" --body-file MERGE_MANUAL_RAG.md
gh pr merge --merge --delete-branch
```

## Post-Merge Steps

1. **Install Dependencies**:
   ```bash
   pip install PyPDF2
   cd frontend && npm install
   ```

2. **Test the System**:
   ```bash
   # Test backend
   python3 test_manual_simple.py
   
   # Test frontend
   cd frontend && npm run dev
   ```

3. **Deploy**:
   - Backend: Deploy the manual API alongside existing API
   - Frontend: Deploy to Vercel with environment variables

## Usage

1. **Upload Manuals**: Users can drag-and-drop PDF manuals
2. **Ask Questions**: Natural language questions about procedures, troubleshooting, specs
3. **Get Answers**: AI-powered responses with source sections and confidence scores
4. **Real-time Chat**: Streaming responses for better user experience

## Benefits

- **Specialized for Manuals**: Optimized parsing and chunking for technical documentation
- **Better User Experience**: Modern, intuitive interface
- **Accurate Answers**: Manual-specific prompts and context understanding
- **Source Transparency**: Shows which sections were used for answers
- **Confidence Scoring**: Users know how reliable the answers are

## Technical Decisions

1. **Manual-Specific Chunking**: Preserves section structure and context
2. **Section Classification**: Automatically categorizes content types
3. **Streaming Responses**: Better user experience with real-time answers
4. **Next.js Frontend**: Modern, performant, and Vercel-optimized
5. **TypeScript**: Type safety and better development experience
6. **Tailwind CSS**: Consistent, accessible styling

This implementation provides a complete, production-ready solution for manual Q&A that significantly improves upon generic RAG systems.
