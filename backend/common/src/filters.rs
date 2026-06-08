// backend/common/src/filter.rs
// Day 3 Task 3.1 — Rust data structures for filter specifications

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterSpecification {
    pub filter_id: String,
    pub source_table: String,
    pub selected_columns: Vec<SelectedColumn>,
    pub filters: Vec<FilterClause>,
    pub grouping_columns: Vec<String>,
    pub sorting: Vec<SortSpec>,
    pub limit: Option<u32>,
    pub ai_confidence_score: f32,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectedColumn {
    pub name: String,
    pub aggregation: Option<String>,
    pub alias: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterClause {
    pub column: String,
    pub operator: String,
    pub value: FilterValue,
    pub filter_type: FilterType,
    pub confidence: f32,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FilterValue {
    Scalar(String),
    Array(Vec<String>),
    Range { start: String, end: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FilterType {
    #[serde(rename = "system")]
    System,
    #[serde(rename = "user_explicit")]
    UserExplicit,
    #[serde(rename = "user_inferred")]
    UserInferred,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SortSpec {
    pub column: String,
    pub direction: SortDirection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortDirection {
    #[serde(rename = "asc")]
    Ascending,
    #[serde(rename = "desc")]
    Descending,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterContext {
    pub request_id: String,
    pub user_id: String,
    pub org_id: String,
    pub page_id: String,
    pub accessible_tables: Vec<String>,
    pub default_filters: HashMap<String, serde_json::Value>,
    pub domain: String,
    pub domain_metadata_version: String,
    pub max_rows_to_return: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainMetadata {
    pub domain: String,
    pub version: String,
    pub schema_name: String,
    pub tables: Vec<TableMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableMetadata {
    pub name: String,
    pub description: String,
    pub row_level_security: RLSPolicy,
    pub columns: Vec<ColumnMetadata>,
    pub relationships: Vec<Relationship>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RLSPolicy {
    pub policy: String,
    pub tenant_column: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnMetadata {
    pub name: String,
    pub column_type: String,
    pub description: String,
    pub filterable: bool,
    pub aggregatable: bool,
    pub valid_operators: Vec<String>,
    pub aggregations: Option<Vec<String>>,
    pub enum_values: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub foreign_key: String,
    pub references_table: String,
    pub references_column: String,
    pub join_type: String,
    pub cardinality: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_filter_specification_serialization() {
        let spec = FilterSpecification {
            filter_id: "f-test-1".to_string(),
            source_table: "emissions".to_string(),
            selected_columns: vec![
                SelectedColumn {
                    name: "facility_name".to_string(),
                    aggregation: None,
                    alias: None,
                },
            ],
            filters: vec![],
            grouping_columns: vec![],
            sorting: vec![],
            limit: Some(5),
            ai_confidence_score: 0.87,
            warnings: vec![],
        };

        let json = serde_json::to_string(&spec).expect("Failed to serialize");
        let deserialized: FilterSpecification =
            serde_json::from_str(&json).expect("Failed to deserialize");

        assert_eq!(spec.filter_id, deserialized.filter_id);
    }
}
