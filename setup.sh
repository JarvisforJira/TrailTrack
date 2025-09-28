#!/bin/bash

# TrailTrack CRM Setup Script
echo "🚀 Setting up TrailTrack CRM..."

# Check if we're in the right directory
if [ ! -f "tasks.json" ]; then
    echo "❌ Please run this script from the TrailTrack-CRM directory"
    exit 1
fi

# Backend setup
echo "📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend
npm install
cd ..

# Copy environment file
echo "⚙️ Setting up environment..."
cp env.example .env

echo "✅ Setup complete!"
echo ""
echo "🔧 To start development:"
echo "Terminal 1 (Backend): cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8001"
echo "Terminal 2 (Frontend): cd frontend && npm run dev -- --port 3001"
echo ""
echo "📍 Access your app:"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:8001"
echo "API Docs: http://localhost:8001/docs"
echo ""
echo "📋 Next steps:"
echo "task-master next  # See next task to work on"
