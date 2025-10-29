-- Quiz Application Database Schema
-- PostgreSQL Database Schema for Quiz Application

-- Admin Configuration Table
CREATE TABLE IF NOT EXISTS admin_config (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Status Table
CREATE TABLE IF NOT EXISTS quiz_status (
    id SERIAL PRIMARY KEY,
    location VARCHAR(100) UNIQUE NOT NULL,
    is_open BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'single', 'multiple', 'truefalse', 'text'
    options JSONB, -- Array of options for MCQ questions
    correct_answer JSONB NOT NULL, -- String for single/truefalse, Array for multiple, String for text
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_question_type CHECK (question_type IN ('single', 'multiple', 'truefalse', 'text'))
);

-- Participants Table
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    sso VARCHAR(9) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    answers JSONB DEFAULT '{}', -- JSON object storing answers by question_id
    score INTEGER DEFAULT 0,
    submitted_at TIMESTAMP, -- NULL if not submitted yet
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sso, location),
    CONSTRAINT valid_sso CHECK (sso ~ '^\d{9}$'),
    CONSTRAINT valid_email CHECK (email ~ '^[a-zA-Z0-9._%+-]+@gevernova\.com$')
);

-- Global SSO Tracker Table (prevents one SSO from taking multiple location quizzes)
CREATE TABLE IF NOT EXISTS sso_tracker (
    sso VARCHAR(9) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    location VARCHAR(100) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_sso_tracker CHECK (sso ~ '^\d{9}$'),
    CONSTRAINT valid_email_tracker CHECK (email ~ '^[a-zA-Z0-9._%+-]+@gevernova\.com$')
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_location ON questions(location);
CREATE INDEX IF NOT EXISTS idx_participants_location ON participants(location);
CREATE INDEX IF NOT EXISTS idx_participants_sso ON participants(sso);
CREATE INDEX IF NOT EXISTS idx_participants_score ON participants(score DESC, submitted_at ASC);
CREATE INDEX IF NOT EXISTS idx_quiz_status_location ON quiz_status(location);

-- Insert default admin account (password: admin123)
INSERT INTO admin_config (username, password) 
VALUES ('admin', 'admin123') 
ON CONFLICT (username) DO NOTHING;

-- Insert default quiz locations
INSERT INTO quiz_status (location, is_open) VALUES 
    ('BLR', FALSE),
    ('HTC', FALSE),
    ('Noida', FALSE)
ON CONFLICT (location) DO NOTHING;
