// backend/kafka/src/messages.rs
// Day 3 Task 3.3 — Kafka message types (Avro-compatible)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Question {
    pub question_id: String,
    pub timestamp: i64,
    pub user_id: String,
    pub org_id: String,
    pub page_id: String,
    pub question_text: String,
    pub context: QuestionContext,
    pub correlation_id: Option<String>,
    pub request_id: String,
    pub priority: QuestionPriority,
    pub ttl_seconds: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestionContext {
    pub accessible_tables: Vec<String>,
    pub default_filters: HashMap<String, String>,
    pub domain: String,
    pub domain_metadata_version: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum QuestionPriority {
    #[serde(rename = "LOW")]
    Low,
    #[serde(rename = "NORMAL")]
    Normal,
    #[serde(rename = "HIGH")]
    High,
    #[serde(rename = "CRITICAL")]
    Critical,
}

impl Default for QuestionPriority {
    fn default() -> Self {
        QuestionPriority::Normal
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Answer {
    pub answer_id: String,
    pub question_id: String,
    pub timestamp: i64,
    pub processing_time_ms: u32,
    pub status: AnswerStatus,
    pub filter_specification: Option<String>,
    pub result_set: ResultSet,
    pub confidence_score: f64,
    pub warnings: Vec<String>,
    pub error_details: Option<String>,
    pub model_used: String,
    pub agent_instance_id: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum AnswerStatus {
    #[serde(rename = "SUCCESS")]
    Success,
    #[serde(rename = "PARTIAL")]
    Partial,
    #[serde(rename = "ERROR")]
    Error,
    #[serde(rename = "TIMEOUT")]
    Timeout,
    #[serde(rename = "REJECTED")]
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultSet {
    pub rows_returned: i32,
    pub rows_total_matching: Option<i32>,
    pub columns: Vec<ColumnMeta>,
    pub data: Option<String>,
    pub data_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColumnMeta {
    pub name: String,
    pub column_type: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_question_serialization() {
        let mut context_filters = HashMap::new();
        context_filters.insert("org_id".to_string(), "org-uuid".to_string());

        let question = Question {
            question_id: "q-test-1".to_string(),
            timestamp: 1717929600000,
            user_id: "u-test-1".to_string(),
            org_id: "org-test-1".to_string(),
            page_id: "p-test-1".to_string(),
            question_text: "Show top 5 facilities".to_string(),
            context: QuestionContext {
                accessible_tables: vec!["emissions".to_string()],
                default_filters: context_filters,
                domain: "greenops".to_string(),
                domain_metadata_version: "1.0".to_string(),
            },
            correlation_id: Some("cr-test".to_string()),
            request_id: "req-456".to_string(),
            priority: QuestionPriority::Normal,
            ttl_seconds: 3600,
        };

        let json = serde_json::to_string(&question).expect("Failed to serialize");
        let deserialized: Question =
            serde_json::from_str(&json).expect("Failed to deserialize");

        assert_eq!(question.question_id, deserialized.question_id);
    }

    #[test]
    fn test_answer_serialization() {
        let answer = Answer {
            answer_id: "a-test-1".to_string(),
            question_id: "q-test-1".to_string(),
            timestamp: 1717929605000,
            processing_time_ms: 4823,
            status: AnswerStatus::Success,
            filter_specification: Some("{}".to_string()),
            result_set: ResultSet {
                rows_returned: 5,
                rows_total_matching: Some(47),
                columns: vec![],
                data: Some("[]".to_string()),
                data_hash: "abc123".to_string(),
            },
            confidence_score: 0.87,
            warnings: vec![],
            error_details: None,
            model_used: "mistral:7b-instruct-q8_0".to_string(),
            agent_instance_id: "rig-agent-1".to_string(),
        };

        let json = serde_json::to_string(&answer).expect("Failed to serialize");
        let deserialized: Answer =
            serde_json::from_str(&json).expect("Failed to deserialize");

        assert_eq!(answer.answer_id, deserialized.answer_id);
    }
}
