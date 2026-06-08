-- Phase 2 database schema

CREATE TABLE IF NOT EXISTS dashboard.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL,
  page_id uuid NOT NULL,
  question_text text NOT NULL,
  context jsonb NOT NULL,
  priority text DEFAULT 'NORMAL',
  correlation_id uuid,
  request_id text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT valid_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  CONSTRAINT question_text_not_empty CHECK (char_length(question_text) > 0),
  CONSTRAINT question_text_length CHECK (char_length(question_text) < 5000)
);

CREATE INDEX idx_questions_org_created ON dashboard.questions(org_id, created_at DESC);
CREATE INDEX idx_questions_user_created ON dashboard.questions(user_id, created_at DESC);
CREATE INDEX idx_questions_page ON dashboard.questions(page_id, created_at DESC);

CREATE TABLE IF NOT EXISTS dashboard.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES dashboard.questions(id) ON DELETE CASCADE,
  status text NOT NULL,
  processing_time_ms integer,
  filter_specification jsonb,
  result_set jsonb NOT NULL,
  confidence_score numeric(4,3),
  warnings jsonb,
  error_details text,
  model_used text DEFAULT 'mistral:7b-instruct-q8_0',
  agent_instance_id text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('SUCCESS', 'PARTIAL', 'ERROR', 'TIMEOUT', 'REJECTED')),
  CONSTRAINT confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_answers_question ON dashboard.answers(question_id);
CREATE INDEX idx_answers_confidence ON dashboard.answers(confidence_score DESC);
CREATE INDEX idx_answers_status ON dashboard.answers(status);
CREATE INDEX idx_answers_created ON dashboard.answers(created_at DESC);

CREATE TABLE IF NOT EXISTS dashboard.org_confidence_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  domain text NOT NULL,
  confidence_thresholds jsonb NOT NULL,
  profile text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp,
  updated_by uuid,
  CONSTRAINT valid_profile CHECK (profile IN ('strict', 'moderate', 'permissive', 'custom')),
  UNIQUE (org_id, domain)
);

CREATE INDEX idx_org_confidence_settings_org ON dashboard.org_confidence_settings(org_id);

CREATE TABLE IF NOT EXISTS dashboard.user_confidence_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain text NOT NULL,
  confidence_thresholds jsonb NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp,
  UNIQUE (user_id, domain)
);

CREATE INDEX idx_user_confidence_settings_user ON dashboard.user_confidence_settings(user_id);

CREATE TABLE IF NOT EXISTS dashboard.confidence_setting_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  user_id uuid,
  domain text NOT NULL,
  old_thresholds jsonb,
  new_thresholds jsonb,
  changed_at timestamp DEFAULT now(),
  changed_by uuid NOT NULL,
  ip_address text,
  reason text
);

CREATE INDEX idx_confidence_changes_org ON dashboard.confidence_setting_changes(org_id, changed_at DESC);
CREATE INDEX idx_confidence_changes_user ON dashboard.confidence_setting_changes(user_id, changed_at DESC);
