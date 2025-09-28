#!/bin/bash

# TrailTrack CRM Local Startup Script
# This script starts both backend and frontend servers locally

echo "🚀 Starting TrailTrack CRM locally..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if node and npm are installed
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

# Check if python3 is installed
if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed.${NC}"
    exit 1
fi

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down TrailTrack CRM...${NC}"
    pkill -f "python3 main.py" || true
    pkill -f "npm run dev" || true
    exit 0
}

# Trap signals to cleanup processes
trap cleanup SIGINT SIGTERM

# Start Backend (FastAPI)
echo -e "${BLUE}📡 Starting TrailTrack Backend (FastAPI)...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚡ Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt >/dev/null 2>&1

# Start backend in background
python3 main.py &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if curl -s http://localhost:8001/docs > /dev/null; then
    echo -e "${GREEN}✅ Backend started successfully on port 8001${NC}"
else
    echo -e "${RED}❌ Failed to start backend${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start Frontend (React with Vite)
echo -e "${BLUE}🎨 Starting TrailTrack Frontend (React)...${NC}"
cd ../frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚡ Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 8

# Check if frontend is running
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✅ Frontend started successfully on port 3001${NC}"
else
    echo -e "${RED}❌ Failed to start frontend${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}🎯 TrailTrack CRM is now running locally:${NC}"
echo ""
echo -e "${GREEN}🎨 Frontend App: http://localhost:3001${NC}"
echo -e "${GREEN}📡 Backend API: http://localhost:8001${NC}"
echo -e "${GREEN}📚 API Docs: http://localhost:8001/docs${NC}"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"

# Keep script running and show status
while true; do
    sleep 10
    # Check if services are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process died${NC}"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend process died${NC}"
        break
    fi
done

# Cleanup on exit
cleanup
