import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWriteContract, useAccount } from "wagmi";
import { generateTree, getRoot, Decision } from "@lore/crypto-utils";

export function BatchCommit({ selectedInsights, onSuccess }: { selectedInsights: any[], onSuccess: () => void }) {
  const [isPinning, setIsPinning] = useState(false);
  const { isConnected, address } = useAccount();
  const [reputationScore, setReputationScore] = useState<number>(100);

  useEffect(() => {
    // In production, this fetches from the Go backend's Reputation Module.
    // For local testing, you can change this in localStorage.
    const score = parseFloat(localStorage.getItem("agent_reputation") || "100");
    setReputationScore(score);
  }, [selectedInsights]);

  const handleCommit = async () => {
    if (selectedInsights.length === 0) return;
    setIsPinning(true);

    try {
      // 1. Generate Zero-Knowledge Proof (Simulated for UI)
      // In production, the agent's ZKVM outputs the proof, and the dashboard submits it.
      await new Promise(resolve => setTimeout(resolve, 3000));
      const mockZkProof = `0xzk${Math.random().toString(16).substring(2, 10)}`;
      const mockJournalCid = `Qm${Math.random().toString(36).substring(2, 15)}`;
      
      // 2. Generate Merkle Root of the public output
      const decisions: Decision[] = selectedInsights.map(item => ({
        insightType: item.insight.insight_type,
        description: item.insight.description,
        traceId: item.insight.source_trace_id,
        timestamp: item.insight.timestamp
      }));
      
      const tree = generateTree(decisions);
      const root = getRoot(tree) as `0x${string}`;
      
      alert(`ZK-Proof Generation & Commit Success!\n\nProof: ${mockZkProof}\nPublic Journal CID: ${mockJournalCid}\nMerkle Root: ${root}`);
      if (typeof window !== "undefined" && (window as any).pendo) {
        (window as any).pendo.track("Batch Committed", { insightCount: selectedInsights.length, merkleRoot: root, journalCid: mockJournalCid, zkProof: mockZkProof });
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
        disabled={isPinning || !isConnected || reputationScore < 60}
        className={`shadow-md transition-all border-none font-bold px-8 py-6 rounded-2xl text-base ${reputationScore < 60 ? "bg-red-600 hover:bg-red-700 text-white cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
      >
        {reputationScore < 60 ? "BANNED: Reputation < 60%" : isPinning ? (
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Generating ZK-Proof...
          </span>
        ) : "Sign & Commit Batch"}
      </Button>
    </div>
  );
}
