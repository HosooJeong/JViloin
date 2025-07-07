# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting the Application
```bash
# Development mode (with nodemon auto-restart)
npm run dev

# Production mode
npm start
```

### Environment Setup
- Copy `.env` file and configure database credentials
- Ensure MySQL database `j_violin_db` exists with utf8mb4 charset
- Default admin credentials: username `admin`, password `adimin`

### Database Operations
- Database sync happens automatically on server start
- Models are defined in `/models/` with Sequelize ORM
- Admin user is auto-created on first run if doesn't exist

## Architecture Overview

### Core Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: Multer middleware for image/video uploads
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)

### Application Structure

#### Backend API Architecture
- **Routes**: RESTful API endpoints in `/routes/` directory
  - `/api/auth` - Authentication (login, register, token verification)
  - `/api/users` - User management
  - `/api/schedules` - Class schedule management
  - `/api/posts` - Board/forum posts
  - `/api/media` - Gallery file uploads
  - `/api/reservations` - Class booking system
  - `/api/admin` - Admin dashboard and management

#### Database Models & Relationships
- **User**: Central user model with roles (student/teacher/admin)
- **Schedule**: Class schedules linked to teachers (Users)
- **Post**: Forum posts with author relationship
- **Media**: Gallery files with uploader tracking
- **Reservation**: Booking system linking users to schedules

Key relationships:
- User (teacher) → Schedule (one-to-many)
- User → Post (one-to-many as author)
- User → Media (one-to-many as uploader)
- User → Reservation (one-to-many)
- Schedule → Reservation (one-to-many)

#### Authentication System
- JWT-based authentication with role-based access control
- Middleware functions: `authenticateToken`, `requireAdmin`, `requireTeacher`, `requireOwnerOrAdmin`
- Three user roles: `student` (default), `teacher`, `admin`
- Passwords automatically hashed with bcrypt in model hooks

#### File Upload System
- Images: JPG, PNG, GIF, WebP (max 100MB)
- Videos: MP4, MPEG, QuickTime, AVI (max 100MB)
- Upload paths: `/uploads/images/` and `/uploads/videos/`
- Served statically via Express

### Frontend Architecture
- **Components**: Reusable JS modules in `/components/`
- **Pages**: HTML files in `/pages/` with admin subfolder
- **Static Assets**: CSS in `/css/`, JS in `/js/`
- **Navigation**: Component-based navigation system

## Development Guidelines

### Adding New Features
1. Create model in `/models/` if database changes needed
2. Add API routes in `/routes/`
3. Register routes in `server.js`
4. Add frontend components/pages as needed
5. Update model relationships in `/models/index.js`

### Database Changes
- Models use Sequelize with automatic sync on startup
- Relationships defined in `/models/index.js`
- Database config in `/config/database.js`
- Timezone set to Korean (+09:00)

### Security Considerations
- All passwords are bcrypt hashed automatically
- JWT tokens expire after 24 hours (configurable)
- Role-based middleware for API protection
- File upload type validation in place
- Sequelize prevents SQL injection

### Code Organization
- Korean language used in user-facing messages and comments
- Environment variables for all configuration
- Centralized error handling in server.js
- Static file serving for frontend and uploads