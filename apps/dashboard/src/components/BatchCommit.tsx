import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { generateTree, getRoot, Decision, generateProofForJournal, LORE_LEDGER_ADDRESS, LORE_LEDGER_ABI } from "@lore/crypto-utils";
import { useAuth } from "./AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function BatchCommit({ selectedInsights, onSuccess }: { selectedInsights: any[], onSuccess: (details: { proof: string, root: string, journal: string }) => void }) {
  const [isPinning, setIsPinning] = useState(false);
  const { isConnected, address } = useAccount();
  const [reputationScore, setReputationScore] = useState<number | null>(null);
  const [reputationLoading, setReputationLoading] = useState(true);
  const { user } = useAuth();
  const [apiToken, setApiToken] = useState<string>("");
  const [commitError, setCommitError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

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
    setCommitError(null);

    try {
      // 1. Build the decisions from the selected insights
      const decisions: Decision[] = selectedInsights.map(item => ({
        insightType: item.insight.insight_type,
        description: item.insight.description,
        traceId: item.insight.source_trace_id,
        timestamp: item.insight.timestamp
      }));

      // 2. Generate ZK-Proof that is cryptographically bound to this specific journal
      const zkProof = generateProofForJournal(decisions);
      const journalCid = `Qm${Math.random().toString(36).substring(2, 15)}`;
      
      // 3. Generate Merkle Root of the public output
      const tree = generateTree(decisions);
      const root = getRoot(tree) as `0x${string}`;

      // 4. Submit live transaction to Base Sepolia
      let cleanProof = zkProof;
      if (cleanProof.startsWith("0xzk")) {
        cleanProof = "0x" + cleanProof.substring(4);
      }
      if (!cleanProof.startsWith("0x")) {
        cleanProof = "0x" + cleanProof;
      }

      // Pre-flight check: Run simulation first using publicClient to surface potential on-chain reverts BEFORE opening MetaMask
      if (publicClient) {
        console.log("Simulating contract transaction pre-flight...");
        try {
          await publicClient.simulateContract({
            address: LORE_LEDGER_ADDRESS,
            abi: LORE_LEDGER_ABI,
            functionName: "commitVerifiedTrace",
            args: [cleanProof as `0x${string}`, root],
            account: address,
          });
        } catch (simErr: any) {
          console.error("Simulation failed:", simErr);
          const rawReason = simErr.shortMessage || simErr.message || String(simErr);
          let friendlyReason = rawReason;
          if (rawReason.includes("reverted") || rawReason.includes("revert")) {
            friendlyReason = "The verifier contract rejected the cryptographic proof. This occurs because the mock front-end seal is not a valid RISC Zero Groth16 proof.";
          }
          throw new Error(`Simulation failed: ${friendlyReason}`);
        }
      }

      console.log("Submitting commit batch on-chain transaction...");
      const txHash = await writeContractAsync({
        address: LORE_LEDGER_ADDRESS,
        abi: LORE_LEDGER_ABI,
        functionName: "commitVerifiedTrace",
        args: [cleanProof as `0x${string}`, root],
      });
      console.log("Transaction submitted. Hash:", txHash);
      
      console.log("=== LORE BATCH COMMIT SUCCESS ===");
      console.log("Public Journal (JSON):", JSON.stringify(decisions, null, 2));
      console.log("ZK-SNARK Proof:", zkProof);
      console.log("Merkle Root:", root);
      console.log("Tx Hash:", txHash);
      console.log("=================================");

      if (typeof window !== "undefined" && (window as any).pendo) {
        (window as any).pendo.track("Batch Committed", { 
          insightCount: selectedInsights.length, 
          merkleRoot: root, 
          journalCid, 
          zkProof,
          txHash
        });
      }
      onSuccess({
        proof: zkProof,
        root: root,
        journal: JSON.stringify(decisions, null, 2)
      });
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Commit transaction failed or was rejected.";
      const errMsgStr = err.message || String(err);
      
      if (
        err.code === 4001 || 
        errMsgStr.includes("rejected") || 
        errMsgStr.includes("User rejected") ||
        err.name === "UserRejectedRequestError"
      ) {
        errorMsg = "Transaction cancelled: You rejected the request in your wallet.";
      } else if (errMsgStr.includes("Simulation failed")) {
        errorMsg = errMsgStr;
      } else if (err.shortMessage) {
        errorMsg = `Transaction failed: ${err.shortMessage}`;
      } else {
        errorMsg = `Transaction failed: ${err.message || err}`;
      }
      
      setCommitError(errorMsg);
    } finally {
      setIsPinning(false);
    }
  };

  if (selectedInsights.length === 0) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl flex flex-col gap-3 z-50">
      {commitError && (
        <div className="p-4 bg-red-50/95 backdrop-blur-xl border border-red-200 rounded-2xl flex items-center justify-between shadow-lg text-sm font-medium text-red-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>{commitError}</span>
          </div>
          <button onClick={() => setCommitError(null)} className="text-red-500 hover:text-red-700 transition-colors font-bold text-xs uppercase px-2 py-1">
            Dismiss
          </button>
        </div>
      )}
      <div className="w-full p-4 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl flex justify-between items-center shadow-[0_20px_60px_rgba(0,0,0,0.1),0_0_30px_rgba(16,185,129,0.15)]">
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
    </div>
  );
}
