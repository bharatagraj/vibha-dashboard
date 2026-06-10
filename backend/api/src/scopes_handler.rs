use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use tracing::info;
use uuid::Uuid;

/// Analytics Scope response
#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyticsScope {
    pub id: String,
    pub scope_name: String,
    pub scope_type: String,
    pub description: Option<String>,
    pub query_definition: serde_json::Value,
    pub mdm_enabled: bool,
}

/// Handler: GET /api/v1/scopes - List all analytics scopes
pub async fn list_scopes(
    axum::extract::State(state): axum::extract::State<crate::AppState>,
) -> (StatusCode, Json<serde_json::Value>) {
    info!("📊 Listing all analytics scopes");

    let result = sqlx::query_as::<_, (String, String, String, Option<String>, serde_json::Value, bool)>(
        "SELECT id::text, scope_name, scope_type, description, query_definition, mdm_enabled
         FROM dashboard.analytics_scopes
         ORDER BY created_at DESC"
    )
    .fetch_all(&state.db_pool)
    .await;

    match result {
        Ok(rows) => {
            let scopes: Vec<AnalyticsScope> = rows
                .into_iter()
                .map(|(id, scope_name, scope_type, description, query_definition, mdm_enabled)| {
                    AnalyticsScope {
                        id,
                        scope_name,
                        scope_type,
                        description,
                        query_definition,
                        mdm_enabled,
                    }
                })
                .collect();

            info!("✅ Found {} scopes", scopes.len());
            (
                StatusCode::OK,
                Json(json!({"scopes": scopes})),
            )
        }
        Err(e) => {
            info!("❌ Error listing scopes: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to list scopes"})),
            )
        }
    }
}

/// Handler: GET /api/v1/scopes/:id - Get specific scope
pub async fn get_scope(
    axum::extract::State(state): axum::extract::State<crate::AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> (StatusCode, Json<serde_json::Value>) {
    info!("📊 Fetching scope: {}", id);

    let result = sqlx::query_as::<_, (String, String, String, Option<String>, serde_json::Value, bool)>(
        "SELECT id::text, scope_name, scope_type, description, query_definition, mdm_enabled
         FROM dashboard.analytics_scopes
         WHERE id = $1"
    )
    .bind(id.parse::<Uuid>().unwrap_or_else(|_| Uuid::nil()))
    .fetch_optional(&state.db_pool)
    .await;

    match result {
        Ok(Some((id, scope_name, scope_type, description, query_definition, mdm_enabled))) => {
            let scope = AnalyticsScope {
                id,
                scope_name,
                scope_type,
                description,
                query_definition,
                mdm_enabled,
            };
            info!("✅ Scope found: {}", scope.scope_name);
            (StatusCode::OK, Json(serde_json::to_value(scope).unwrap_or(json!({}))))
        }
        Ok(None) => {
            info!("❌ Scope not found: {}", id);
            (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Scope not found"})),
            )
        }
        Err(e) => {
            info!("❌ Error fetching scope: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Failed to fetch scope"})),
            )
        }
    }
}
