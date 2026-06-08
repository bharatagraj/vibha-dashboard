// backend/database/src/lib.rs
// Day 5 Hour 3 — PageSettings loader from PostgreSQL
// COPY TO: /mnt/c/vibha-dashboard/backend/database/src/lib.rs

use anyhow::Result;
use sqlx::{postgres::PgPoolOptions, PgPool};
use tracing::info;
use vibha_common::PageSettings;

// ─────────────────────────────────────────────────────────────────────────────
// Pool initialization
// ─────────────────────────────────────────────────────────────────────────────

/// Create a PostgreSQL connection pool.
/// Connection string format: postgresql://user:password@localhost:5434/vibha_dashboard
pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    info!("Creating PostgreSQL pool → {}", database_url);

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    info!("PostgreSQL pool ready");
    Ok(pool)
}

// ─────────────────────────────────────────────────────────────────────────────
// PageSettings loader
// ─────────────────────────────────────────────────────────────────────────────

/// Load PageSettings from the database by (page_id, org_id).
/// Falls back to domain defaults if no record exists.
pub async fn load_page_settings(
    pool: &PgPool,
    page_id: &str,
    org_id: &str,
    domain: &str,
) -> Result<PageSettings> {
    match sqlx::query_as::<_, (String, String, String, Option<String>, bool, i32, Vec<String>)>(
        r#"
        SELECT 
            page_id, org_id, domain, confidence_profile, 
            auto_execute, max_rows, allowed_tables
        FROM page_settings
        WHERE page_id = $1 AND org_id = $2
        "#,
    )
    .bind(page_id)
    .bind(org_id)
    .fetch_optional(pool)
    .await?
    {
        Some((p_id, o_id, d, profile, auto_exec, max_r, tables)) => {
            info!(
                "Loaded PageSettings [{}:{}] domain={} profile={:?}",
                p_id, o_id, d, profile
            );
            Ok(PageSettings {
                page_id: p_id,
                org_id: o_id,
                domain: d,
                confidence_profile: profile,
                auto_execute: auto_exec,
                max_rows: max_r as u32,
                allowed_tables: tables,
            })
        }
        None => {
            info!(
                "No PageSettings found for [{}:{}] — using domain defaults",
                page_id, org_id
            );
            Ok(PageSettings::default_for(page_id, org_id, domain))
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL migration (run once)
// ─────────────────────────────────────────────────────────────────────────────
//
// psql postgresql://user:password@localhost:5434/vibha_dashboard << 'EOF'
//
// CREATE TABLE IF NOT EXISTS page_settings (
//     page_id            TEXT        NOT NULL,
//     org_id             TEXT        NOT NULL,
//     domain             TEXT        NOT NULL DEFAULT 'default',
//     confidence_profile TEXT,
//     auto_execute       BOOLEAN     NOT NULL DEFAULT FALSE,
//     max_rows           INTEGER     NOT NULL DEFAULT 1000,
//     allowed_tables     TEXT[]      NOT NULL DEFAULT '{}',
//     created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
//     updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
//     PRIMARY KEY (page_id, org_id)
// );
//
// -- Enable row-level security for multi-tenant isolation
// ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;
// CREATE POLICY page_settings_org_isolation ON page_settings
//     USING (org_id = current_setting('app.current_org_id'));
//
// -- Seed test data
// INSERT INTO page_settings 
//     (page_id, org_id, domain, confidence_profile, auto_execute, max_rows, allowed_tables)
// VALUES
//     ('page-1', 'org-456', 'greenops', 'moderate', false, 500, ARRAY['emissions', 'facilities']),
//     ('page-2', 'org-456', 'healthcare', 'strict', false, 100, ARRAY['patients', 'encounters'])
// ON CONFLICT (page_id, org_id) DO NOTHING;
//
// EOF

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_page_settings() {
        let s = PageSettings::default_for("page-1", "org-456", "greenops");
        assert_eq!(s.domain, "greenops");
        assert_eq!(s.max_rows, 1000);
    }
}
