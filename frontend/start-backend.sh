#!/bin/bash

echo "🚀 Starting FastAPI Backend Server..."
echo ""

# Check if we're in the frontend directory and need to go up
if [ -d "../api" ]; then
    echo "📁 Found API directory, navigating to it..."
    cd ../api
fi

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if requirements.txt exists and install dependencies
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Start the FastAPI server
echo "🔥 Starting server on http://localhost:8000"
echo "📝 API documentation will be available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python app.py 