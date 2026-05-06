-- Database Initialization Script for LMS Middleware

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_progress (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    quest_id VARCHAR(100) NOT NULL,
    current_exercise_id VARCHAR(100) DEFAULT 'ex00',
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, TESTING, READY_FOR_AUDIT, WAITING_FOR_AUDIT, AUDITING, COMPLETED, FAILED
    last_results JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, quest_id)
);

CREATE TABLE IF NOT EXISTS exercise_progress (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    quest_id VARCHAR(100) NOT NULL,
    exercise_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PASSED',
    results JSONB,
    passed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, quest_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS audit_queue (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    quest_id VARCHAR(100) NOT NULL,
    exercise_id VARCHAR(100) NOT NULL DEFAULT 'ex01',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'WAITING', -- WAITING, MATCHED
    UNIQUE(username, quest_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS audits (
    id SERIAL PRIMARY KEY,
    auditee VARCHAR(255) NOT NULL,
    auditor VARCHAR(255) NOT NULL,
    quest_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PASSED, FAILED
    checklist_results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_points (
    username VARCHAR(255) PRIMARY KEY,
    points INTEGER DEFAULT 1,
    audits_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_sessions (
    id SERIAL PRIMARY KEY,
    auditee VARCHAR(255) NOT NULL,
    auditor VARCHAR(255) NOT NULL,
    quest_id VARCHAR(100) NOT NULL,
    exercise_id VARCHAR(100) NOT NULL DEFAULT 'ex01',
    repo_url TEXT,
    status VARCHAR(50) DEFAULT 'AUDITING',
    checklist_results JSONB,
    feedback TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    UNIQUE(auditee, auditor, quest_id, status)
);

CREATE TABLE IF NOT EXISTS audit_blocks (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    blocked_username VARCHAR(255) NOT NULL,
    reason VARCHAR(100) DEFAULT 'recent_audit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_quest ON student_progress(username, quest_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress ON exercise_progress(username, quest_id);
CREATE INDEX IF NOT EXISTS idx_audit_queue ON audit_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_queue_exercise ON audit_queue(quest_id, exercise_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_status ON audit_sessions(status);
CREATE INDEX IF NOT EXISTS idx_audit_blocks_users ON audit_blocks(username, blocked_username);
