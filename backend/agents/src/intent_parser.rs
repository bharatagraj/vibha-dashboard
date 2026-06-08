// backend/agents/src/intent_parser.rs
// Day 3 Task 3.5 — Rig agent skeleton with Ollama client initialization

use anyhow::Result;
use serde_json::json;
use tracing::{error, info, warn};

pub struct IntentParserAgent {
    ollama_client: reqwest::Client,
    ollama_host: String,
    ollama_model: String,
    temperature: f32,
    max_retries: u32,
}

impl IntentParserAgent {
    pub async fn new(
        domain: &str,
        ollama_host: &str,
        ollama_model: &str,
    ) -> Result<Self> {
        info!("Initializing IntentParserAgent for domain: {}", domain);

        let client = reqwest::Client::new();
        let health_url = format!("{}/api/tags", ollama_host);
        
        match client.get(&health_url).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    info!("✅ Ollama available at {}", ollama_host);
                } else {
                    warn!("⚠️  Ollama returned status {}", response.status());
                }
            }
            Err(e) => {
                error!("❌ Cannot connect to Ollama at {}: {}", ollama_host, e);
                return Err(e.into());
            }
        }

        Ok(Self {
            ollama_client: client,
            ollama_host: ollama_host.to_string(),
            ollama_model: ollama_model.to_string(),
            temperature: 0.3,
            max_retries: 3,
        })
    }

    pub async fn parse_question(&self, question_text: &str) -> Result<String> {
        info!("Parsing question: \"{}\"", question_text);

        for attempt in 1..=self.max_retries {
            match self.call_ollama(question_text).await {
                Ok(response) => {
                    info!("✅ Question parsed successfully on attempt {}", attempt);
                    return Ok(response);
                }
                Err(e) => {
                    warn!("Attempt {} failed: {}", attempt, e);
                    if attempt == self.max_retries {
                        error!("❌ All {} retries exhausted", self.max_retries);
                        return Err(e);
                    }
                }
            }
        }

        Err(anyhow::anyhow!("Failed after {} retries", self.max_retries))
    }

    async fn call_ollama(&self, prompt: &str) -> Result<String> {
        let url = format!("{}/api/generate", self.ollama_host);

        let payload = json!({
            "model": self.ollama_model,
            "prompt": prompt,
            "temperature": self.temperature,
            "stream": false,
            "raw": true,
        });

        info!("Calling Ollama: POST {}", url);

        let response = self
            .ollama_client
            .post(&url)
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Ollama returned status {}: {}",
                response.status(),
                response.text().await?
            ));
        }

        let body: serde_json::Value = response.json().await?;
        let response_text = body["response"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("No 'response' field in Ollama response"))?;

        info!("Ollama response received ({} chars)", response_text.len());

        Ok(response_text.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_agent_creation() {
        if reqwest::Client::new()
            .get("http://localhost:11434/api/tags")
            .send()
            .await
            .is_err()
        {
            println!("Skipping test: Ollama not available");
            return;
        }

        let agent = IntentParserAgent::new(
            "greenops",
            "http://localhost:11434",
            "mistral:7b-instruct-q8_0",
        )
        .await;

        assert!(agent.is_ok(), "Agent creation failed: {:?}", agent.err());
    }
}
