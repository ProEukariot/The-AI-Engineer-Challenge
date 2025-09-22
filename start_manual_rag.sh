#!/bin/bash

# Manual RAG System Startup Script
# This script starts both the backend API and frontend for the Manual Q&A system

echo "🚀 Starting Manual RAG System..."
echo "================================="

# Check if we're in the right directory
if [ ! -f "aimakerspace/manual_rag.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check if ports are available
echo "🔍 Checking ports..."
if ! check_port 8002; then
    echo "❌ Backend port 8002 is in use. Please stop the service or use a different port."
    exit 1
fi

if ! check_port 3000; then
    echo "❌ Frontend port 3000 is in use. Please stop the service or use a different port."
    exit 1
fi

# Install Python dependencies if needed
echo "📦 Checking Python dependencies..."
if ! python3 -c "import PyPDF2" 2>/dev/null; then
    echo "Installing PyPDF2..."
    pip3 install PyPDF2 --break-system-packages
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start backend in background
echo "🔧 Starting backend API on port 8002..."
cd api
python3 manual_app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! curl -s http://localhost:8002/api/health > /dev/null; then
    echo "❌ Backend failed to start. Check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend started successfully!"

# Start frontend
echo "🎨 Starting frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Manual RAG System is running!"
echo "================================="
echo "📚 Backend API: http://localhost:8002"
echo "🎨 Frontend UI: http://localhost:3000"
echo ""
echo "📖 Usage:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Upload a PDF manual"
echo "3. Ask questions about the manual"
echo ""
echo "🛑 To stop the system:"
echo "Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for user interrupt
trap "echo '🛑 Stopping Manual RAG System...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait
