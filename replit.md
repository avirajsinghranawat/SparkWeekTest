# GE Vernova Product Quiz Application

## Overview
A Flask-based quiz application for GE Vernova product knowledge assessment. The app supports multiple locations (BLR, HTC, Noida) with admin controls for quiz management and participant tracking.

## Current State
- **Status**: Production-ready Flask application
- **Database**: PostgreSQL (Replit built-in)
- **Port**: 5000 (Frontend server)
- **Last Updated**: October 29, 2025

## Project Architecture

### Backend (Flask)
- **Framework**: Flask 3.0.0 with Flask-CORS
- **Database**: PostgreSQL with psycopg2-binary
- **Connection Pooling**: SimpleConnectionPool for efficient DB connections
- **Auto-initialization**: Database schema is automatically created on first run

### Database Schema
- `admin_config` - Admin authentication
- `quiz_status` - Quiz open/close status per location
- `questions` - Quiz questions with support for multiple types
- `participants` - Participant submissions and scores
- `sso_tracker` - Global SSO tracking to prevent duplicate attempts

### Frontend
- HTML templates served by Flask
- Static CSS and JavaScript files
- Pages: Home (`/`), Admin (`/admin`), Participant (`/participant`)

## Key Features

### Admin Panel
- Login system (default: admin/admin123)
- Quiz control (open/close per location)
- Question management (add/edit/delete)
- Real-time participant tracking and leaderboard
- Support for question types: single choice, multiple choice, true/false, text input

### Participant Features
- SSO validation (9 digits required)
- Email validation (@gevernova.com domain)
- Resume incomplete quizzes
- One attempt per SSO globally
- Instant score display after submission

### Scoring System
- Multiple choice: Points awarded per correct option selected
- Single choice: Full points for correct answer
- True/false: Full points for correct answer
- Text input: Full points for exact match
- Leaderboard sorted by: score (desc) → submission time (asc)

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `SECRET_KEY` - Flask session secret (auto-generated if not provided)

## Project Structure
```
/
├── app.py                 # Main Flask application
├── schema.sql            # Database schema
├── requirements.txt      # Python dependencies
├── templates/            # HTML templates
│   ├── index.html
│   ├── admin.html
│   └── participant.html
├── static/              # Static assets
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── admin.js
│       └── participant.js
└── data/                # Data directory
    └── README.md

## Recent Changes
- **2025-10-29**: Initial Replit setup completed
  - Installed Python 3.11 and dependencies
  - Configured PostgreSQL database
  - Database auto-initialization verified
  - Workflow configured for port 5000
  - Application ready for use

## Development Notes
- The app uses connection pooling for efficient database access
- Database is automatically initialized on first run if tables don't exist
- Default admin credentials should be changed in production
- All routes are properly secured with session-based authentication
```
