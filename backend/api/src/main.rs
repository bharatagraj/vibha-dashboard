use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/status", get(status));

    // Run server
    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    
    tracing::info!("Server listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}

async fn status() -> String {
    serde_json::json!({
        "status": "running",
        "service": "vibha-dashboard-api",
        "version": "0.1.0"
    }).to_string()
}
