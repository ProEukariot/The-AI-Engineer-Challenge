# Manual RAG System - Complete Setup Guide

## 🎯 Overview

The Manual RAG System is a specialized AI-powered solution designed to help people easily find answers in user manuals. Instead of struggling through dense technical documentation, users can simply ask questions in natural language and get instant, accurate answers with source citations.

## ✨ Key Features

- **📚 Manual-Specific Intelligence**: Optimized for technical documentation and user manuals
- **🔍 Smart Section Detection**: Automatically identifies procedures, troubleshooting, specifications
- **💬 Real-Time Chat**: Streaming responses for better user experience
- **📊 Confidence Scoring**: Know how reliable each answer is
- **🎨 Modern UI**: Clean, accessible interface with excellent contrast
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **⚡ Fast & Accurate**: Vector-based search with OpenAI integration

## 🚀 Quick Start

### Option 1: One-Command Setup
```bash
cd /root/py/The-AI-Engineer-Challenge
./start_manual_rag.sh
```

### Option 2: Manual Setup

#### 1. Install Dependencies
```bash
# Backend dependencies
pip install PyPDF2

# Frontend dependencies
cd frontend
npm install
cd ..
```

#### 2. Set Environment Variables
```bash
# Create .env file in project root
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

#### 3. Start Backend
```bash
cd api
python3 manual_app.py
```

#### 4. Start Frontend (in new terminal)
```bash
cd frontend
npm run dev
```

#### 5. Open Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8002

## 📖 How to Use

### 1. Upload a Manual
- Drag and drop a PDF manual onto the upload area
- Or click "Choose File" to select a PDF
- Wait for processing (usually takes a few seconds)

### 2. Ask Questions
- Select your uploaded manual from the sidebar
- Type questions in natural language, such as:
  - "How do I install this device?"
  - "What should I do if it's not working?"
  - "What are the technical specifications?"
  - "How do I troubleshoot connection issues?"

### 3. Get Answers
- Receive instant, accurate answers
- See which sections of the manual were used
- View confidence scores for answer reliability
- Get step-by-step procedures when relevant

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (OpenAI)      │
│                 │    │                 │    │                 │
│ • Manual Upload │    │ • PDF Processing│    │ • Embeddings    │
│ • Chat Interface│    │ • Vector Search │    │ • Text Generation│
│ • Real-time UI  │    │ • Section Parse │    │ • Streaming     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Technical Details

### Backend Components
- **Manual Parser**: Intelligent PDF parsing with section detection
- **Vector Database**: Efficient similarity search for relevant content
- **API Endpoints**: RESTful API with streaming support
- **Section Classification**: Automatic categorization of content types

### Frontend Components
- **Manual Upload**: Drag-and-drop file upload with progress
- **Chat Interface**: Real-time messaging with streaming responses
- **Manual List**: Browse and select uploaded manuals
- **Response Display**: Formatted answers with source citations

### AI Integration
- **OpenAI Embeddings**: Convert text to vectors for similarity search
- **GPT-4**: Generate natural language responses
- **Streaming**: Real-time response generation
- **Context Awareness**: Manual-specific prompts for better accuracy

## 📁 Project Structure

```
The-AI-Engineer-Challenge/
├── aimakerspace/
│   ├── manual_rag.py          # Core manual RAG system
│   ├── vectordatabase.py      # Vector search functionality
│   ├── text_utils.py          # Text processing utilities
│   └── openai_utils/          # OpenAI integration
├── api/
│   ├── manual_app.py          # Specialized manual API
│   └── app.py                 # Original general API
├── frontend/
│   ├── app/                   # Next.js app directory
│   │   ├── components/        # React components
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # App layout
│   │   └── page.tsx           # Main page
│   ├── package.json           # Frontend dependencies
│   └── tailwind.config.js     # Tailwind CSS config
├── start_manual_rag.sh        # One-command startup script
├── test_manual_simple.py      # Component tests
└── MERGE_MANUAL_RAG.md        # Merge instructions
```

## 🧪 Testing

### Run Component Tests
```bash
python3 test_manual_simple.py
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8002/api/health

# List manuals
curl http://localhost:8002/api/manuals
```

### Test Frontend
```bash
cd frontend
npm run build
npm start
```

## 🚀 Deployment

### Backend Deployment
- Deploy `api/manual_app.py` to your preferred hosting service
- Ensure Python dependencies are installed
- Set `OPENAI_API_KEY` environment variable

### Frontend Deployment (Vercel)
1. Connect GitHub repository to Vercel
2. Set `NEXT_PUBLIC_API_BASE_URL` environment variable
3. Deploy automatically on push to main branch

### Environment Variables
```bash
# Backend
OPENAI_API_KEY=your_openai_api_key

# Frontend
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

## 🔍 API Reference

### Manual Management
- `POST /api/upload-manual` - Upload and process a PDF manual
- `GET /api/manuals` - List all uploaded manuals
- `GET /api/manuals/{manual_id}` - Get manual details

### Q&A
- `POST /api/query-manual` - Ask questions (non-streaming)
- `POST /api/query-manual-stream` - Ask questions (streaming)

### Example API Usage
```bash
# Upload a manual
curl -X POST -F "file=@manual.pdf" http://localhost:8002/api/upload-manual

# Ask a question
curl -X POST -H "Content-Type: application/json" \
  -d '{"question": "How do I install this?", "manual_id": "your_manual_id"}' \
  http://localhost:8002/api/query-manual
```

## 🎨 Customization

### Styling
- Modify `frontend/app/globals.css` for global styles
- Update `frontend/tailwind.config.js` for theme customization
- Edit component files for specific UI changes

### Manual Processing
- Adjust chunk size in `aimakerspace/manual_rag.py`
- Modify section detection patterns
- Customize section classification logic

### AI Prompts
- Update system prompts in `api/manual_app.py`
- Modify response formatting
- Adjust confidence scoring logic

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module 'autoprefixer'"**
   ```bash
   cd frontend && npm install
   ```

2. **"No module named 'PyPDF2'"**
   ```bash
   pip install PyPDF2
   ```

3. **Port already in use**
   ```bash
   # Kill process using port 8002 or 3000
   lsof -ti:8002 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   ```

4. **OpenAI API errors**
   - Check your API key is set correctly
   - Ensure you have sufficient API credits
   - Verify the API key has the correct permissions

### Debug Mode
```bash
# Backend with debug logging
cd api && python3 -u manual_app.py

# Frontend with verbose output
cd frontend && npm run dev -- --verbose
```

## 📈 Performance Tips

1. **Optimize PDF Size**: Smaller PDFs process faster
2. **Chunk Size**: Adjust chunk size based on manual complexity
3. **Caching**: Vector embeddings are cached for faster subsequent queries
4. **Streaming**: Use streaming endpoints for better user experience

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **File Upload**: Validate file types and sizes
3. **Rate Limiting**: Implement rate limiting for production use
4. **CORS**: Configure CORS appropriately for your domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of The AI Engineer Challenge and follows the same licensing terms.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check the browser console for frontend errors
4. Review backend logs for API errors

---

**Happy Manual Q&A! 🎉**

This system makes user manuals accessible and useful for everyone. No more struggling through dense technical documentation - just ask questions and get answers!
