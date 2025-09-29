#!/bin/bash

# TrailTrack CRM Startup Script with ngrok Pro (Reserved Domain)
# This script starts both backend and frontend servers with professional ngrok tunnel

echo "🚀 Starting TrailTrack CRM with Professional ngrok Domain..."

# Load permanent port configuration
source "/Users/claudiapitts/projects/demo-ports-config.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Use permanent domain from config
NGROK_DOMAIN=$TRAIL_NGROK_DOMAIN

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if ngrok is installed
if ! command_exists ngrok; then
    echo -e "${RED}❌ ngrok is not installed. Please install ngrok first.${NC}"
    echo "Visit: https://ngrok.com/download"
    exit 1
fi

# Check dependencies
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed.${NC}"
    exit 1
fi

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down TrailTrack CRM...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $NGROK_PID 2>/dev/null || true
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

# Check if frontend is running on permanent port
if curl -s http://localhost:$TRAIL_FRONTEND_PORT > /dev/null; then
    echo -e "${GREEN}✅ Frontend started successfully on port $TRAIL_FRONTEND_PORT${NC}"
else
    echo -e "${RED}❌ Failed to start frontend${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Start Professional ngrok Tunnel
echo -e "${BLUE}🌐 Starting Professional ngrok Tunnel...${NC}"
echo -e "${YELLOW}📡 Using reserved domain: ${NGROK_DOMAIN}${NC}"

# Start ngrok with permanent domain and port
ngrok http --domain=$NGROK_DOMAIN $TRAIL_FRONTEND_PORT --log=stdout > /tmp/ngrok-trailtrack.log &
NGROK_PID=$!

# Wait for ngrok to start
echo -e "${YELLOW}⏳ Waiting for ngrok tunnel to establish...${NC}"
sleep 5

# Display access information
echo ""
echo -e "${GREEN}🎯 TrailTrack CRM is now live with Professional URLs:${NC}"
echo ""
echo -e "${GREEN}🌟 Professional Demo URL: https://${NGROK_DOMAIN}${NC}"
echo -e "${GREEN}📱 Share with Clients: https://${NGROK_DOMAIN}${NC}"
echo ""
echo -e "${BLUE}📊 Local Development URLs:${NC}"
echo -e "${BLUE}   Frontend: http://localhost:$TRAIL_FRONTEND_PORT${NC}"
echo -e "${BLUE}   Backend:  http://localhost:$TRAIL_BACKEND_PORT${NC}"
echo -e "${BLUE}   API Docs: http://localhost:$TRAIL_BACKEND_PORT/docs${NC}"
echo ""
echo -e "${BLUE}🌐 ngrok Dashboard: http://localhost:4040${NC}"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"
echo ""

# Create demo info file for easy sharing
cat > /tmp/trailtrack-demo-info.txt << EOF
🎯 TrailTrack CRM - Professional Demo

Client Access URL: https://${NGROK_DOMAIN}
Demo Status: LIVE
Started: $(date)

Features to Demonstrate:
- Lead Management & Pipeline
- Contact Organization
- Activity Tracking
- Dashboard & Analytics
- Real-time Updates

Technical Details:
- Frontend: React + Vite + TypeScript
- Backend: FastAPI + Python
- Database: SQLite with SQLModel
- Deployment: Professional ngrok tunnel

Support: Available during demo session
EOF

echo -e "${GREEN}📋 Demo info saved to: /tmp/trailtrack-demo-info.txt${NC}"

# Keep script running and monitor services
while true; do
    sleep 30
    
    # Check if services are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process died - restarting...${NC}"
        cd backend
        source venv/bin/activate
        python3 main.py &
        BACKEND_PID=$!
        cd ..
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend process died - restarting...${NC}"
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..
    fi
    
        if ! kill -0 $NGROK_PID 2>/dev/null; then
        echo -e "${RED}❌ ngrok tunnel died - restarting...${NC}"
        ngrok http --domain=$NGROK_DOMAIN $TRAIL_FRONTEND_PORT --log=stdout > /tmp/ngrok-trailtrack.log &
        NGROK_PID=$!
    fi
done

# Cleanup on exit
cleanup
