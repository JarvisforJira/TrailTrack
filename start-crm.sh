#!/bin/bash

echo "🚀 Starting TrailTrack CRM..."

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend (Python/FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > backend.log 2>&1

echo "🗄️  Starting backend server on port 8001..."
python main.py > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🎨 Starting frontend (React/Vite)..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "🌐 Starting frontend server on port 3001..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ TrailTrack CRM is starting up!"
echo ""
echo "📍 Access your application:"
echo "   🌐 Frontend: http://localhost:3001"
echo "   🔧 Backend API: http://localhost:8001"
echo "   📚 API Docs: http://localhost:8001/docs"
echo ""
echo "📋 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 To stop the application:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or press Ctrl+C"
echo ""

# Wait for user interrupt
trap "echo '🛑 Stopping TrailTrack CRM...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running
wait
