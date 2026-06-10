use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing::info;

/// Column metadata from schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnMetadata {
    pub name: String,
    pub r#type: String,
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

/// Handler: GET /api/v1/schemas/tables - List all available tables
pub async fn list_tables(
    axum::extract::State(state): axum::extract::State<crate::AppState>,
) -> (StatusCode, Json<serde_json::Value>) {
    info!("📋 Listing all tables in dashboard schema");

    let result = sqlx::query_scalar::<_, String>(
        "SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'dashboard' AND table_type = 'BASE TABLE'
         ORDER BY table_name"
    )
    .fetch_all(&state.db_pool)
    .await;

    match result {
        Ok(tables) => {
            info!("✅ Found {} tables", tables.len());
            (
                StatusCode::OK,
                Json(json!({"tables": tables})),
            )
        }
        Err(e) => {
            info!("❌ Error listing tables: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to list tables"})),
            )
        }
    }
}

/// Handler: GET /api/v1/schema/{domain}/{table} - Get real schema from database
pub async fn get_schema(
    axum::extract::State(state): axum::extract::State<crate::AppState>,
    axum::extract::Path((domain, table)): axum::extract::Path<(String, String)>,
) -> (StatusCode, Json<serde_json::Value>) {
    info!(
        "📋 Schema request: domain={}, table={}",
        domain, table
    );

    let result = sqlx::query_as::<_, (String, String, bool)>(
        "SELECT column_name, data_type, is_nullable = 'YES' as nullable
         FROM information_schema.columns
         WHERE table_schema = 'dashboard' AND table_name = $1
         ORDER BY ordinal_position"
    )
    .bind(&table)
    .fetch_all(&state.db_pool)
    .await;

    match result {
        Ok(columns) => {
            if columns.is_empty() {
                info!("❌ Table not found: {}", table);
                return (
                    StatusCode::NOT_FOUND,
                    Json(json!({"error": format!("Table {} not found", table)})),
                );
            }

            let column_metadata: Vec<ColumnMetadata> = columns
                .into_iter()
                .map(|(name, col_type, nullable)| ColumnMetadata {
                    name,
                    r#type: col_type,
                    nullable,
                    indexed: false,
                })
                .collect();

            let schema = SchemaResponse {
                table,
                domain,
                columns: column_metadata,
            };

            info!("✅ Schema found: {} columns", schema.columns.len());
            (
                StatusCode::OK,
                Json(serde_json::to_value(schema).unwrap_or(json!({}))),
            )
        }
        Err(e) => {
            info!("❌ Error querying schema: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to retrieve schema"})),
            )
        }
    }
}
