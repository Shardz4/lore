import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateTree, getRoot, Decision, verifyZKProof } from "@lore/crypto-utils";

export function VerificationPortal() {
  const [payload, setPayload] = useState("");
  const [root, setRoot] = useState("");
  const [result, setResult] = useState<boolean | null>(null);

  const [proof, setProof] = useState("");

  const handleVerify = () => {
    if (!payload || !proof || !root) {
      alert("Please fill in all three fields (Public Journal, ZK-SNARK Proof, and On-Chain Merkle Root).");
      setResult(false);
      return;
    }

    if (payload.length > 50000) {
      alert("Public Journal payload is too large. Maximum size is 50KB.");
      setResult(false);
      return;
    }

    if (proof.length > 10000) {
      alert("ZK-SNARK Proof string is too large. Maximum size is 10KB.");
      setResult(false);
      return;
    }

    if (root.length > 1000) {
      alert("On-chain Merkle Root is too large. Maximum size is 1KB.");
      setResult(false);
      return;
    }

    try {
      const parsed = JSON.parse(payload);
      
      if (!Array.isArray(parsed)) {
        alert("Public Journal must be a valid JSON array of decisions.");
        setResult(false);
        return;
      }

      if (parsed.length > 100) {
        alert("Public Journal contains too many decisions (maximum is 100).");
        setResult(false);
        return;
      }

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (
          typeof item.insightType !== "string" ||
          typeof item.description !== "string" ||
          typeof item.traceId !== "string" ||
          typeof item.timestamp !== "number"
        ) {
          alert(`Invalid decision structure at index ${i}. Each item must have insightType (string), description (string), traceId (string), and timestamp (number).`);
          setResult(false);
          return;
        }
      }

      const isZkValid = verifyZKProof(proof, parsed as Decision[]);
      const calculatedRoot = getRoot(generateTree(parsed as Decision[]));
      const isValid = isZkValid && (calculatedRoot === root);
      setResult(isValid);
      if (typeof window !== "undefined" && (window as any).pendo) {
        (window as any).pendo.track("Proof Verified", { isValid, onChainRoot: root, isZkValid });
      }
    } catch (e) {
      alert("Invalid JSON payload or Proof. Ensure the payload is a valid JSON array.");
      setResult(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Public Journal (JSON)
          </label>
          <textarea 
            className="w-full p-5 border border-slate-200 rounded-2xl font-mono text-sm bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner placeholder:text-slate-400 resize-y" 
            rows={8}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='[\n  {\n    "insightType": "RAGE_CLICK",\n    "description": "...",\n    "traceId": "...",\n    "timestamp": 1234\n  }\n]'
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            ZK-SNARK Proof (Hex)
          </label>
          <Input 
            className="w-full font-mono bg-slate-50 text-slate-700 border-slate-200 rounded-2xl py-4 px-5 focus-visible:ring-2 focus-visible:ring-teal-500/50 placeholder:text-slate-400 text-base shadow-inner"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder="0xzk..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            On-Chain Merkle Root
          </label>
          <Input 
            className="w-full font-mono bg-slate-50 text-slate-700 border-slate-200 rounded-2xl py-4 px-5 focus-visible:ring-2 focus-visible:ring-slate-500/50 placeholder:text-slate-400 text-base shadow-inner"
            value={root}
            onChange={(e) => setRoot(e.target.value)}
            placeholder="0x..."
          />
        </div>
      </div>

      <Button 
        onClick={handleVerify} 
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all border-none uppercase tracking-widest mt-6 text-lg"
      >
        Compute & Verify Proof
      </Button>

      {result !== null && (
        <div className={`mt-8 p-6 rounded-2xl text-center border shadow-sm ${result ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <div className="font-sans font-black tracking-tight text-xl mb-1">
            {result ? "✅ Proof Verified" : "❌ Verification Failed"}
          </div>
          <p className="text-sm font-medium opacity-80">
            {result ? "The proof is valid — the data matches the on-chain Merkle root and hasn't been tampered with." : "The proof doesn't match. The data may have been altered, or the wrong proof was provided."}
          </p>
        </div>
      )}
    </div>
  );
}
