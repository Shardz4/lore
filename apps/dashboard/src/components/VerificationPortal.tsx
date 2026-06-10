import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateTree, getRoot, Decision } from "@lore/crypto-utils";

export function VerificationPortal() {
  const [payload, setPayload] = useState("");
  const [root, setRoot] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  const handleVerify = () => {
    try {
      const parsed: Decision[] = JSON.parse(payload);
      const tree = generateTree(parsed);
      const calculatedRoot = getRoot(tree);
      setResult(calculatedRoot === root);
    } catch (e) {
      alert("Invalid JSON payload or Root. Ensure the payload is a valid JSON array of Decisions.");
      setResult(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div>
        <label className="text-sm font-medium">IPFS JSON Payload (Evidence)</label>
        <textarea 
          className="w-full mt-1 p-3 border rounded-md font-mono text-sm dark:bg-slate-800" 
          rows={6}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder='[{"insightType": "RAGE_CLICK", "description": "...", "traceId": "...", "timestamp": 1234}]'
        />
      </div>

      <div>
        <label className="text-sm font-medium">On-Chain Merkle Root</label>
        <Input 
          className="mt-1 font-mono"
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          placeholder="0x..."
        />
      </div>

      <Button onClick={handleVerify} className="w-full">Compute & Verify Path Locally</Button>

      {result !== null && (
        <div className={`mt-4 p-4 rounded text-center font-bold ${result ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
          {result ? "✅ MATHEMATICALLY PROVEN: Payload matches on-chain root perfectly." : "❌ VERIFICATION FAILED: Payload does not match the root or is corrupt."}
        </div>
      )}
    </div>
  );
}
