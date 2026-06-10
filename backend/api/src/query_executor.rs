/// Query Executor: Parse Analytics Scopes JSONB and execute dynamic SQL queries
/// 
/// This module transforms Analytics Scopes definitions (from dashboard.analytics_scopes.query_definition)
/// into executable SQL queries and returns result rows. It handles:
/// - Parsing scope JSONB structure (sources, joins, filters)
/// - Building dynamic FROM/JOIN clauses
/// - Selecting KPI columns from the dashboard configuration
/// - Executing queries and returning typed results

use serde_json::Value;
use sqlx::{PgPool, Row};

/// Represents a single data source in a scope definition
#[derive(Debug, Clone)]
pub struct QuerySource {
    pub domain: String,
    pub table: String,
    pub mdm_entity_key: String,
    pub scope_category: String,
}

/// Represents a join condition between sources
#[derive(Debug, Clone)]
pub struct QueryJoin {
    pub left: String,      // "greenops.emissions.mdm_supplier_id"
    pub right: String,     // "suppliers.operations.mdm_supplier_id"
}

/// Represents a parsed Analytics Scope query definition
#[derive(Debug, Clone)]
pub struct ParsedScope {
    pub name: String,
    pub sources: Vec<QuerySource>,
    pub joins: Vec<QueryJoin>,
}

/// Error type for query execution
#[derive(Debug)]
pub enum QueryExecutorError {
    InvalidScopeDefinition(String),
    QueryExecutionFailed(String),
    NoSourcesInScope,
}

impl std::fmt::Display for QueryExecutorError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            QueryExecutorError::InvalidScopeDefinition(msg) => {
                write!(f, "Invalid scope definition: {}", msg)
            }
            QueryExecutorError::QueryExecutionFailed(msg) => {
                write!(f, "Query execution failed: {}", msg)
            }
            QueryExecutorError::NoSourcesInScope => {
                write!(f, "Scope has no data sources defined")
            }
        }
    }
}

impl std::error::Error for QueryExecutorError {}

/// Parse the JSONB query_definition from analytics_scopes table into a structured format
pub fn parse_scope_definition(query_def: &Value) -> Result<ParsedScope, QueryExecutorError> {
    // Extract scope name
    let name = query_def
        .get("name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Missing 'name' field".to_string()))?
        .to_string();

    // Parse sources array
    let sources_raw = query_def
        .get("sources")
        .and_then(|v| v.as_array())
        .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Missing 'sources' array".to_string()))?;

    let mut sources = Vec::new();
    for src in sources_raw {
        let domain = src
            .get("domain")
            .and_then(|v| v.as_str())
            .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Source missing 'domain'".to_string()))?
            .to_string();

        let table = src
            .get("table")
            .and_then(|v| v.as_str())
            .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Source missing 'table'".to_string()))?
            .to_string();

        let mdm_entity_key = src
            .get("mdm_entity_key")
            .and_then(|v| v.as_str())
            .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Source missing 'mdm_entity_key'".to_string()))?
            .to_string();

        let scope_category = src
            .get("scope_category")
            .and_then(|v| {
                if let Some(s) = v.as_str() {
                    Some(s.to_string())
                } else if let Some(n) = v.as_i64() {
                    Some(n.to_string())
                } else {
                    None
                }
            })
            .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Source missing 'scope_category'".to_string()))?;

        sources.push(QuerySource {
            domain,
            table,
            mdm_entity_key,
            scope_category,
        });
    }

    if sources.is_empty() {
        return Err(QueryExecutorError::NoSourcesInScope);
    }

    // Parse joins array (may be empty for single-source scopes)
    let empty_joins = Vec::new();
    let joins_raw = query_def
        .get("joins")
        .and_then(|v| v.as_array())
        .unwrap_or(&empty_joins);

    let mut joins = Vec::new();
    for join in joins_raw {
        let left = join
            .get("left")
            .and_then(|v| v.as_str())
            .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Join missing 'left'".to_string()))?
            .to_string();

        let right = join
            .get("right")
            .and_then(|v| v.as_str())
            .ok_or_else(|| QueryExecutorError::InvalidScopeDefinition("Join missing 'right'".to_string()))?
            .to_string();

        joins.push(QueryJoin { left, right });
    }

    Ok(ParsedScope {
        name,
        sources,
        joins,
    })
}

/// Build a SELECT clause from requested KPIs (cast to TEXT for dynamic queries)
/// 
/// Build a SELECT clause from requested KPIs (cast to TEXT for dynamic queries)
fn build_select_clause(kpis: &[String], parsed_scope: &ParsedScope) -> Result<String, QueryExecutorError> {
    if kpis.is_empty() {
        return Err(QueryExecutorError::InvalidScopeDefinition(
            "No KPIs specified for query".to_string(),
        ));
    }

    // Use first source's alias (t0) instead of full schema.table reference
    let columns: Vec<String> = kpis
        .iter()
        .map(|kpi| format!("t0.\"{}\"::TEXT as \"{}\"", kpi, kpi))
        .collect();

    Ok(columns.join(", "))
}
/// Example: "FROM dashboard.emissions AS t0"
fn build_from_clause(parsed_scope: &ParsedScope) -> String {
    parsed_scope
        .sources
        .iter()
        .enumerate()
        .map(|(idx, source)| {
            let alias = format!("t{}", idx);
            format!(
                "FROM \"{}\".\"{}\" AS {}",
                "dashboard", source.table, alias
            )
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Build JOIN clauses from parsed scope joins
fn build_join_clause(parsed_scope: &ParsedScope) -> String {
    parsed_scope
        .joins
        .iter()
        .enumerate()
        .map(|(idx, join)| {
            let left_parts: Vec<&str> = join.left.split('.').collect();
            let right_parts: Vec<&str> = join.right.split('.').collect();

            if left_parts.len() == 3 && right_parts.len() == 3 {
                let left_table_idx = idx;
                let right_table_idx = idx + 1;

                format!(
                    "JOIN t{} ON t{}.\"{}\" = t{}.\"{}\"",
                    right_table_idx, left_table_idx, left_parts[2], right_table_idx, right_parts[2]
                )
            } else {
                format!("/* Invalid join specification: {} -> {} */", join.left, join.right)
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Execute a scope query and return all rows as JSON
/// 
/// # Arguments
/// - `db_pool`: PostgreSQL connection pool
/// - `query_definition`: JSONB value from dashboard.analytics_scopes.query_definition
/// - `kpis`: List of KPI column names to select
/// - `limit`: Maximum number of rows to return
pub async fn execute_scope_query(
    db_pool: &PgPool,
    query_definition: &Value,
    kpis: &[String],
    limit: i32,
) -> Result<Vec<Value>, QueryExecutorError> {
    let parsed_scope = parse_scope_definition(query_definition)?;

    let select_clause = build_select_clause(kpis, &parsed_scope)?;
    let from_clause = build_from_clause(&parsed_scope);
    let join_clause = build_join_clause(&parsed_scope);

    let sql = if join_clause.is_empty() {
        format!("SELECT {} {} LIMIT {};", select_clause, from_clause, limit)
    } else {
        format!(
            "SELECT {} {} {} LIMIT {};",
            select_clause, from_clause, join_clause, limit
        )
    };

    println!("DEBUG: Executing query: {}", sql);

    let rows = sqlx::query(&sql)
        .fetch_all(db_pool)
        .await
        .map_err(|e| QueryExecutorError::QueryExecutionFailed(e.to_string()))?;

    let mut result = Vec::new();
    for row in rows {
        let mut row_obj = serde_json::Map::new();

        for kpi in kpis {
            let value: Option<String> = row.try_get(kpi.as_str()).ok();
            row_obj.insert(
                kpi.clone(),
                value.map(|v| Value::String(v)).unwrap_or(Value::Null),
            );
        }

        result.push(Value::Object(row_obj));
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_parse_scope_definition_scope1() {
        let scope_def = json!({
            "name": "Scope 1: Direct Emissions",
            "mdm_context": {
                "primary_entity": "organization",
                "hierarchy_level": "global"
            },
            "sources": [
                {
                    "domain": "greenops",
                    "table": "emissions",
                    "mdm_entity_key": "organization_id",
                    "scope_category": "1"
                }
            ],
            "joins": []
        });

        let parsed = parse_scope_definition(&scope_def).expect("Should parse");
        assert_eq!(parsed.name, "Scope 1: Direct Emissions");
        assert_eq!(parsed.sources.len(), 1);
        assert_eq!(parsed.sources[0].domain, "greenops");
        assert_eq!(parsed.sources[0].table, "emissions");
        assert_eq!(parsed.joins.len(), 0);
    }

    #[test]
    fn test_build_select_clause() {
        let scope_def = json!({
            "name": "Test",
            "sources": [
                {
                    "domain": "greenops",
                    "table": "emissions",
                    "mdm_entity_key": "organization_id",
                    "scope_category": "1"
                }
            ],
            "joins": []
        });

        let parsed = parse_scope_definition(&scope_def).expect("Should parse");
        let kpis = vec!["co2e".to_string(), "category".to_string()];
        let select = build_select_clause(&kpis, &parsed).expect("Should build");

        assert!(select.contains("co2e"));
        assert!(select.contains("category"));
        assert!(select.contains("emissions"));
    }

    #[test]
    fn test_parse_missing_name() {
        let scope_def = json!({
            "sources": [],
            "joins": []
        });

        let result = parse_scope_definition(&scope_def);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_no_sources() {
        let scope_def = json!({
            "name": "Test",
            "sources": [],
            "joins": []
        });

        let result = parse_scope_definition(&scope_def);
        assert!(result.is_err());
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;
    use sqlx::PgPool;
    use serde_json::json;

    #[tokio::test]
    #[ignore]
    async fn test_scope1_executes_against_real_db() {
        let db_url = "postgresql://vibha:vibha_dev_2024@localhost:5440/vibha_dashboard";
        let pool = PgPool::connect(db_url)
            .await
            .expect("DB connection failed");

        // Fetch Scope 1 from database
        let scope_row = sqlx::query!(
            "SELECT query_definition FROM dashboard.analytics_scopes WHERE scope_name = 'Scope 1: Direct Emissions'"
        )
        .fetch_one(&pool)
        .await
        .expect("Scope 1 fetch failed");

        let query_def: serde_json::Value = 
            serde_json::from_value(serde_json::to_value(&scope_row.query_definition).unwrap()).unwrap();

        // Test parsing
        let parsed = parse_scope_definition(&query_def).expect("Parse failed");
        assert_eq!(parsed.sources[0].table, "emissions");
        println!("✓ Scope 1 definition parsed");

        // Test execution
        let kpis = vec!["co2e".to_string(), "category".to_string()];
        let results = execute_scope_query(&pool, &query_def, &kpis, 10)
            .await
            .expect("Query execution failed");

        assert!(!results.is_empty(), "Query should return rows");
        println!("✓ Scope 1 executed: {} rows returned", results.len());

        // Validate row structure
        for row in results.iter().take(1) {
            if let serde_json::Value::Object(obj) = row {
                assert!(obj.contains_key("co2e"), "Missing co2e column");
                assert!(obj.contains_key("category"), "Missing category column");
                println!("✓ Row structure valid: {:?}", obj.keys().collect::<Vec<_>>());
            }
        }
    }

    #[tokio::test]
    #[ignore]
    async fn test_scope2_executes_against_real_db() {
        let db_url = "postgresql://vibha:vibha_dev_2024@localhost:5440/vibha_dashboard";
        let pool = PgPool::connect(db_url)
            .await
            .expect("DB connection failed");

        let scope_row = sqlx::query!(
            "SELECT query_definition FROM dashboard.analytics_scopes WHERE scope_name = 'Scope 2: Energy Emissions'"
        )
        .fetch_one(&pool)
        .await
        .expect("Scope 2 fetch failed");

        let query_def: serde_json::Value = 
            serde_json::from_value(serde_json::to_value(&scope_row.query_definition).unwrap()).unwrap();

        let parsed = parse_scope_definition(&query_def).expect("Parse failed");
        assert_eq!(parsed.sources[0].table, "emissions");
        println!("✓ Scope 2 definition parsed");

        let kpis = vec!["co2e".to_string(), "source".to_string()];
        let results = execute_scope_query(&pool, &query_def, &kpis, 5)
            .await
            .expect("Query execution failed");

        assert!(!results.is_empty());
        println!("✓ Scope 2 executed: {} rows returned", results.len());
    }
}
