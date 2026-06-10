import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWriteContract, useAccount } from "wagmi";
import { generateTree, getRoot, Decision } from "@lore/crypto-utils";

export function BatchCommit({ selectedInsights, onSuccess }: { selectedInsights: any[], onSuccess: () => void }) {
  const [isPinning, setIsPinning] = useState(false);
  const { isConnected } = useAccount();

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
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t flex justify-between items-center shadow-lg">
      <div className="font-semibold">{selectedInsights.length} insights selected for audit trail</div>
      <Button onClick={handleCommit} disabled={isPinning || !isConnected}>
        {isPinning ? "Generating Root..." : "Generate & Commit Root"}
      </Button>
    </div>
  );
}
