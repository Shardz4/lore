import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWriteContract, useAccount } from "wagmi";
import { generateTree, getRoot, Decision } from "@lore/crypto-utils";

export function BatchCommit({ selectedInsights, onSuccess }: { selectedInsights: any[], onSuccess: () => void }) {
  const [isPinning, setIsPinning] = useState(false);
  const { isConnected, address } = useAccount();

  const handleCommit = async () => {
    if (selectedInsights.length === 0) return;
    setIsPinning(true);

    try {
      // 1. Mock IPFS Pinning
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}`;
      
      // 2. Generate Merkle Root locally
      const decisions: Decision[] = selectedInsights.map(item => ({
        insightType: item.insight.insight_type,
        description: item.insight.description,
        traceId: item.insight.source_trace_id,
        timestamp: item.insight.timestamp
      }));
      
      const tree = generateTree(decisions);
      const root = getRoot(tree) as `0x${string}`;
      
      alert(`Mock Deployment Success!\n\nMerkle Root: ${root}\nMock IPFS CID: ${mockCid}`);
      if (typeof window !== "undefined" && (window as any).pendo) {
        (window as any).pendo.track("Batch Committed", { insightCount: selectedInsights.length, merkleRoot: root, mockCid, walletAddress: address });
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
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-4 bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl flex justify-between items-center shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(99,102,241,0.15)] z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <span className="font-bold text-indigo-400">{selectedInsights.length}</span>
        </div>
        <div>
          <p className="font-semibold text-slate-200">Insights Selected</p>
          <p className="text-xs text-slate-400 font-mono">Ready for Merkle Tree generation</p>
        </div>
      </div>
      <Button 
        onClick={handleCommit} 
        disabled={isPinning || !isConnected}
        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all border-none font-semibold px-6 py-5 rounded-xl"
      >
        {isPinning ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Generating Root...
          </span>
        ) : "Sign & Commit Batch"}
      </Button>
    </div>
  );
}
