-- Fix dashboards table schema to match Day 9 design
-- Drop old table and recreate with correct columns

DROP TABLE IF EXISTS dashboard.dashboards CASCADE;

CREATE TABLE dashboard.dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
    filters JSONB NOT NULL DEFAULT '[]'::jsonb,
    charts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'system',
    is_public BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_dashboards_domain_table ON dashboard.dashboards(domain, table_name);
CREATE INDEX idx_dashboards_created_at ON dashboard.dashboards(created_at DESC);
CREATE INDEX idx_dashboards_user ON dashboard.dashboards(user_id);

GRANT ALL PRIVILEGES ON TABLE dashboard.dashboards TO vibha;
