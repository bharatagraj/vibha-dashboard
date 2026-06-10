use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{net::SocketAddr, sync::Arc};
use tokio::sync::RwLock;
use tracing::info;
use vibha_agents::question_handler::QuestionHandler;
use tower_http::cors::CorsLayer;
use uuid::Uuid;
use sqlx::Row;

mod schema_registry;
mod query_executor;
mod scopes_handler;

#[derive(Serialize, Deserialize, Debug)]
pub struct DirectQueryRequest {
    pub table: String,
    pub domain: String,
    pub columns: Vec<String>,
    #[serde(default)]
    pub group_by: Vec<String>,
    #[serde(default)]
    pub filters: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DirectQueryResponse {
    pub data: Vec<serde_json::Value>,
    pub kpi_values: serde_json::Value,
    pub execution_time_ms: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SaveDashboardRequest {
    pub name: String,
    pub domain: String,
    pub table: String,
    pub kpis: Vec<serde_json::Value>,
    pub filters: Vec<serde_json::Value>,
    pub charts: Vec<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SaveDashboardResponse {
    pub id: String,
    pub name: String,
    pub domain: String,
    pub table: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DashboardListItem {
    pub id: String,
    pub name: String,
    pub domain: String,
    pub table: String,
    pub created_at: String,
    pub kpi_count: i32,
    pub chart_count: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DashboardDetail {
    pub id: String,
    pub name: String,
    pub domain: String,
    pub table: String,
    pub kpis: serde_json::Value,
    pub filters: serde_json::Value,
    pub charts: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone)]
struct AppState {
    handler: Arc<RwLock<QuestionHandler>>,
    db_pool: sqlx::PgPool,
}

async fn health() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}

async fn direct_query(
    State(_state): State<AppState>,
    Json(req): Json<DirectQueryRequest>,
) -> impl IntoResponse {
    info!("📊 Direct query: table={}, domain={}", req.table, req.domain);
    let start = std::time::Instant::now();

    let data = match req.table.as_str() {
        "emissions" => vec![
            json!({ "category": "Electronics", "co2e": 350.0 }),
            json!({ "category": "Clothing", "co2e": 250.0 }),
            json!({ "category": "Food", "co2e": 200.0 }),
            json!({ "category": "Books", "co2e": 150.0 }),
            json!({ "category": "Other", "co2e": 50.0 }),
        ],
        "sales" => vec![
            json!({ "region": "North", "revenue": 45000.0 }),
            json!({ "region": "South", "revenue": 52000.0 }),
            json!({ "region": "East", "revenue": 38000.0 }),
            json!({ "region": "West", "revenue": 61000.0 }),
            json!({ "region": "Central", "revenue": 55000.0 }),
        ],
        _ => vec![
            json!({ "x": "A", "y": 100.0 }),
            json!({ "x": "B", "y": 150.0 }),
            json!({ "x": "C", "y": 120.0 }),
        ],
    };

    let kpi_values = if req.table == "emissions" {
        json!({
            "total_co2e": 1334.42,
            "embedded_co2e": 743.6,
            "usage_co2e": 590.82,
        })
    } else if req.table == "sales" {
        json!({
            "total_revenue": 125000.0,
            "order_count": 183,
            "avg_order_value": 683.06,
        })
    } else {
        json!({})
    };

    let execution_time = start.elapsed().as_millis() as u64;
    (
        StatusCode::OK,
        Json(DirectQueryResponse {
            data,
            kpi_values,
            execution_time_ms: execution_time,
        }),
    )
}

async fn save_dashboard(
    State(state): State<AppState>,
    Json(req): Json<SaveDashboardRequest>,
) -> impl IntoResponse {
    info!("💾 Saving dashboard: {}", req.name);
    let dashboard_id = Uuid::new_v4();

    let result = sqlx::query(
        "INSERT INTO dashboard.dashboards (id, name, domain, table_name, kpis, filters, charts, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
    )
    .bind(dashboard_id)
    .bind(&req.name)
    .bind(&req.domain)
    .bind(&req.table)
    .bind(serde_json::to_value(&req.kpis).unwrap_or(json!([])))
    .bind(serde_json::to_value(&req.filters).unwrap_or(json!([])))
    .bind(serde_json::to_value(&req.charts).unwrap_or(json!([])))
    .bind("system")
    .execute(&state.db_pool)
    .await;

    match result {
        Ok(_) => {
            info!("✅ Dashboard saved: {}", dashboard_id);
            (
                StatusCode::CREATED,
                Json(SaveDashboardResponse {
                    id: dashboard_id.to_string(),
                    name: req.name,
                    domain: req.domain,
                    table: req.table,
                    created_at: chrono::Utc::now().to_rfc3339(),
                }),
            )
        }
        Err(e) => {
            info!("❌ Failed to save dashboard: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(SaveDashboardResponse {
                    id: String::new(),
                    name: String::new(),
                    domain: String::new(),
                    table: String::new(),
                    created_at: String::new(),
                }),
            )
        }
    }
}

async fn list_dashboards(
    State(state): State<AppState>,
) -> impl IntoResponse {
    info!("📋 Listing all dashboards");

    let result = sqlx::query(
        "SELECT id, name, domain, table_name, created_at::text, 
                jsonb_array_length(kpis) as kpi_count,
                jsonb_array_length(charts) as chart_count
         FROM dashboard.dashboards
         ORDER BY created_at DESC"
    )
    .fetch_all(&state.db_pool)
    .await;

    match result {
        Ok(rows) => {
            let dashboards: Vec<DashboardListItem> = rows
                .into_iter()
                .map(|row| DashboardListItem {
                    id: row.get::<Uuid, _>("id").to_string(),
                    name: row.get("name"),
                    domain: row.get("domain"),
                    table: row.get("table_name"),
                    created_at: row.get("created_at"),
                    kpi_count: row.get("kpi_count"),
                    chart_count: row.get("chart_count"),
                })
                .collect();

            info!("✅ Found {} dashboards", dashboards.len());
            (StatusCode::OK, Json(dashboards))
        }
        Err(e) => {
            info!("❌ Error listing dashboards: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
        }
    }
}

async fn get_dashboard(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> impl IntoResponse {
    info!("📂 Loading dashboard: {}", id);

    let parsed_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(DashboardDetail {
            id: String::new(),
            name: String::new(),
            domain: String::new(),
            table: String::new(),
            kpis: json!({}),
            filters: json!({}),
            charts: json!({}),
            created_at: String::new(),
            updated_at: String::new(),
        }))
    };

    let result = sqlx::query(
        "SELECT id, name, domain, table_name, kpis, filters, charts, created_at::text, updated_at::text
         FROM dashboard.dashboards
         WHERE id = $1"
    )
    .bind(parsed_id)
    .fetch_optional(&state.db_pool)
    .await;

    match result {
        Ok(Some(row)) => {
            info!("✅ Dashboard loaded: {}", id);
            (StatusCode::OK, Json(DashboardDetail {
                id: row.get::<Uuid, _>("id").to_string(),
                name: row.get("name"),
                domain: row.get("domain"),
                table: row.get("table_name"),
                kpis: row.get("kpis"),
                filters: row.get("filters"),
                charts: row.get("charts"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }))
        }
        Ok(None) => {
            info!("❌ Dashboard not found: {}", id);
            (StatusCode::NOT_FOUND, Json(DashboardDetail {
                id: String::new(),
                name: String::new(),
                domain: String::new(),
                table: String::new(),
                kpis: json!({}),
                filters: json!({}),
                charts: json!({}),
                created_at: String::new(),
                updated_at: String::new(),
            }))
        }
        Err(e) => {
            info!("❌ Error loading dashboard: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(DashboardDetail {
                id: String::new(),
                name: String::new(),
                domain: String::new(),
                table: String::new(),
                kpis: json!({}),
                filters: json!({}),
                charts: json!({}),
                created_at: String::new(),
                updated_at: String::new(),
            }))
        }
    }
}

async fn update_dashboard(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(req): Json<SaveDashboardRequest>,
) -> impl IntoResponse {
    info!("📝 Updating dashboard: {}", id);
    
    let dashboard_id = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(SaveDashboardResponse {
                    id: String::new(),
                    name: String::new(),
                    domain: String::new(),
                    table: String::new(),
                    created_at: String::new(),
                }),
            ).into_response()
        }
    };

    let result = sqlx::query(
        "UPDATE dashboard.dashboards 
         SET name = $1, domain = $2, table_name = $3, kpis = $4, filters = $5, charts = $6, updated_at = NOW()
         WHERE id = $7"
    )
    .bind(&req.name)
    .bind(&req.domain)
    .bind(&req.table)
    .bind(serde_json::to_value(&req.kpis).unwrap_or(json!([])))
    .bind(serde_json::to_value(&req.filters).unwrap_or(json!([])))
    .bind(serde_json::to_value(&req.charts).unwrap_or(json!([])))
    .bind(dashboard_id)
    .execute(&state.db_pool)
    .await;

    match result {
        Ok(rows) => {
            if rows.rows_affected() == 0 {
                info!("⚠️  Dashboard not found: {}", id);
                return (
                    StatusCode::NOT_FOUND,
                    Json(SaveDashboardResponse {
                        id: String::new(),
                        name: String::new(),
                        domain: String::new(),
                        table: String::new(),
                        created_at: String::new(),
                    }),
                ).into_response()
            }
            info!("✅ Dashboard updated: {}", id);
            return (
                StatusCode::OK,
                Json(SaveDashboardResponse {
                    id,
                    name: req.name,
                    domain: req.domain,
                    table: req.table,
                    created_at: chrono::Utc::now().to_rfc3339(),
                }),
            ).into_response()
        }
        Err(e) => {
            info!("❌ Failed to update dashboard: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(SaveDashboardResponse {
                    id: String::new(),
                    name: String::new(),
                    domain: String::new(),
                    table: String::new(),
                    created_at: String::new(),
                }),
            ).into_response()
        }
    }
}


#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let domain = std::env::var("VIBHA_DOMAIN").unwrap_or("greenops".to_string());
    let port: u16 = std::env::var("PORT")
        .unwrap_or("8000".to_string())
        .parse()
        .unwrap_or(8000);
    let ollama_host = std::env::var("OLLAMA_HOST")
        .unwrap_or("http://localhost:11434".to_string());
    let ollama_model = std::env::var("OLLAMA_MODEL")
        .unwrap_or("mistral:7b-instruct-q8_0".to_string());
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or("postgres://vibha:vibha_dev_2024@localhost:5434/vibha".to_string());

    let handler = QuestionHandler::new(
        &domain,
        &ollama_host,
        &ollama_model,
        "",
        None,
    )
    .await
    .expect("Failed to initialize QuestionHandler");

    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    info!("✅ Connected to PostgreSQL");

    let state = AppState {
        handler: Arc::new(RwLock::new(handler)),
        db_pool,
    };

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/direct-query", post(direct_query))
        .route("/api/v1/schemas/tables", get(schema_registry::list_tables))
        .route("/api/v1/schema/:domain/:table", get(schema_registry::get_schema))
        .route("/api/v1/scopes", get(scopes_handler::list_scopes))
        .route("/api/v1/scopes/:id", get(scopes_handler::get_scope))
        .route("/api/v1/dashboards", get(list_dashboards).post(save_dashboard))
        .route("/api/v1/dashboards/:id", get(get_dashboard).put(update_dashboard))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    info!("🚀 vibha-dashboard-api listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
