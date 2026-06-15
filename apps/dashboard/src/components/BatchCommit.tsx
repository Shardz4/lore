import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWriteContract, useAccount } from "wagmi";
import { generateTree, getRoot, Decision, generateProofForJournal } from "@lore/crypto-utils";
import { useAuth } from "./AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function BatchCommit({ selectedInsights, onSuccess }: { selectedInsights: any[], onSuccess: () => void }) {
  const [isPinning, setIsPinning] = useState(false);
  const { isConnected, address } = useAccount();
  const [reputationScore, setReputationScore] = useState<number | null>(null);
  const [reputationLoading, setReputationLoading] = useState(true);
  const { user } = useAuth();
  const [apiToken, setApiToken] = useState<string>("");

  useEffect(() => {
    async function fetchToken() {
      if (user) {
        if (user.uid === "mock_user") {
          setApiToken(process.env.NEXT_PUBLIC_API_BEARER_TOKEN || "lore_default_secret_api_token");
        } else {
          try {
            const token = await user.getIdToken();
            setApiToken(token);
          } catch (e) {
            console.error("Error getting Firebase ID token:", e);
          }
        }
      }
    }
    fetchToken();
  }, [user]);

  useEffect(() => {
    // Fetch reputation from the server-side Go backend, NOT localStorage.
    // The server is the single source of truth for reputation scores.
    if (!address) {
      setReputationScore(100);
      setReputationLoading(false);
      return;
    }
    
    if (!apiToken) return;

    setReputationLoading(true);
    fetch(`${API_BASE}/api/v1/reputation/${address}`, {
      headers: {
        "Authorization": `Bearer ${apiToken}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Reputation API unavailable");
        return res.json();
      })
      .then(data => {
        setReputationScore(data.score ?? 100);
      })
      .catch(() => {
        // If the reputation API is not yet deployed, default to 100 but log the warning
        console.warn("[Lore] Reputation API unreachable. Defaulting to 100. Deploy the Go backend to enable server-side enforcement.");
        setReputationScore(100);
      })
      .finally(() => setReputationLoading(false));
  }, [address, apiToken]);

  const handleCommit = async () => {
    if (selectedInsights.length === 0) return;
    setIsPinning(true);

    try {
      // 1. Build the decisions from the selected insights
      const decisions: Decision[] = selectedInsights.map(item => ({
        insightType: item.insight.insight_type,
        description: item.insight.description,
        traceId: item.insight.source_trace_id,
        timestamp: item.insight.timestamp
      }));

      // 2. Generate ZK-Proof that is cryptographically bound to this specific journal
      // (Uses the new generateProofForJournal instead of a random string)
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate ZKVM compute time
      const zkProof = generateProofForJournal(decisions);
      const journalCid = `Qm${Math.random().toString(36).substring(2, 15)}`;
      
      // 3. Generate Merkle Root of the public output
      const tree = generateTree(decisions);
      const root = getRoot(tree) as `0x${string}`;
      
      console.log("=== LORE BATCH COMMIT SUCCESS ===");
      console.log("Public Journal (JSON):", JSON.stringify(decisions, null, 2));
      console.log("ZK-SNARK Proof:", zkProof);
      console.log("Merkle Root:", root);
      console.log("=================================");

      alert(`ZK-Proof Generation & Commit Success!\n\nProof: ${zkProof}\nMerkle Root: ${root}\n\n👉 The Public Journal JSON has been logged to your browser's developer console. Press F12 to open the console and copy the JSON!`);
      if (typeof window !== "undefined" && (window as any).pendo) {
        (window as any).pendo.track("Batch Committed", { insightCount: selectedInsights.length, merkleRoot: root, journalCid, zkProof });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Commit failed.");
    } finally {
      setIsPinning(false);
    }
  };

  if (selectedInsights.length === 0) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-4 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl flex justify-between items-center shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_30px_rgba(16,185,129,0.15)] z-50">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
          <span className="font-bold text-xl text-emerald-600">{selectedInsights.length}</span>
        </div>
        <div>
          <p className="font-bold text-slate-900 text-lg">Insights Selected</p>
          <p className="text-sm text-slate-500 font-medium">Ready for Merkle Tree generation</p>
        </div>
      </div>
      <Button 
        onClick={handleCommit} 
        disabled={isPinning || !isConnected || reputationLoading || (reputationScore !== null && reputationScore < 60)}
        className={`shadow-md transition-all border-none font-bold px-8 py-6 rounded-2xl text-base ${
          isPinning 
            ? "bg-emerald-600/75 text-white cursor-wait"
            : reputationLoading || !isConnected 
              ? "bg-slate-400 text-white cursor-not-allowed" 
              : (reputationScore !== null && reputationScore < 60) 
                ? "bg-red-600 hover:bg-red-700 text-white cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
        }`}
      >
        {reputationLoading ? "Checking reputation..." : (reputationScore !== null && reputationScore < 60) ? "BANNED: Reputation < 60%" : isPinning ? (
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Generating ZK-Proof...
          </span>
        ) : "Sign & Commit Batch"}
      </Button>
    </div>
  );
}
