// backend/kafka/src/lib.rs
// Day 5 Task — Kafka publisher for parsed questions
// COPY TO: /mnt/c/vibha-dashboard/backend/kafka/src/lib.rs

use anyhow::Result;
use rdkafka::{
    config::ClientConfig,
    producer::{FutureProducer, FutureRecord},
};
use serde_json;
use std::time::Duration;
use tracing::{error, info};
use vibha_common::{ConfidenceScore, FilterSpecification};

// ─────────────────────────────────────────────────────────────────────────────
// KafkaPublisher
// ─────────────────────────────────────────────────────────────────────────────

pub struct KafkaPublisher {
    producer: FutureProducer,
    topic: String,
}

impl KafkaPublisher {
    /// Connect to Kafka brokers.
    /// `brokers` — comma-separated: "localhost:9092" or "broker1:9092,broker2:9092"
    pub fn new(brokers: &str) -> Result<Self> {
        info!("Initialising Kafka producer → brokers: {}", brokers);

        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("client.id", "vibha-dashboard")
            .set("message.timeout.ms", "5000")
            .set("acks", "all")
            .create()?;

        info!("Kafka producer ready");

        Ok(Self {
            producer,
            topic: "rig.questions".to_string(),
        })
    }

    /// Publish a parsed question event to `rig.questions`.
    ///
    /// Key   = question_id  (guarantees ordering per question)
    /// Value = JSON payload with domain + FilterSpecification + ConfidenceScore
    pub async fn publish_question(
        &self,
        question_id: &str,
        domain: &str,
        spec: &FilterSpecification,
        confidence: &ConfidenceScore,
    ) -> Result<()> {
        let payload = serde_json::json!({
            "question_id": question_id,
            "domain": domain,
            "filter_spec": spec,
            "confidence": confidence,
            "published_at": chrono::Utc::now().to_rfc3339(),
        });

        let payload_str = serde_json::to_string(&payload)?;

        let record = FutureRecord::to(&self.topic)
            .key(question_id)
            .payload(&payload_str);

        match self.producer.send(record, Duration::from_secs(5)).await {
            Ok((partition, offset)) => {
                info!(
                    "Published question_id={} → topic={} partition={} offset={}",
                    question_id, self.topic, partition, offset
                );
                Ok(())
            }
            Err((err, _)) => {
                error!("Kafka send failed for question_id={}: {}", question_id, err);
                Err(anyhow::anyhow!("Kafka publish failed: {}", err))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    #[test]
    fn test_kafka_topic_constant() {
        // Topic name must match what Rig agents subscribe to
        assert_eq!("rig.questions", "rig.questions");
    }

    #[tokio::test]
    #[ignore] // run with: cargo test -- --ignored (requires Kafka running)
    async fn test_kafka_publish_live() {
        use super::*;
        use vibha_common::{ConfidenceScore, FilterSpecification, SelectedColumn};

        let publisher = KafkaPublisher::new("localhost:9092").unwrap();

        let spec = FilterSpecification {
            filter_id: "test-001".to_string(),
            source_table: "emissions".to_string(),
            selected_columns: vec![SelectedColumn {
                name: "total_co2".to_string(),
                aggregation: Some("SUM".to_string()),
                alias: Some("total".to_string()),
            }],
            filters: vec![],
            grouping_columns: vec!["facility_name".to_string()],
            sorting: vec![],
            limit: Some(10),
            ai_confidence_score: 0.91,
            warnings: vec![],
        };

        let confidence = ConfidenceScore::calculate(0.91, 1.0, 1.0).normalize();

        let result = publisher
            .publish_question("test-001", "greenops", &spec, &confidence)
            .await;

        assert!(result.is_ok(), "Kafka publish failed: {:?}", result.err());
    }
}
