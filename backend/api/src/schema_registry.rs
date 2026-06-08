use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing::info;

/// Column metadata from schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnMetadata {
    pub name: String,
    pub r#type: String, // 'type' is a Rust keyword, use raw identifier
    pub nullable: bool,
    pub indexed: bool,
}

/// Full schema response
#[derive(Debug, Serialize, Deserialize)]
pub struct SchemaResponse {
    pub table: String,
    pub domain: String,
    pub columns: Vec<ColumnMetadata>,
}

/// Mock schema data for development
fn get_mock_schema(domain: &str, table: &str) -> Option<SchemaResponse> {
    match (domain, table) {
        ("greenops", "emissions") => Some(SchemaResponse {
            table: "emissions".to_string(),
            domain: "greenops".to_string(),
            columns: vec![
                ColumnMetadata {
                    name: "category".to_string(),
                    r#type: "string".to_string(),
                    nullable: false,
                    indexed: true,
                },
                ColumnMetadata {
                    name: "co2e".to_string(),
                    r#type: "float".to_string(),
                    nullable: false,
                    indexed: false,
                },
                ColumnMetadata {
                    name: "embedded_co2e".to_string(),
                    r#type: "float".to_string(),
                    nullable: true,
                    indexed: false,
                },
                ColumnMetadata {
                    name: "usage_co2e".to_string(),
                    r#type: "float".to_string(),
                    nullable: true,
                    indexed: false,
                },
                ColumnMetadata {
                    name: "date".to_string(),
                    r#type: "date".to_string(),
                    nullable: false,
                    indexed: true,
                },
            ],
        }),
        ("greenops", "sales") => Some(SchemaResponse {
            table: "sales".to_string(),
            domain: "greenops".to_string(),
            columns: vec![
                ColumnMetadata {
                    name: "region".to_string(),
                    r#type: "string".to_string(),
                    nullable: false,
                    indexed: true,
                },
                ColumnMetadata {
                    name: "revenue".to_string(),
                    r#type: "float".to_string(),
                    nullable: false,
                    indexed: false,
                },
                ColumnMetadata {
                    name: "order_count".to_string(),
                    r#type: "integer".to_string(),
                    nullable: false,
                    indexed: false,
                },
                ColumnMetadata {
                    name: "avg_order_value".to_string(),
                    r#type: "float".to_string(),
                    nullable: true,
                    indexed: false,
                },
                ColumnMetadata {
                    name: "date".to_string(),
                    r#type: "date".to_string(),
                    nullable: false,
                    indexed: true,
                },
            ],
        }),
        _ => None,
    }
}

/// Handler: GET /api/v1/schema/{domain}/{table}
pub async fn get_schema(
    axum::extract::Path((domain, table)): axum::extract::Path<(String, String)>,
) -> (StatusCode, Json<serde_json::Value>) {
    info!(
        "📋 Schema request: domain={}, table={}",
        domain, table
    );

    match get_mock_schema(&domain, &table) {
        Some(schema) => {
            info!("✅ Schema found: {} columns", schema.columns.len());
            (
                StatusCode::OK,
                Json(serde_json::to_value(schema).unwrap_or(json!({}))),
            )
        }
        None => {
            info!("❌ Schema not found: domain={}, table={}", domain, table);
            (
                StatusCode::NOT_FOUND,
                Json(json!({
                    "error": format!("Schema not found for {}.{}", domain, table)
                })),
            )
        }
    }
}
