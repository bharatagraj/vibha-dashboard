// Integration tests for query_executor
// Run with: cargo test --bin vibha-api query_executor_integration -- --ignored --nocapture

#[cfg(test)]
mod integration_tests {
    use super::*;
    use sqlx::PgPool;
    use serde_json::json;

    #[tokio::test]
    #[ignore]
    async fn test_execute_scope1_against_real_database() {
        let database_url = "postgresql://vibha:vibha_dev_2024@localhost:5440/vibha_dashboard";
        let pool = PgPool::connect(database_url)
            .await
            .expect("Failed to connect to database");

        // Fetch real Scope 1 definition
        let scope_row = sqlx::query!(
            r#"SELECT query_definition FROM dashboard.analytics_scopes WHERE scope_name = 'Scope 1: Direct Emissions'"#
        )
        .fetch_one(&pool)
        .await
        .expect("Failed to fetch Scope 1");

        let query_def: serde_json::Value = 
            serde_json::from_value(serde_json::to_value(&scope_row.query_definition).expect("to_value"))
            .expect("from_value");

        // Parse and validate
        let parsed = parse_scope_definition(&query_def)
            .expect("Scope 1 should parse");
        
        assert_eq!(parsed.name, "Scope 1: Direct Emissions");
        assert_eq!(parsed.sources.len(), 1);
        assert_eq!(parsed.sources[0].table, "emissions");
        println!("✓ Scope 1 definition parsed correctly");

        // Execute query
        let kpis = vec![
            "co2e".to_string(),
            "category".to_string(),
            "date".to_string(),
        ];

        let results = execute_scope_query(&pool, &query_def, &kpis, 10)
            .await
            .expect("Query should execute");

        assert!(!results.is_empty(), "Should return rows");
        println!("✓ Scope 1 query returned {} rows", results.len());

        // Validate structure
        for row in &results {
            if let serde_json::Value::Object(obj) = row {
                assert!(obj.contains_key("co2e"), "Row should have co2e");
                assert!(obj.contains_key("category"), "Row should have category");
            }
        }
        println!("✓ All rows have correct structure");
    }

    #[tokio::test]
    #[ignore]
    async fn test_execute_scope2_against_real_database() {
        let database_url = "postgresql://vibha:vibha_dev_2024@localhost:5440/vibha_dashboard";
        let pool = PgPool::connect(database_url)
            .await
            .expect("Failed to connect");

        let scope_row = sqlx::query!(
            r#"SELECT query_definition FROM dashboard.analytics_scopes WHERE scope_name = 'Scope 2: Energy Emissions'"#
        )
        .fetch_one(&pool)
        .await
        .expect("Failed to fetch Scope 2");

        let query_def: serde_json::Value = 
            serde_json::from_value(serde_json::to_value(&scope_row.query_definition).expect("to_value"))
            .expect("from_value");

        let parsed = parse_scope_definition(&query_def).expect("Should parse");
        assert_eq!(parsed.name, "Scope 2: Energy Emissions");
        println!("✓ Scope 2 parsed correctly");

        let kpis = vec!["co2e".to_string(), "source".to_string()];
        let results = execute_scope_query(&pool, &query_def, &kpis, 5)
            .await
            .expect("Query should execute");

        assert!(!results.is_empty(), "Should return rows");
        println!("✓ Scope 2 query returned {} rows", results.len());
    }
}
