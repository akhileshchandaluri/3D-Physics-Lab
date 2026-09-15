-- V1__init_schema.sql: Initial PostgreSQL schema for Physim Virtual Lab

-- Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_agent VARCHAR(500),
    ip_address VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Saved Experiments Table
CREATE TABLE saved_experiments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    experiment_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    schema_version INT NOT NULL DEFAULT 1,
    state_data TEXT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_experiments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_experiments_user_deleted ON saved_experiments(user_id, is_deleted);
CREATE INDEX idx_saved_experiments_experiment_id ON saved_experiments(experiment_id);

-- Experiment Shares Table
CREATE TABLE experiment_shares (
    id VARCHAR(36) PRIMARY KEY,
    saved_experiment_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_experiment_shares_saved_exp FOREIGN KEY (saved_experiment_id) REFERENCES saved_experiments(id) ON DELETE CASCADE
);

CREATE INDEX idx_experiment_shares_saved_exp ON experiment_shares(saved_experiment_id);
CREATE INDEX idx_experiment_shares_expires_at ON experiment_shares(expires_at);

-- Classrooms Table
CREATE TABLE classrooms (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classrooms_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_classrooms_teacher_id ON classrooms(teacher_id);

-- Classroom Members Table
CREATE TABLE classroom_members (
    id VARCHAR(36) PRIMARY KEY,
    classroom_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_members_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_members_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_classroom_student UNIQUE (classroom_id, student_id)
);

CREATE INDEX idx_classroom_members_student ON classroom_members(student_id);

-- Assignments Table
CREATE TABLE assignments (
    id VARCHAR(36) PRIMARY KEY,
    classroom_id VARCHAR(36) NOT NULL,
    experiment_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    due_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignments_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

CREATE INDEX idx_assignments_classroom_id ON assignments(classroom_id);

-- Submissions Table
CREATE TABLE submissions (
    id VARCHAR(36) PRIMARY KEY,
    assignment_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    saved_experiment_id VARCHAR(36) NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_saved_exp FOREIGN KEY (saved_experiment_id) REFERENCES saved_experiments(id) ON DELETE CASCADE,
    CONSTRAINT uq_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE INDEX idx_submissions_student_id ON submissions(student_id);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(36),
    metadata TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
