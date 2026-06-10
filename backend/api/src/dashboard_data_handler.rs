/// Hour 2: Dashboard Data Endpoint Handler

use axum::extract::{State, Path};
use serde_json::Value;
use sqlx::Row;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct DashboardDataResponse {
    pub id: String,
    pub name: String,
    pub scope_name: String,
    pub data: Vec<Value>,
    pub kpis: Vec<String>,
    pub summary: DashboardSummary,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct DashboardSummary {
    pub row_count: i32,
    pub execution_time_ms: i32,
    pub columns: Vec<String>,
}

pub async fn get_dashboard_data(
    State(state): State<crate::AppState>,
    Path(dashboard_id): Path<String>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<axum::Json<DashboardDataResponse>, (axum::http::StatusCode, String)> {
    use std::time::Instant;
    use uuid::Uuid;
    
    let start_time = Instant::now();
    let limit = params
        .get("limit")
        .and_then(|l| l.parse::<i32>().ok())
        .unwrap_or(100);

    println!("[dashboard_data] Loading dashboard: {}", dashboard_id);

    // Parse dashboard ID
    let dashboard_uuid = Uuid::parse_str(&dashboard_id)
        .map_err(|_| (axum::http::StatusCode::BAD_REQUEST, "Invalid dashboard ID".to_string()))?;

    // 1. Load dashboard from database
    let row = sqlx::query(
        "SELECT id, name, domain, table_name, kpis FROM dashboard.dashboards WHERE id = $1"
    )
    .bind(dashboard_uuid)
    .fetch_optional(&state.db_pool)
    .await
    .map_err(|e| (
        axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        format!("Database error: {}", e),
    ))?
    .ok_or((axum::http::StatusCode::NOT_FOUND, "Dashboard not found".to_string()))?;

    let dashboard_name: String = row.get("name");
    let domain: String = row.get("domain");
    let kpis_value: Value = row.get("kpis");

    println!("[dashboard_data] Dashboard: name={}, domain={}", dashboard_name, domain);

    // 2. Extract KPIs from dashboard
    let kpis: Vec<String> = kpis_value
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|kpi| {
            if let Value::Object(obj) = kpi {
                obj.get("name").and_then(|v| v.as_str()).map(|s| s.to_string())
            } else if let Value::String(s) = kpi {
                Some(s.clone())
            } else {
                None
            }
        })
        .collect();

    println!("[dashboard_data] KPIs: {:?}", kpis);

    if kpis.is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            "Dashboard has no KPIs configured".to_string(),
        ));
    }

    // 3. Find the scope for this dashboard's domain
    println!("[dashboard_data] Looking for scope matching: {}", domain);
    
    let scope_row = sqlx::query(
        "SELECT scope_name, query_definition FROM dashboard.analytics_scopes WHERE scope_name = $1"
    )
    .bind(&domain)
    .fetch_optional(&state.db_pool)
    .await
    .map_err(|e| (
        axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        format!("Scope lookup failed: {}", e),
    ))?
    .ok_or((
        axum::http::StatusCode::NOT_FOUND,
        format!("No scope found for domain '{}'", domain),
    ))?;

    let scope_name: String = scope_row.get("scope_name");
    let query_def: Value = scope_row.get("query_definition");

    println!("[dashboard_data] Found scope: {}", scope_name);
    println!("[dashboard_data] Query definition: {}", serde_json::to_string_pretty(&query_def).unwrap_or_default());

    // 4. Execute the scope query with dashboard's KPIs
    let data = crate::query_executor::execute_scope_query(
        &state.db_pool,
        &query_def,
        &kpis,
        limit,
    )
    .await
    .map_err(|e| (
        axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        format!("Query execution failed: {}", e),
    ))?;

    let row_count = data.len() as i32;
    let execution_time_ms = start_time.elapsed().as_millis() as i32;

    // 5. Build response
    let response = DashboardDataResponse {
        id: dashboard_id.clone(),
        name: dashboard_name,
        scope_name,
        data,
        kpis: kpis.clone(),
        summary: DashboardSummary {
            row_count,
            execution_time_ms,
            columns: kpis,
        },
    };

    println!(
        "[dashboard_data] ✓ Dashboard {} data: {} rows in {} ms",
        dashboard_id, row_count, execution_time_ms
    );

    Ok(axum::Json(response))
}
