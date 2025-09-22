# Manual Q&A Frontend

A modern, user-friendly interface for asking questions about user manuals using AI-powered RAG (Retrieval-Augmented Generation).

## Features

- **Upload PDF Manuals**: Drag and drop or select PDF files to upload
- **Smart Manual Processing**: Automatically parses and structures manual content
- **Intelligent Q&A**: Ask questions and get accurate answers from your manuals
- **Section-Aware Responses**: Shows which sections of the manual were used for answers
- **Real-time Streaming**: Get responses as they're generated
- **Confidence Scoring**: See how confident the AI is in its answers
- **Modern UI**: Clean, responsive design with excellent contrast and accessibility

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on port 8002

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Upload a Manual**: Click "Choose File" or drag and drop a PDF manual
2. **Select a Manual**: Choose from your uploaded manuals in the sidebar
3. **Ask Questions**: Type questions about procedures, troubleshooting, specifications, etc.
4. **Get Answers**: Receive detailed, context-aware responses with source sections

## Manual Types Supported

The system automatically detects and categorizes different types of manual content:

- **Procedures**: Step-by-step instructions
- **Troubleshooting**: Problem-solving guides
- **Specifications**: Technical details and specs
- **General**: Other manual content

## API Integration

The frontend communicates with the Manual Q&A API backend:

- `POST /api/upload-manual` - Upload and process manuals
- `POST /api/query-manual` - Ask questions (non-streaming)
- `POST /api/query-manual-stream` - Ask questions (streaming)
- `GET /api/manuals` - List uploaded manuals

## Deployment

This frontend is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set the `NEXT_PUBLIC_API_BASE_URL` environment variable
3. Deploy automatically on push to main branch

## Development

The project uses:
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

## Troubleshooting

- **Upload Issues**: Ensure the backend API is running on port 8002
- **API Errors**: Check the browser console for detailed error messages
- **Styling Issues**: Ensure Tailwind CSS is properly configured