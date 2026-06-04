-- Vibha Dashboard Platform — Initial Schema
-- Created: 2026-06-04

-- Create dedicated schema for Dashboard
CREATE SCHEMA IF NOT EXISTS dashboard;

-- All tables in dashboard schema (NOT public)
CREATE TABLE IF NOT EXISTS dashboard.dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL,
    data_source VARCHAR(255) NOT NULL,
    metrics JSONB DEFAULT '[]'::jsonb,
    dimensions JSONB DEFAULT '[]'::jsonb,
    filters JSONB DEFAULT '[]'::jsonb,
    vega_lite_spec JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dashboard_ids JSONB DEFAULT '[]'::jsonb,
    layout VARCHAR(50) DEFAULT '2x2',
    filters JSONB DEFAULT '[]'::jsonb,
    ai_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES dashboard.pages(id),
    user_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    filter_context JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES dashboard.questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    confidence NUMERIC(3, 2),
    sources JSONB DEFAULT '[]'::jsonb,
    processing_time_ms INTEGER,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    filter_state JSONB,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard.exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    page_id UUID REFERENCES dashboard.pages(id),
    export_format VARCHAR(10) NOT NULL,
    filter_state JSONB,
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_page_id ON dashboard.questions(page_id);
CREATE INDEX idx_questions_user_id ON dashboard.questions(user_id);
CREATE INDEX idx_answers_question_id ON dashboard.answers(question_id);
CREATE INDEX idx_audit_trail_user_id ON dashboard.audit_trail(user_id);
CREATE INDEX idx_exports_user_id ON dashboard.exports(user_id);

-- Grant permissions to vibha user
GRANT USAGE ON SCHEMA dashboard TO vibha;
GRANT CREATE ON SCHEMA dashboard TO vibha;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dashboard TO vibha;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dashboard TO vibha;
