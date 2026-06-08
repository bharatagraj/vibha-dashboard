// backend/common/src/page_settings.rs
// Day 5 Task — PageSettings: per-user, per-page confidence thresholds from DB
// COPY TO: /mnt/c/vibha-dashboard/backend/common/src/page_settings.rs

use serde::{Deserialize, Serialize};

// ─────────────────────────────────────────────────────────────────────────────
// PageSettings — loaded from `page_settings` PostgreSQL table
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageSettings {
    pub page_id: String,
    pub org_id: String,
    pub domain: String,
    /// Override confidence_profile: "strict" | "moderate" | "permissive"
    /// If None, domain default is used.
    pub confidence_profile: Option<String>,
    /// Whether to auto-execute queries that pass the Execute threshold
    pub auto_execute: bool,
    /// Maximum rows returned for this page
    pub max_rows: u32,
    /// Comma-separated list of tables this page is allowed to query
    pub allowed_tables: Vec<String>,
}

impl PageSettings {
    /// Default settings when no DB record exists
    pub fn default_for(page_id: &str, org_id: &str, domain: &str) -> Self {
        Self {
            page_id: page_id.to_string(),
            org_id: org_id.to_string(),
            domain: domain.to_string(),
            confidence_profile: None, // use domain default
            auto_execute: false,
            max_rows: 1000,
            allowed_tables: vec![],
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL migration — run once against PostgreSQL 18
// ─────────────────────────────────────────────────────────────────────────────
//
// CREATE TABLE IF NOT EXISTS page_settings (
//     page_id            TEXT        NOT NULL,
//     org_id             TEXT        NOT NULL,
//     domain             TEXT        NOT NULL DEFAULT 'default',
//     confidence_profile TEXT,                         -- strict | moderate | permissive
//     auto_execute       BOOLEAN     NOT NULL DEFAULT FALSE,
//     max_rows           INTEGER     NOT NULL DEFAULT 1000,
//     allowed_tables     TEXT[]      NOT NULL DEFAULT '{}',
//     created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
//     updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
//     PRIMARY KEY (page_id, org_id)
// );
//
// -- Enable RLS (multi-tenant isolation)
// ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;
// CREATE POLICY page_settings_org_isolation ON page_settings
//     USING (org_id = current_setting('app.current_org_id'));

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_page_settings() {
        let s = PageSettings::default_for("page-1", "org-abc", "greenops");
        assert_eq!(s.domain, "greenops");
        assert_eq!(s.max_rows, 1000);
        assert!(!s.auto_execute);
        assert!(s.confidence_profile.is_none());
    }

    #[test]
    fn test_page_settings_serialization() {
        let s = PageSettings {
            page_id: "pg-1".to_string(),
            org_id: "org-1".to_string(),
            domain: "healthcare".to_string(),
            confidence_profile: Some("strict".to_string()),
            auto_execute: false,
            max_rows: 500,
            allowed_tables: vec!["patients".to_string(), "encounters".to_string()],
        };

        let json = serde_json::to_string(&s).expect("serialize");
        let back: PageSettings = serde_json::from_str(&json).expect("deserialize");
        assert_eq!(back.page_id, "pg-1");
        assert_eq!(back.allowed_tables.len(), 2);
    }
}
