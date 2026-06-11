"use client";

import { useState, useEffect } from "react";
import { FeedCard } from "@/components/FeedCard";
import { BatchCommit } from "@/components/BatchCommit";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { VerificationPortal } from "@/components/VerificationPortal";
import { Activity, ShieldCheck, Server, Wallet } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"feed" | "verify" | "agents">("feed");
  const { isConnected, address } = useAccount();
  const { connect } = useConnect();

  useEffect(() => {
    fetch("http://localhost:8080/api/v2/insights")
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const selectedInsights = data?.insights?.filter((i: any) => selectedIds.has(i.insight.source_trace_id)) || [];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-indigo-500/20 bg-slate-950/80 flex flex-col pt-8">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Lore</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab("feed")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'feed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Live Feed</span>
          </button>
          <button 
            onClick={() => setActiveTab("verify")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'verify' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">Audit Portal</span>
          </button>
          <button 
            onClick={() => setActiveTab("agents")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'agents' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
          >
            <Server className="w-5 h-5" />
            <span className="font-medium">Agent Pipeline</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-indigo-500/20">
          {isConnected ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-lg border border-slate-800">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-sm text-slate-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          ) : (
            <Button 
              onClick={() => connect({ connector: injected() })}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all border-none"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Header Grid */}
        <header className="h-20 border-b border-indigo-500/10 bg-slate-950/80 backdrop-blur-sm flex items-center px-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
            {activeTab === "feed" && "Live Action Feed"}
            {activeTab === "verify" && "Cryptographic Portal"}
            {activeTab === "agents" && "Agent Pipeline Overview"}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-10 pb-32">
          {activeTab === "feed" && (
            <div className="max-w-4xl mx-auto">
              {data?.insights?.map((insight: any) => (
                <FeedCard 
                  key={insight.insight.source_trace_id}
                  insight={insight}
                  isSelected={selectedIds.has(insight.insight.source_trace_id)}
                  onSelect={(checked) => toggleSelect(insight.insight.source_trace_id, checked)}
                />
              ))}
              {!data && (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-indigo-400 font-medium">Intercepting AI signals...</p>
                  </div>
                </div>
              )}
              {data?.insights?.length === 0 && (
                <div className="text-center p-12 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-500">No anomalies detected in the current stream.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "verify" && (
            <div className="max-w-4xl mx-auto p-8 bg-slate-900/50 backdrop-blur border border-indigo-500/20 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
               <h2 className="text-xl font-bold mb-2 text-indigo-100">Zero-Trust Verification</h2>
               <p className="text-sm text-indigo-300/70 mb-8">Paste your IPFS CID and on-chain Merkle Root to mathematically verify the AI trace.</p>
               <VerificationPortal />
            </div>
          )}

          {activeTab === "agents" && (
             <div className="max-w-4xl mx-auto text-center p-12 border border-slate-800 rounded-xl bg-slate-900/30">
               <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
               <p className="text-slate-400">Agent telemetry metrics offline. (Pipeline UI placeholder)</p>
             </div>
          )}
        </div>

        {/* Floating Action Bar */}
        {activeTab === "feed" && <BatchCommit selectedInsights={selectedInsights} onSuccess={() => setSelectedIds(new Set())} />}
      </main>
    </div>
  );
}
