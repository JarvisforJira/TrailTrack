#!/bin/bash

# TrailTrack CRM ngrok Status Checker
# This script checks the status of ngrok tunnels and displays URLs

echo "🔍 Checking TrailTrack CRM ngrok status..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok is running
if ! pgrep -f "ngrok http" > /dev/null; then
    echo -e "${RED}❌ ngrok is not running${NC}"
    echo "Start TrailTrack with ngrok: ./start-with-ngrok.sh"
    exit 1
fi

echo -e "${GREEN}✅ ngrok is running${NC}"
echo ""

# Check ngrok API
if curl -s http://localhost:4040/api/tunnels > /dev/null; then
    echo -e "${BLUE}📡 Active ngrok tunnels:${NC}"
    echo ""
    
    # Get tunnel information
    TUNNELS=$(curl -s http://localhost:4040/api/tunnels)
    
    # Extract and display backend URL
    BACKEND_URL=$(echo "$TUNNELS" | grep -o '"public_url":"https://[^"]*8001[^"]*"' | head -n1 | cut -d'"' -f4)
    if [ ! -z "$BACKEND_URL" ]; then
        echo -e "${GREEN}📡 Backend API: ${BACKEND_URL}${NC}"
        echo -e "${GREEN}📚 API Docs: ${BACKEND_URL}/docs${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend tunnel not found${NC}"
    fi
    
    # Extract and display frontend URL
    FRONTEND_URL=$(echo "$TUNNELS" | grep -o '"public_url":"https://[^"]*3001[^"]*"' | head -n1 | cut -d'"' -f4)
    if [ ! -z "$FRONTEND_URL" ]; then
        echo -e "${GREEN}🎨 Frontend App: ${FRONTEND_URL}${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend tunnel not found${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🌐 ngrok Web Interface: http://localhost:4040${NC}"
    echo ""
    echo -e "${BLUE}📊 Local URLs:${NC}"
    echo -e "${BLUE}   Frontend: http://localhost:3001${NC}"
    echo -e "${BLUE}   Backend:  http://localhost:8001${NC}"
    echo -e "${BLUE}   API Docs: http://localhost:8001/docs${NC}"
    
else
    echo -e "${RED}❌ ngrok API not accessible${NC}"
    echo "ngrok may be starting up or not properly configured"
fi

echo ""
echo -e "${YELLOW}💡 To stop ngrok, use Ctrl+C in the terminal running start-with-ngrok.sh${NC}"
