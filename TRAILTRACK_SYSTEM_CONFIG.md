# TrailTrack CRM System Configuration

## Overview
TrailTrack CRM is a lightweight Customer Relationship Management system designed for solo founders and small teams. This document outlines the system configuration, deployment options, and technical specifications.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with Vite
- **Backend**: FastAPI (Python 3.11+)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Inline CSS (no external dependencies)

### Port Configuration
- **Frontend Development**: `http://localhost:3001`
- **Backend API**: `http://localhost:8001`
- **API Documentation**: `http://localhost:8001/docs`

## Environment Setup

### Prerequisites
- **Node.js**: Version 20 or higher
- **Python**: Version 3.11 or higher  
- **npm**: Latest version
- **ngrok**: For public tunnel access (optional)

### Environment Variables
Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=sqlite:///./crm.db

# JWT Configuration
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS Configuration
FRONTEND_URL=http://localhost:3001

# Application Settings
DEBUG=true
```

## Database Configuration

### SQLite Database
- **Location**: `./crm.db` (project root)
- **ORM**: SQLAlchemy with SQLModel
- **Migration**: Automatic table creation on startup

### Data Models
1. **Users** - Authentication and user management
2. **Accounts** - Company/organization records
3. **Contacts** - Individual person records
4. **Leads** - Sales opportunities
5. **Activities** - Communication history
6. **Tasks** - Action items and follow-ups

### Database Schema
```sql
-- Core tables are auto-created by SQLAlchemy
-- Relationships maintained through foreign keys
-- Audit fields (created_at, updated_at) on all entities
```

## API Configuration

### FastAPI Settings
```python
# CORS Middleware
origins = [
    "http://localhost:3001",  # Frontend
    "http://localhost:3000",  # Backup port
    # Add production URLs here
]

# Security
- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Request rate limiting (if needed)
```

### API Endpoints
- **Authentication**: `/auth/login`, `/auth/register`
- **Dashboard**: `/dashboard/stats`
- **Entities**: `/accounts`, `/contacts`, `/leads`, `/activities`, `/tasks`
- **Documentation**: `/docs` (Swagger UI)

## Frontend Configuration

### Vite Configuration
```javascript
// vite.config.js
export default {
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}
```

### React Router Setup
- **Dashboard**: `/` (default route)
- **Leads**: `/leads`
- **Accounts**: `/accounts` 
- **Contacts**: `/contacts`
- **Activities**: `/activities`
- **Tasks**: `/tasks`
- **Pipeline**: `/pipeline`

## Deployment Options

### 1. Local Development
```bash
# Option A: Manual startup
cd backend && source venv/bin/activate && python main.py &
cd frontend && npm run dev &

# Option B: Automated script
./start-trailtrack.sh
```

### 2. Public Access with ngrok
```bash
# Install ngrok first: https://ngrok.com/download
./start-with-ngrok.sh

# Provides public URLs for both frontend and backend
# Ideal for demos and remote access
```

### 3. Production Deployment
```bash
# Frontend build
cd frontend
npm run build

# Backend with gunicorn (recommended)
cd backend
pip install gunicorn
gunicorn main:app --host 0.0.0.0 --port 8001
```

## Security Configuration

### JWT Authentication
- **Algorithm**: HS256
- **Token Expiration**: 24 hours (configurable)
- **Secret Key**: Must be changed in production
- **Headers**: `Authorization: Bearer <token>`

### CORS Settings
- **Development**: Localhost ports allowed
- **Production**: Specific domain restrictions
- **Methods**: GET, POST, PATCH, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization

### Data Protection
- **Password Hashing**: bcrypt with salt
- **User Isolation**: All data filtered by owner_id
- **Input Validation**: Pydantic models
- **SQL Injection**: Protected by SQLAlchemy ORM

## Performance Configuration

### Database Optimization
- **Indexes**: Primary keys and foreign keys indexed
- **Queries**: Lazy loading for relationships
- **Connection**: SQLite WAL mode for better concurrency
- **Backup**: Regular database backup recommended

### Frontend Optimization
- **Code Splitting**: Vite handles automatically
- **Hot Module Replacement**: Enabled in development
- **Asset Optimization**: Automatic in production build
- **Caching**: Browser caching for static assets

## Monitoring and Logging

### Backend Logging
```python
# FastAPI automatic request logging
# Custom logging can be added for business logic
import logging
logging.basicConfig(level=logging.INFO)
```

### Error Handling
- **Frontend**: Try-catch blocks with user-friendly messages
- **Backend**: HTTPException with appropriate status codes
- **Database**: Rollback on errors, maintaining data integrity

### Health Checks
- **Backend**: `/docs` endpoint availability
- **Frontend**: React app responsiveness
- **Database**: SQLite file accessibility

## Scaling Considerations

### Horizontal Scaling
- **Database**: Consider PostgreSQL for multi-user scenarios
- **Backend**: Multiple FastAPI instances behind load balancer
- **Frontend**: CDN distribution for static assets

### Vertical Scaling
- **Memory**: Increase for larger datasets
- **CPU**: Multi-core processing for concurrent users
- **Storage**: SSD recommended for database performance

## Backup and Recovery

### Database Backup
```bash
# SQLite backup
cp crm.db crm_backup_$(date +%Y%m%d).db

# Automated backup script recommended
# Consider cloud storage for production
```

### Configuration Backup
- **.env file**: Store securely, exclude from git
- **SSL certificates**: If using HTTPS
- **Application code**: Version control with git

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in configuration
2. **CORS errors**: Update FRONTEND_URL in .env
3. **Database locked**: Close other SQLite connections
4. **JWT errors**: Check token expiration and secret key

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=true

# Frontend development tools
# React DevTools browser extension recommended
```

### Log Locations
- **Backend**: Console output (can redirect to file)
- **Frontend**: Browser developer console
- **ngrok**: `/tmp/ngrok-*.log` when using tunnel script

## Version Control

### Git Configuration
```bash
# Important files to track
git add *.py *.js *.jsx *.json *.md *.sh

# Files to ignore (.gitignore)
*.db
.env
__pycache__/
node_modules/
dist/
venv/
```

### Deployment Tags
```bash
# Tag releases for deployment
git tag -a v1.0.0 -m "Initial TrailTrack CRM release"
git push origin v1.0.0
```

## Support and Maintenance

### Regular Maintenance
- **Dependencies**: Update npm and pip packages monthly
- **Security**: Monitor for CVE notifications
- **Database**: Vacuum SQLite database periodically
- **Logs**: Rotate and clean up log files

### Updates and Patches
- **Backup**: Always backup before updates
- **Testing**: Test in development environment first
- **Rollback**: Keep previous version ready for rollback

---

*Last Updated: September 2025*
*Version: 1.0.0*
