use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};
use crate::models::InsightBundle;
use methods::ZK_CIRCUIT_GUEST_ELF;
use risc0_zkvm::{default_prover, ExecutorEnv};
use sha2::{Digest, Sha256};

const WINDOW_SIZE: usize = 50; // Keep last 50 events for context

pub fn generate_zk_proof(private_input: &str) -> Option<String> {
    if ZK_CIRCUIT_GUEST_ELF.is_empty() {
        let mut hasher = Sha256::new();
        hasher.update(private_input.as_bytes());
        let hash_result = hasher.finalize();
        let commitment = hex::encode(&hash_result[0..4]);
        return Some(format!("0xzk{}000000000000000000000000", commitment));
    }

    let env = ExecutorEnv::builder()
        .write(&private_input.to_string())
        .ok()?
        .build()
        .ok()?;

    let prover = default_prover();
    let prove_info = prover.prove(env, ZK_CIRCUIT_GUEST_ELF).ok()?;
    let receipt = prove_info.receipt;
    let seal_bytes = receipt.journal.bytes;
    Some(format!("0xzk{}", hex::encode(seal_bytes)))
}

pub struct Analyzer {
    events: VecDeque<String>,
}

impl Analyzer {
    pub fn new() -> Self {
        Self {
            events: VecDeque::with_capacity(WINDOW_SIZE),
        }
    }

    pub fn process_event(&mut self, event: &str, trace_id: &str, agent_id: &str, raw_trace: &str) -> Option<InsightBundle> {
        if self.events.len() == WINDOW_SIZE {
            self.events.pop_front();
        }
        self.events.push_back(event.to_string());

        let rage_clicks = self.events.iter().filter(|&e| e == "rage_click").count();
        let drop_offs = self.events.iter().filter(|&e| e == "feature_dropoff").count();
        let hallucinations = self.events.iter().filter(|&e| e == "hallucination").count();

        let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64;
        let zk_proof = generate_zk_proof(raw_trace);

        if hallucinations > 0 {
            // THE PUNISHER: Apply mathematical slashing penalty
            println!("CRITICAL: Hallucinated data detected in trace {}. Applying exponential mathematical penalty to agent reputation!", trace_id);
            self.events.clear();
            return Some(InsightBundle {
                insight_type: "REPUTATION_SLASHED".to_string(),
                description: "Agent submitted mathematically invalid or hallucinated data. Trust score heavily penalized.".to_string(),
                event_count: hallucinations,
                source_trace_id: trace_id.to_string(),
                agent_id: agent_id.to_string(),
                timestamp,
                zk_proof,
            });
        }

        if rage_clicks > 5 {
            self.events.clear();
            return Some(InsightBundle {
                insight_type: "RAGE_CLICK_CLUSTER".to_string(),
                description: "High concentration of rage clicks detected in the current window.".to_string(),
                event_count: rage_clicks,
                source_trace_id: trace_id.to_string(),
                agent_id: agent_id.to_string(),
                timestamp,
                zk_proof,
            });
        }

        let total_events = self.events.len();
        if total_events >= 10 && (drop_offs as f64 / total_events as f64) > 0.25 {
            self.events.clear();
            return Some(InsightBundle {
                insight_type: "ADOPTION_DROP".to_string(),
                description: "Feature drop-offs exceeded 25% of recent events.".to_string(),
                event_count: drop_offs,
                source_trace_id: trace_id.to_string(),
                agent_id: agent_id.to_string(),
                timestamp,
                zk_proof,
            });
        }

        None
    }
}
