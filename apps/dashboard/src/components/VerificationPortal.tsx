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
    <div className="space-y-6 w-full font-sans">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            IPFS Evidence Payload (JSON)
          </label>
          <textarea 
            className="w-full p-4 border border-slate-700/50 rounded-xl font-mono text-sm bg-[#0d1117] text-indigo-300 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-700 resize-y" 
            rows={8}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='[\n  {\n    "insightType": "RAGE_CLICK",\n    "description": "...",\n    "traceId": "...",\n    "timestamp": 1234\n  }\n]'
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            On-Chain Merkle Root
          </label>
          <Input 
            className="w-full font-mono bg-[#0d1117] text-purple-300 border-slate-700/50 rounded-xl py-6 px-4 focus-visible:ring-2 focus-visible:ring-purple-500/50 placeholder:text-slate-700 text-base"
            value={root}
            onChange={(e) => setRoot(e.target.value)}
            placeholder="0x..."
          />
        </div>
      </div>

      <Button 
        onClick={handleVerify} 
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-6 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all border-none uppercase tracking-widest mt-4"
      >
        Compute & Verify Proof
      </Button>

      {result !== null && (
        <div className={`mt-6 p-6 rounded-xl text-center border shadow-lg ${result ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]'}`}>
          <div className="font-mono font-bold tracking-tight text-lg mb-1">
            {result ? "SYSTEM VALIDATED" : "INTEGRITY BREACH"}
          </div>
          <p className="text-sm opacity-80">
            {result ? "Cryptographic path traces successfully back to the on-chain root." : "Evidence payload does not match the blockchain record."}
          </p>
        </div>
      )}
    </div>
  );
}
