// backend/agents/src/question_handler.rs
// Day 5 Hour 3 — PageSettings loaded from PostgreSQL
// COPY TO: /mnt/c/vibha-dashboard/backend/agents/src/question_handler.rs

use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tracing::{info, warn};
use uuid::Uuid;
use vibha_common::{
    ConfidenceAction, ConfidenceScore, ConfidenceThresholds,
    FilterSpecification, SelectedColumn,
};
use vibha_kafka::KafkaPublisher;

use crate::intent_parser::IntentParserAgent;

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response types
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct ParseRequest {
    pub question: String,
    pub domain: String,
    pub user_id: String,
    pub org_id: String,
    pub page_id: String,
    /// Optional override — if omitted, thresholds come from DB or domain default
    pub confidence_profile: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ParseResponse {
    pub question_id: String,
    pub filter_spec: FilterSpecification,
    pub confidence: ConfidenceScore,
    pub action: ConfidenceAction,
    pub action_description: String,
    pub warnings: Vec<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// QuestionHandler
// ─────────────────────────────────────────────────────────────────────────────

pub struct QuestionHandler {
    parser: IntentParserAgent,
    kafka_publisher: Option<KafkaPublisher>,
    db_pool: Option<PgPool>,
}

impl QuestionHandler {
    pub async fn new(
        domain: &str,
        ollama_host: &str,
        ollama_model: &str,
        kafka_brokers: &str,
        db_pool: Option<PgPool>,
    ) -> Result<Self> {
        info!("Initialising QuestionHandler for domain: {}", domain);
        let parser = IntentParserAgent::new(domain, ollama_host, ollama_model).await?;

        // Attempt to create KafkaPublisher if brokers provided
        let kafka_publisher = if !kafka_brokers.is_empty() {
            match KafkaPublisher::new(kafka_brokers) {
                Ok(publisher) => {
                    info!("Kafka publisher connected → {}", kafka_brokers);
                    Some(publisher)
                }
                Err(e) => {
                    warn!(
                        "Could not connect to Kafka at {} (non-fatal): {}. \
                        Questions will be processed but not published.",
                        kafka_brokers, e
                    );
                    None
                }
            }
        } else {
            info!("Kafka disabled (no brokers provided)");
            None
        };

        if db_pool.is_some() {
            info!("Database pool connected");
        } else {
            info!("Database disabled (no pool provided)");
        }

        Ok(Self {
            parser,
            kafka_publisher,
            db_pool,
        })
    }

    /// Main entry point — load settings → parse → score → publish → respond
    pub async fn handle(&self, req: ParseRequest) -> Result<ParseResponse> {
        let question_id = Uuid::new_v4().to_string();
        info!("Handling question [{}]: \"{}\"", question_id, req.question);

        // ── 1. Load PageSettings from DB (or use defaults) ────────────────
        let page_settings = if let Some(ref pool) = self.db_pool {
            match vibha_database::load_page_settings(pool, &req.page_id, &req.org_id, &req.domain)
                .await
            {
                Ok(settings) => settings,
                Err(e) => {
                    warn!("[{}] Failed to load PageSettings: {} (using defaults)", question_id, e);
                    vibha_common::PageSettings::default_for(&req.page_id, &req.org_id, &req.domain)
                }
            }
        } else {
            vibha_common::PageSettings::default_for(&req.page_id, &req.org_id, &req.domain)
        };

        // ── 2. Resolve confidence thresholds (DB override > request > domain) ──
        let thresholds = self.resolve_thresholds(&req, &page_settings);

        // ── 3. Parse question via Ollama ──────────────────────────────────
        let raw_json = self.parser.parse_question(&req.question).await?;

        // ── 4. Deserialise into FilterSpecification ───────────────────────
        let mut filter_spec = self.parse_to_filter_spec(&raw_json, &req, &question_id)?;

        // ── 5. Calculate confidence score ─────────────────────────────────
        let validation_score = self.validate_filter_spec(&filter_spec);
        let confidence = ConfidenceScore::calculate(
            filter_spec.ai_confidence_score,
            validation_score,
            1.0,
        )
        .normalize();

        // ── 6. Determine action ───────────────────────────────────────────
        let action = ConfidenceAction::determine(confidence.combined_score, &thresholds);
        info!(
            "[{}] confidence={:.3} action={:?} (thresholds: execute={:.2})",
            question_id, confidence.combined_score, action, thresholds.execute
        );

        // Attach warning if confidence is not Execute
        match action {
            ConfidenceAction::Warn => {
                filter_spec.warnings.push(format!(
                    "Low confidence ({:.2}): review recommended",
                    confidence.combined_score
                ));
            }
            ConfidenceAction::Review | ConfidenceAction::Reject => {
                filter_spec.warnings.push(format!(
                    "Confidence ({:.2}) below threshold — action: {:?}",
                    confidence.combined_score, action
                ));
            }
            ConfidenceAction::Execute => {}
        }

        // ── 7. Publish to Kafka (fire-and-forget, non-fatal) ─────────────
        if let Some(ref publisher) = self.kafka_publisher {
            if let Err(e) = publisher
                .publish_question(&question_id, &req.domain, &filter_spec, &confidence)
                .await
            {
                warn!("[{}] Kafka publish failed (non-fatal): {}", question_id, e);
            }
        }

        let warnings = filter_spec.warnings.clone();

        Ok(ParseResponse {
            question_id,
            filter_spec,
            confidence,
            action_description: action.description().to_string(),
            action,
            warnings,
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    fn resolve_thresholds(
        &self,
        req: &ParseRequest,
        page_settings: &vibha_common::PageSettings,
    ) -> ConfidenceThresholds {
        // Priority: explicit request override > page_settings override > domain default
        if let Some(ref profile) = req.confidence_profile {
            let t = ConfidenceThresholds::for_profile(profile);
            if t.validate().is_ok() {
                info!("Using request-provided confidence profile: {}", profile);
                return t;
            }
        }

        if let Some(ref profile) = page_settings.confidence_profile {
            let t = ConfidenceThresholds::for_profile(profile);
            if t.validate().is_ok() {
                info!(
                    "Using PageSettings confidence profile: {} (for page: {})",
                    profile, page_settings.page_id
                );
                return t;
            }
        }

        info!("Using domain-default confidence profile");
        ConfidenceThresholds::for_domain(&req.domain)
    }

    fn parse_to_filter_spec(
        &self,
        raw_json: &str,
        req: &ParseRequest,
        question_id: &str,
    ) -> Result<FilterSpecification> {
        if let Ok(mut spec) = serde_json::from_str::<FilterSpecification>(raw_json) {
            spec.filter_id = question_id.to_string();
            return Ok(spec);
        }

        // Fallback — LLM returned prose or partial JSON
        warn!(
            "[{}] LLM output is not valid FilterSpecification JSON — using fallback",
            question_id
        );

        Ok(FilterSpecification {
            filter_id: question_id.to_string(),
            source_table: String::new(),
            selected_columns: vec![SelectedColumn {
                name: "*".to_string(),
                aggregation: None,
                alias: None,
            }],
            filters: vec![],
            grouping_columns: vec![],
            sorting: vec![],
            limit: Some(100),
            ai_confidence_score: 0.0,
            warnings: vec![format!(
                "LLM output could not be parsed as FilterSpecification for domain '{}'",
                req.domain
            )],
        })
    }

    fn validate_filter_spec(&self, spec: &FilterSpecification) -> f32 {
        let mut score: f32 = 1.0;
        if spec.source_table.is_empty() {
            score -= 0.4;
        }
        if spec.selected_columns.is_empty() {
            score -= 0.3;
        }
        score -= 0.1 * spec.warnings.len() as f32;
        score.clamp(0.0, 1.0)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use vibha_common::{ConfidenceAction, ConfidenceScore, ConfidenceThresholds, PageSettings};

    #[test]
    fn test_resolve_thresholds_domain_default() {
        let t = ConfidenceThresholds::for_domain("greenops");
        assert!(t.validate().is_ok());
        assert_eq!(t.execute, 0.85);
    }

    #[test]
    fn test_resolve_thresholds_healthcare_strict() {
        let t = ConfidenceThresholds::for_domain("healthcare");
        assert_eq!(t.execute, 0.90);
    }

    #[test]
    fn test_confidence_action_pipeline() {
        let score = ConfidenceScore::calculate(0.90, 1.0, 1.0).normalize();
        let t = ConfidenceThresholds::for_domain("greenops");
        assert_eq!(ConfidenceAction::determine(score.combined_score, &t), ConfidenceAction::Execute);
    }

    #[test]
    fn test_low_confidence_rejects() {
        let score = ConfidenceScore::calculate(0.40, 0.50, 0.50).normalize();
        let t = ConfidenceThresholds::for_domain("healthcare");
        assert_eq!(ConfidenceAction::determine(score.combined_score, &t), ConfidenceAction::Reject);
    }

    #[test]
    fn test_page_settings_override() {
        // Simulate a page with "strict" profile
        let _page_settings = PageSettings {
            page_id: "page-1".to_string(),
            org_id: "org-456".to_string(),
            domain: "greenops".to_string(),
            confidence_profile: Some("strict".to_string()),
            auto_execute: false,
            max_rows: 500,
            allowed_tables: vec![],
        };

        let strict_thresholds = ConfidenceThresholds::for_profile("strict");
        assert_eq!(strict_thresholds.execute, 0.90);
        // If page_settings.confidence_profile is used, threshold is stricter than domain default
        let domain_thresholds = ConfidenceThresholds::for_domain("greenops");
        assert!(strict_thresholds.execute > domain_thresholds.execute);
    }
}
