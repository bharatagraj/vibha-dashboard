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

// ========== NEW: Schema Registry Module ==========
mod schema_registry;

// ========== Request/Response Types ==========
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

// ========== App State ==========
#[derive(Clone)]
struct AppState {
    handler: Arc<RwLock<QuestionHandler>>,
}

// ========== Handlers ==========

/// Health check endpoint
async fn health() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}

/// Direct query endpoint - returns mock data based on table
async fn direct_query(
    State(_state): State<AppState>,
    Json(req): Json<DirectQueryRequest>,
) -> impl IntoResponse {
    info!("📊 Direct query: table={}, domain={}", req.table, req.domain);
    let start = std::time::Instant::now();

    // Mock data based on table
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

    // KPI values based on table
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
    info!("✅ Returning {} rows in {}ms", data.len(), execution_time);

    (
        StatusCode::OK,
        Json(DirectQueryResponse {
            data,
            kpi_values,
            execution_time_ms: execution_time,
        }),
    )
}

// ========== Main ==========
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

    // Initialize QuestionHandler
    let handler = QuestionHandler::new(
        &domain,
        &ollama_host,
        &ollama_model,
        "",
        None,
    )
    .await
    .expect("Failed to initialize QuestionHandler");

    let state = AppState {
        handler: Arc::new(RwLock::new(handler)),
    };

    // CORS configuration
    let cors = CorsLayer::permissive();

    // Build router
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/direct-query", post(direct_query))
        .route("/api/v1/schema/:domain/:table", get(schema_registry::get_schema))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    info!("🚀 vibha-dashboard-api listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
