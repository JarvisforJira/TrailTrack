# TrailTrack CRM

A lightweight CRM designed for solo founders, small teams (1–20 seats), and agencies/consultants managing leads through to clients.

## 🎯 Overview

TrailTrack CRM provides one centralized place to:
- Capture organizations and people (contacts)
- Log communications (emails, calls, meetings, notes) and files
- Move leads through a clear pipeline until sale
- Produce basic dashboards & reminders

## 🛠 Tech Stack

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python 3.11
- **Database**: SQLite with SQLModel/SQLAlchemy
- **Runtime**: Node 20

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node 20+
- Git
- ngrok (optional, for public access)

### Automated Setup (Recommended)

1. **Clone and navigate to project**
   ```bash
   cd TrailTrack-CRM
   ```

2. **Start with Local Access**
   ```bash
   ./start-trailtrack.sh
   ```

3. **Start with Public Access (ngrok)**
   ```bash
   ./start-with-ngrok.sh
   ```

4. **Check ngrok Status**
   ```bash
   ./check-ngrok-status.sh
   ```

### Manual Development Setup

1. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python3 main.py
   ```

3. **Frontend Setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Access Points

**Local Development:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

**Public Access (with ngrok):**
- Run `./check-ngrok-status.sh` to get public URLs
- ngrok Web Interface: http://localhost:4040

### Startup Scripts

- `start-trailtrack.sh` - Local development (no public access)
- `start-with-ngrok.sh` - Public tunnels for demos and remote access
- `check-ngrok-status.sh` - View current ngrok tunnel URLs
- `setup.sh` - Install dependencies for both frontend and backend

## 📁 Project Structure

```
TrailTrack-CRM/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # FastAPI app entry
│   │   ├── core/        # Config, security, database
│   │   ├── models/      # SQLModel classes
│   │   ├── api/         # API endpoints
│   │   └── schemas/     # Pydantic schemas
│   ├── requirements.txt
│   └── alembic/         # Database migrations
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API calls
│   │   └── types/       # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml    # Docker setup
└── README.md
```

## 🔑 Core Features

### MVP Features
- ✅ **Authentication**: JWT-based with user roles
- ✅ **Pipeline Management**: Kanban-style lead tracking
- ✅ **Contact Management**: Accounts and contacts with relationships
- ✅ **Activity Logging**: Calls, emails, meetings, notes, SMS
- ✅ **Task Management**: Reminders and follow-ups
- ✅ **File Attachments**: Local file storage with basic validation
- ✅ **Dashboard**: Today view with priorities and overdue items
- ✅ **Basic Reports**: Pipeline summary and win/loss analysis

### Pipeline Stages
- **New** → **Qualified** → **Proposal** → **Negotiation** → **Closed-Won/Lost**

### User Roles
- **Admin**: Full access to all records and settings
- **Standard User**: View all, edit own records
- **Read-Only**: View-only access

## 🎯 Success Metrics

- Time-to-first-entry < 60 seconds from app load to new lead saved
- 90% of interactions logged via one-click "Quick Log" path  
- Pipeline view loads < 1.5s for 500 leads
- 0 data-loss incidents during first 3 months

## 🚢 Deployment

### Docker Deployment (Recommended)

```bash
docker-compose up -d
```

This sets up:
- Nginx serving the React frontend
- FastAPI backend with Uvicorn
- SQLite database with mounted volume
- File storage with mounted volume

### Manual Deployment

See `docs/deployment.md` for detailed manual deployment instructions.

## 📋 Development Workflow

This project uses Taskmaster for task management. Key commands:

```bash
# View current tasks
task-master list

# Show next task to work on
task-master next

# View specific task details
task-master show <task-id>

# Mark task as complete
task-master set-status --id=<task-id> --status=done
```

## 🛣 Roadmap

### Phase 1 (MVP) - 6-8 weeks
- Core CRUD operations
- Authentication & authorization
- Kanban pipeline
- Basic activity logging
- File attachments
- Responsive design

### Phase 2 (Post-MVP)
- Email integration (IMAP/OAuth)
- Calendar sync (CalDAV/Google)
- Advanced reporting & analytics
- Mobile app (React Native)
- API webhooks
- Third-party integrations

## 📝 License

Private project - All rights reserved.

## 👥 Team

- **Owner**: Betsy Pitts
- **Development**: [Team members]

---

For detailed technical specifications, see the [Product Requirements Document](trailtrack-prd.md).
