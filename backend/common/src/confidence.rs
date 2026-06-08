// backend/common/src/confidence.rs
// Day 3 Task 3.1 — Confidence scoring and threshold management

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceThresholds {
    pub execute: f32,
    pub warn: f32,
    pub review: f32,
    pub reject: f32,
}

impl ConfidenceThresholds {
    pub fn for_profile(profile: &str) -> Self {
        match profile {
            "strict" => Self {
                execute: 0.90,
                warn: 0.80,
                review: 0.70,
                reject: 0.70,
            },
            "moderate" => Self {
                execute: 0.85,
                warn: 0.75,
                review: 0.65,
                reject: 0.65,
            },
            "permissive" => Self {
                execute: 0.75,
                warn: 0.65,
                review: 0.55,
                reject: 0.55,
            },
            _ => Self::for_profile("moderate"),
        }
    }

    pub fn for_domain(domain: &str) -> Self {
        match domain {
            "healthcare" => Self::for_profile("strict"),
            "finance" => Self::for_profile("strict"),
            "agents" => Self::for_profile("strict"),
            "greenops" => Self::for_profile("moderate"),
            "bms" => Self::for_profile("moderate"),
            _ => Self::for_profile("moderate"),
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        let min = 0.50;
        let max = 1.00;

        if self.execute < min || self.execute > max {
            return Err(format!("execute threshold {} out of range", self.execute));
        }
        if self.warn < min || self.warn > max {
            return Err(format!("warn threshold {} out of range", self.warn));
        }
        if self.review < min || self.review > max {
            return Err(format!("review threshold {} out of range", self.review));
        }
        if self.reject < min || self.reject > max {
            return Err(format!("reject threshold {} out of range", self.reject));
        }

        if !(self.execute >= self.warn && self.warn >= self.review && self.review >= self.reject) {
            return Err(
                "thresholds must be ordered: execute >= warn >= review >= reject".to_string(),
            );
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceScore {
    pub agent_confidence: f32,
    pub validation_score: f32,
    pub tool_success_rate: f32,
    pub combined_score: f32,
}

impl ConfidenceScore {
    pub fn calculate(
        agent_confidence: f32,
        validation_score: f32,
        tool_success_rate: f32,
    ) -> Self {
        let combined_score = 0.5 * agent_confidence + 0.3 * validation_score + 0.2 * tool_success_rate;

        Self {
            agent_confidence,
            validation_score,
            tool_success_rate,
            combined_score,
        }
    }

    pub fn normalize(mut self) -> Self {
        self.combined_score = self.combined_score.clamp(0.0, 1.0);
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConfidenceAction {
    Execute,
    Warn,
    Review,
    Reject,
}

impl ConfidenceAction {
    pub fn determine(score: f32, thresholds: &ConfidenceThresholds) -> Self {
        if score >= thresholds.execute {
            ConfidenceAction::Execute
        } else if score >= thresholds.warn {
            ConfidenceAction::Warn
        } else if score >= thresholds.review {
            ConfidenceAction::Review
        } else {
            ConfidenceAction::Reject
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            ConfidenceAction::Execute => "Execute automatically (high confidence)",
            ConfidenceAction::Warn => "Execute with warning (medium confidence)",
            ConfidenceAction::Review => "Log for review (low confidence)",
            ConfidenceAction::Reject => "Reject, ask for clarification (very low confidence)",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_confidence_thresholds_profiles() {
        let strict = ConfidenceThresholds::for_profile("strict");
        assert_eq!(strict.execute, 0.90);

        let moderate = ConfidenceThresholds::for_profile("moderate");
        assert_eq!(moderate.execute, 0.85);
    }

    #[test]
    fn test_confidence_score_calculation() {
        let score = ConfidenceScore::calculate(0.80, 1.0, 1.0);
        assert!((score.combined_score - 0.90).abs() < 0.001);
    }

    #[test]
    fn test_confidence_action_determination() {
        let thresholds = ConfidenceThresholds::for_domain("greenops");
        assert_eq!(
            ConfidenceAction::determine(0.90, &thresholds),
            ConfidenceAction::Execute
        );
    }
}
