"use client";

import { useState, useEffect } from "react";
import { FeedCard } from "@/components/FeedCard";
import { BatchCommit } from "@/components/BatchCommit";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { VerificationPortal } from "@/components/VerificationPortal";
import { Activity, ShieldCheck, Server, Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"feed" | "verify" | "agents">("feed");
  const { isConnected, address } = useAccount();
  const { connect } = useConnect({
    mutation: {
      onSuccess(data) {
        if (typeof window !== "undefined" && (window as any).pendo) {
          (window as any).pendo.track("Wallet Connected", { walletAddress: data.accounts[0], chainId: data.chainId });
        }
      }
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col pt-8">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Lore</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab("feed")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'feed' ? 'bg-white border border-slate-200 shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Live Feed</span>
          </button>
          <button 
            onClick={() => setActiveTab("verify")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'verify' ? 'bg-white border border-slate-200 shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">Audit Portal</span>
          </button>
          <button 
            onClick={() => setActiveTab("agents")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'agents' ? 'bg-white border border-slate-200 shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'}`}
          >
            <Server className="w-5 h-5" />
            <span className="font-medium">Agent Pipeline</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-200 flex flex-col gap-2">
          <div className="px-4 py-2 bg-white rounded-xl flex items-center gap-3 mb-2 border border-slate-200 shadow-sm">
             <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold uppercase">
               {user?.email?.charAt(0) || "U"}
             </div>
             <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-semibold text-slate-900 truncate">{user?.displayName || "Operator"}</span>
               <button onClick={logout} className="text-xs text-slate-500 hover:text-red-500 text-left transition-colors flex items-center gap-1">
                 <LogOut className="w-3 h-3" /> Disconnect
               </button>
             </div>
          </div>
          {isConnected ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-sm text-slate-600">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          ) : (
            <Button 
              onClick={() => connect({ connector: injected() })}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all border-none shadow-sm rounded-xl"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-white">
        {/* Header Grid */}
        <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center px-10 z-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
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
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-emerald-600 font-medium">Intercepting AI signals...</p>
                  </div>
                </div>
              )}
              {data?.insights?.length === 0 && (
                <div className="text-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-slate-500">No anomalies detected in the current stream.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "verify" && (
            <div className="max-w-4xl mx-auto p-10 bg-white border border-slate-200 rounded-3xl shadow-xl">
               <h2 className="text-2xl font-bold mb-2 text-slate-900">Zero-Trust Verification</h2>
               <p className="text-slate-500 mb-8">Paste your IPFS CID and on-chain Merkle Root to mathematically verify the AI trace.</p>
               <VerificationPortal />
            </div>
          )}

          {activeTab === "agents" && (
             <div className="max-w-4xl mx-auto text-center p-16 border border-slate-200 rounded-3xl bg-slate-50">
               <Server className="w-16 h-16 text-slate-400 mx-auto mb-4" />
               <p className="text-slate-500 text-lg">Agent telemetry metrics offline. (Pipeline UI placeholder)</p>
             </div>
          )}
        </div>

        {/* Floating Action Bar */}
        {activeTab === "feed" && <BatchCommit selectedInsights={selectedInsights} onSuccess={() => setSelectedIds(new Set())} />}
      </main>
    </div>
  );
}
