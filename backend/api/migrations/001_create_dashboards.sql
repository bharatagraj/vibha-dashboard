-- Create dashboards table
CREATE TABLE IF NOT EXISTS dashboard.dashboards (
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
    created_by VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE
);

-- Create index on domain/table for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboards_domain_table ON dashboard.dashboards(domain, table_name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboard.dashboards(created_at DESC);
