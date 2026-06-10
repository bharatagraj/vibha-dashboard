-- Day 9 Missing Migration: Analytics Scopes + Sample Data
-- Created: 2026-06-11
-- Purpose: Enable Query Executor to parse scopes and execute multi-domain queries

-- ============================================================================
-- 1. Analytics Scopes Table (MDM-ready, from ADR-004)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard.analytics_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_name VARCHAR(255) NOT NULL,
    scope_type VARCHAR(100) NOT NULL,
    description TEXT,
    query_definition JSONB NOT NULL,
    mdm_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_scopes_name ON dashboard.analytics_scopes(scope_name);
CREATE INDEX idx_analytics_scopes_type ON dashboard.analytics_scopes(scope_type);

-- ============================================================================
-- 2. Emissions Table (Scope 1: Direct Emissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard.emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    facility_id UUID,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    source VARCHAR(100),
    co2e NUMERIC(12, 4) NOT NULL,
    embedded_co2e NUMERIC(12, 4),
    usage_co2e NUMERIC(12, 4),
    unit VARCHAR(50),
    scope_category VARCHAR(10),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emissions_date ON dashboard.emissions(date DESC);
CREATE INDEX idx_emissions_category ON dashboard.emissions(category);
CREATE INDEX idx_emissions_org ON dashboard.emissions(organization_id);

-- ============================================================================
-- 3. Sales Table (Testing fallback, non-sustainability domain)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    region VARCHAR(100),
    product_category VARCHAR(100),
    date DATE NOT NULL,
    revenue NUMERIC(15, 2) NOT NULL,
    units_sold INTEGER,
    margin_percent NUMERIC(5, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_date ON dashboard.sales(date DESC);
CREATE INDEX idx_sales_region ON dashboard.sales(region);
CREATE INDEX idx_sales_org ON dashboard.sales(organization_id);

-- ============================================================================
-- 4. Sample Analytics Scopes (Scope 1, 2, 3 definitions)
-- ============================================================================

-- Scope 1: Direct Emissions (greenops domain, emissions table)
INSERT INTO dashboard.analytics_scopes (scope_name, scope_type, description, query_definition, mdm_enabled)
VALUES (
    'Scope 1: Direct Emissions',
    'sustainability',
    'Direct greenhouse gas emissions from facilities and operations under organizational control',
    jsonb_build_object(
        'name', 'Scope 1: Direct Emissions',
        'mdm_context', jsonb_build_object(
            'primary_entity', 'organization',
            'hierarchy_level', 'global'
        ),
        'sources', jsonb_build_array(
            jsonb_build_object(
                'domain', 'greenops',
                'table', 'emissions',
                'mdm_entity_key', 'organization_id',
                'scope_category', '1'
            )
        ),
        'joins', jsonb_build_array()
    ),
    FALSE
) ON CONFLICT DO NOTHING;

-- Scope 2: Indirect Emissions - Energy (greenops domain, same emissions table)
INSERT INTO dashboard.analytics_scopes (scope_name, scope_type, description, query_definition, mdm_enabled)
VALUES (
    'Scope 2: Energy Emissions',
    'sustainability',
    'Indirect greenhouse gas emissions from purchased electricity, steam, heating, and cooling',
    jsonb_build_object(
        'name', 'Scope 2: Energy Emissions',
        'mdm_context', jsonb_build_object(
            'primary_entity', 'organization',
            'hierarchy_level', 'global'
        ),
        'sources', jsonb_build_array(
            jsonb_build_object(
                'domain', 'greenops',
                'table', 'emissions',
                'mdm_entity_key', 'organization_id',
                'scope_category', '2'
            )
        ),
        'joins', jsonb_build_array()
    ),
    FALSE
) ON CONFLICT DO NOTHING;

-- Scope 3: Indirect Emissions - Supply Chain (multi-domain, currently greenops only, ready for suppliers/logistics)
INSERT INTO dashboard.analytics_scopes (scope_name, scope_type, description, query_definition, mdm_enabled)
VALUES (
    'Scope 3: Supply Chain Emissions',
    'sustainability',
    'Indirect greenhouse gas emissions across the value chain including suppliers, logistics, and products',
    jsonb_build_object(
        'name', 'Scope 3: Supply Chain Emissions',
        'mdm_context', jsonb_build_object(
            'primary_entity', 'organization',
            'hierarchy_level', 'global',
            'note', 'Ready for multi-domain: suppliers, logistics, products in Phase 2'
        ),
        'sources', jsonb_build_array(
            jsonb_build_object(
                'domain', 'greenops',
                'table', 'emissions',
                'mdm_entity_key', 'organization_id',
                'scope_category', '3.1'
            )
        ),
        'joins', jsonb_build_array()
    ),
    FALSE
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. Sample Emissions Data (20 rows for Scope 1 testing)
-- ============================================================================

INSERT INTO dashboard.emissions (organization_id, facility_id, date, category, source, co2e, embedded_co2e, usage_co2e, unit, scope_category)
VALUES
-- June 2026 data for Facility A (Manufacturing)
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '2026-06-01', 'Manufacturing', 'Natural Gas', 125.50, 12.30, 5.20, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '2026-06-02', 'Manufacturing', 'Natural Gas', 128.75, 13.10, 5.50, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '2026-06-03', 'Manufacturing', 'Diesel', 89.20, 8.50, 3.20, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '2026-06-04', 'Manufacturing', 'Natural Gas', 132.10, 14.20, 5.80, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '2026-06-05', 'Manufacturing', 'Natural Gas', 130.40, 13.80, 5.60, 'kg CO2e', '1'),

-- June 2026 data for Facility B (Office)
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '2026-06-01', 'Office', 'Natural Gas', 45.30, 4.20, 2.10, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '2026-06-02', 'Office', 'Natural Gas', 47.60, 4.50, 2.30, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '2026-06-03', 'Office', 'Natural Gas', 46.20, 4.35, 2.20, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '2026-06-04', 'Office', 'Natural Gas', 48.90, 4.70, 2.40, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '2026-06-05', 'Office', 'Natural Gas', 47.10, 4.55, 2.25, 'kg CO2e', '1'),

-- June 2026 data for Facility C (Warehouse)
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '2026-06-01', 'Warehouse', 'Diesel', 156.80, 15.40, 7.80, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '2026-06-02', 'Warehouse', 'Diesel', 158.20, 15.60, 7.95, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '2026-06-03', 'Warehouse', 'Diesel', 160.10, 15.90, 8.10, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '2026-06-04', 'Warehouse', 'Diesel', 162.50, 16.20, 8.30, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '2026-06-05', 'Warehouse', 'Diesel', 159.70, 15.80, 8.00, 'kg CO2e', '1'),

-- May 2026 data (historical for trending)
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '2026-05-28', 'Manufacturing', 'Natural Gas', 120.30, 11.80, 5.00, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '2026-05-29', 'Manufacturing', 'Natural Gas', 122.80, 12.10, 5.15, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '2026-05-28', 'Office', 'Natural Gas', 44.50, 4.10, 2.05, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '2026-05-29', 'Office', 'Natural Gas', 45.80, 4.25, 2.15, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '2026-05-28', 'Warehouse', 'Diesel', 155.40, 15.20, 7.70, 'kg CO2e', '1'),
('550e8400-e29b-41d4-a716-446655440000'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '2026-05-29', 'Warehouse', 'Diesel', 157.60, 15.50, 7.85, 'kg CO2e', '1')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. Sample Sales Data (10 rows for non-sustainability testing)
-- ============================================================================

INSERT INTO dashboard.sales (organization_id, region, product_category, date, revenue, units_sold, margin_percent)
VALUES
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'North America', 'Electronics', '2026-06-01', 45000.00, 150, 32.50),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'North America', 'Software', '2026-06-01', 28000.00, 40, 72.00),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Europe', 'Electronics', '2026-06-01', 38000.00, 120, 31.00),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Europe', 'Software', '2026-06-01', 22000.00, 32, 70.00),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Asia-Pacific', 'Electronics', '2026-06-01', 52000.00, 180, 34.00),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Asia-Pacific', 'Software', '2026-06-01', 31000.00, 45, 73.00),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'North America', 'Electronics', '2026-06-02', 48000.00, 160, 33.00),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'North America', 'Software', '2026-06-02', 29000.00, 42, 71.50),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Europe', 'Electronics', '2026-06-02', 40000.00, 130, 31.50),
('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Europe', 'Software', '2026-06-02', 23500.00, 34, 71.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. Grant permissions to vibha user
-- ============================================================================

GRANT ALL PRIVILEGES ON TABLE dashboard.analytics_scopes TO vibha;
GRANT ALL PRIVILEGES ON TABLE dashboard.emissions TO vibha;
GRANT ALL PRIVILEGES ON TABLE dashboard.sales TO vibha;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA dashboard TO vibha;

-- Verify data was inserted
SELECT 'Analytics Scopes created:' as check_1, COUNT(*) FROM dashboard.analytics_scopes;
SELECT 'Emissions data rows:' as check_2, COUNT(*) FROM dashboard.emissions;
SELECT 'Sales data rows:' as check_3, COUNT(*) FROM dashboard.sales;
