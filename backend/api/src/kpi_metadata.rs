/// KPI Metadata: Database column mapping + Display configuration
/// 
/// Separates the database column name from UI presentation.
/// Allows users to rename, format, and aggregate KPIs independently.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum KpiDefinition {
    /// Legacy format: just the column name (for backward compatibility)
    Simple(String),
    /// Full metadata format
    Full(KpiMetadata),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct KpiMetadata {
    /// Database column name (required)
    pub database_column: String,
    /// Display name shown in UI (optional, defaults to database_column)
    #[serde(default)]
    pub display_name: Option<String>,
    /// Unit of measurement (optional, e.g., "kg CO2e", "USD", "%")
    #[serde(default)]
    pub unit: Option<String>,
    /// Aggregation function for charts (optional, default "none")
    #[serde(default = "default_aggregation")]
    pub aggregation: String,
    /// Number of decimal places for formatting (optional, default 2)
    #[serde(default = "default_decimals")]
    pub decimals: i32,
    /// Data type hint for rendering (optional, e.g., "number", "percent", "currency")
    #[serde(default)]
    pub data_type: Option<String>,
}

fn default_aggregation() -> String {
    "none".to_string()
}

fn default_decimals() -> i32 {
    2
}

impl KpiMetadata {
    /// Create a new KPI metadata with all fields
    pub fn new(database_column: impl Into<String>) -> Self {
        Self {
            database_column: database_column.into(),
            display_name: None,
            unit: None,
            aggregation: "none".to_string(),
            decimals: 2,
            data_type: None,
        }
    }

    /// Set display name
    pub fn with_display_name(mut self, name: impl Into<String>) -> Self {
        self.display_name = Some(name.into());
        self
    }

    /// Set unit
    pub fn with_unit(mut self, unit: impl Into<String>) -> Self {
        self.unit = Some(unit.into());
        self
    }

    /// Set aggregation function
    pub fn with_aggregation(mut self, agg: impl Into<String>) -> Self {
        self.aggregation = agg.into();
        self
    }

    /// Set decimal places
    pub fn with_decimals(mut self, decimals: i32) -> Self {
        self.decimals = decimals;
        self
    }

    /// Set data type
    pub fn with_data_type(mut self, data_type: impl Into<String>) -> Self {
        self.data_type = Some(data_type.into());
        self
    }

    /// Get the display name (fallback to database_column if not set)
    pub fn get_display_name(&self) -> String {
        self.display_name
            .clone()
            .unwrap_or_else(|| self.database_column.clone())
    }
}

impl KpiDefinition {
    /// Get the database column name
    pub fn database_column(&self) -> &str {
        match self {
            KpiDefinition::Simple(col) => col,
            KpiDefinition::Full(meta) => &meta.database_column,
        }
    }

    /// Get full metadata, converting from simple if needed
    pub fn into_metadata(self) -> KpiMetadata {
        match self {
            KpiDefinition::Simple(col) => KpiMetadata::new(col),
            KpiDefinition::Full(meta) => meta,
        }
    }

    /// Get the display name
    pub fn get_display_name(&self) -> String {
        match self {
            KpiDefinition::Simple(col) => col.clone(),
            KpiDefinition::Full(meta) => meta.get_display_name(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_parse_simple_kpi() {
        let json = json!("co2e");
        let kpi: KpiDefinition = serde_json::from_value(json).expect("Should parse");
        assert_eq!(kpi.database_column(), "co2e");
        assert_eq!(kpi.get_display_name(), "co2e");
    }

    #[test]
    fn test_parse_full_kpi() {
        let json = json!({
            "database_column": "co2e",
            "display_name": "CO₂ Emissions",
            "unit": "kg CO2e",
            "aggregation": "sum",
            "decimals": 3
        });
        let kpi: KpiDefinition = serde_json::from_value(json).expect("Should parse");
        assert_eq!(kpi.database_column(), "co2e");
        assert_eq!(kpi.get_display_name(), "CO₂ Emissions");
    }

    #[test]
    fn test_kpi_metadata_builder() {
        let kpi = KpiMetadata::new("revenue")
            .with_display_name("Total Revenue")
            .with_unit("USD")
            .with_aggregation("sum")
            .with_decimals(2)
            .with_data_type("currency");

        assert_eq!(kpi.database_column, "revenue");
        assert_eq!(kpi.get_display_name(), "Total Revenue");
        assert_eq!(kpi.unit, Some("USD".to_string()));
        assert_eq!(kpi.aggregation, "sum");
        assert_eq!(kpi.decimals, 2);
        assert_eq!(kpi.data_type, Some("currency".to_string()));
    }

    #[test]
    fn test_backward_compatibility() {
        // Old format: array of strings
        let old_format = vec!["co2e", "category", "date"];
        for col in old_format {
            let kpi = KpiMetadata::new(col);
            assert_eq!(kpi.database_column, col);
            assert_eq!(kpi.get_display_name(), col);
        }
    }
}
