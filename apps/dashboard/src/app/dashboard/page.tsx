"use client";

import { useState, useEffect } from "react";
import { FeedCard } from "@/components/FeedCard";
import { BatchCommit } from "@/components/BatchCommit";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { VerificationPortal } from "@/components/VerificationPortal";
import { OnboardingCards } from "@/components/OnboardingCards";
import { Activity, ShieldCheck, Server, Wallet, LogOut, Cpu, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"feed" | "verify" | "agents">("feed");
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const { isConnected, address } = useAccount();
  const { connect } = useConnect({
    mutation: {
      onSuccess(data) {
        if (typeof window !== "undefined" && (window as any).pendo) {
          (window as any).pendo.track("Wallet Connected", { chainId: data.chainId });
        }
      }
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
    if (!apiToken) return;
    fetch(`${API_BASE}/api/v2/insights`, {
      headers: {
        "Authorization": `Bearer ${apiToken}`,
      },
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [API_BASE, apiToken]);

  useEffect(() => {
    if (!apiToken || activeTab !== "agents") return;
    
    setAgentsLoading(true);
    fetch(`${API_BASE}/api/v1/leaderboard`, {
      headers: {
        "Authorization": `Bearer ${apiToken}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setAgents(data.sort((a: any, b: any) => b.score - a.score));
        } else {
          // Fallback mock data
          const mockAgents = [
            { id: "agent-001", name: "Alpha Protocol (Mock)", successCount: 120, failCount: 0, score: 100, status: "TRUSTED" },
            { id: "agent-002", name: "Beta Node (Mock)", successCount: 45, failCount: 1, score: 78.2, status: "WARNING" },
            { id: "agent-003", name: "Rogue Vector (Mock)", successCount: 50, failCount: 4, score: 38.5, status: "SLASHED" },
            { id: "agent-004", name: "Omega Core (Mock)", successCount: 12, failCount: 0, score: 100, status: "TRUSTED" }
          ];
          setAgents(mockAgents.sort((a: any, b: any) => b.score - a.score));
        }
      })
      .catch(err => {
        console.warn("Leaderboard API unreachable, using fallback mock data:", err);
        const mockAgents = [
          { id: "agent-001", name: "Alpha Protocol (Mock)", successCount: 120, failCount: 0, score: 100, status: "TRUSTED" },
          { id: "agent-002", name: "Beta Node (Mock)", successCount: 45, failCount: 1, score: 78.2, status: "WARNING" },
          { id: "agent-003", name: "Rogue Vector (Mock)", successCount: 50, failCount: 4, score: 38.5, status: "SLASHED" },
          { id: "agent-004", name: "Omega Core (Mock)", successCount: 12, failCount: 0, score: 100, status: "TRUSTED" }
        ];
        setAgents(mockAgents.sort((a: any, b: any) => b.score - a.score));
      })
      .finally(() => setAgentsLoading(false));
  }, [API_BASE, apiToken, activeTab]);

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
            <span className="font-medium">Insights Feed</span>
          </button>
          <button 
            onClick={() => setActiveTab("verify")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'verify' ? 'bg-white border border-slate-200 shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">Proof Verifier</span>
          </button>
          <button 
            onClick={() => setActiveTab("agents")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'agents' ? 'bg-white border border-slate-200 shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'}`}
          >
            <Server className="w-5 h-5" />
            <span className="font-medium">Agent Status</span>
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
            {activeTab === "feed" && "Insights Feed"}
            {activeTab === "verify" && "Proof Verifier"}
            {activeTab === "agents" && "Agent Status"}
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
                    <p className="text-emerald-600 font-medium">Loading insights from your agents...</p>
                  </div>
                </div>
              )}
              {data?.insights?.length === 0 && (
                <div className="text-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-slate-500">No insights yet. Make sure your agents are running to start generating data.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "verify" && (
            <div className="max-w-4xl mx-auto p-10 bg-white border border-slate-200 rounded-3xl shadow-xl">
               <h2 className="text-2xl font-bold mb-2 text-slate-900">Verify a Proof</h2>
               <p className="text-slate-500 mb-8">Paste the proof data and on-chain Merkle root from a previous commit to verify that the AI-generated insight hasn't been tampered with.</p>
               <VerificationPortal />
            </div>
          )}

          {activeTab === "agents" && (
             <div className="max-w-4xl mx-auto space-y-8">
               {/* Header Card */}
               <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex justify-between items-center shadow-sm">
                 <div className="text-left">
                   <h3 className="text-xl font-bold text-slate-900 mb-1">Global Trust Leaderboard</h3>
                   <p className="text-slate-500 text-sm">Real-time mathematical evaluation of active agent reliability. Agents falling below 60% are automatically locked and banned.</p>
                 </div>
                 <Button 
                   onClick={() => {
                     setAgentsLoading(true);
                     fetch(`${API_BASE}/api/v1/leaderboard`, {
                       headers: {
                         "Authorization": `Bearer ${apiToken}`,
                       },
                     })
                       .then(res => res.json())
                       .then(data => {
                         if (data && data.length > 0) setAgents(data.sort((a: any, b: any) => b.score - a.score));
                       })
                       .catch(console.error)
                       .finally(() => setAgentsLoading(false));
                   }}
                   variant="outline"
                   className="flex items-center gap-2 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                 >
                   <RefreshCw className={`w-4 h-4 ${agentsLoading ? 'animate-spin' : ''}`} />
                   Sync Status
                 </Button>
               </div>

               {/* Pipeline Status Overview */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                     <Cpu className="w-5 h-5 text-emerald-600 animate-pulse" />
                   </div>
                   <div className="text-left">
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Scout Ingestor</p>
                     <p className="text-sm font-semibold text-emerald-600">Active & Polling</p>
                   </div>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                     <ShieldCheck className="w-5 h-5 text-emerald-600 animate-pulse" />
                   </div>
                   <div className="text-left">
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Analyst ZKVM</p>
                     <p className="text-sm font-semibold text-emerald-600">Active & Proving</p>
                   </div>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                     <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                   </div>
                   <div className="text-left">
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Narrative (Gemini)</p>
                     <p className="text-sm font-semibold text-emerald-600">Active & Synthesizing</p>
                   </div>
                 </div>
               </div>

               {/* Agent Table */}
               <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                 {agentsLoading ? (
                   <div className="text-center p-12">
                     <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-slate-500 font-medium">Syncing agent reputation indexes...</p>
                   </div>
                 ) : (
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="border-b border-slate-100 bg-slate-50">
                         <th className="p-5 text-xs font-bold tracking-wider text-slate-500 uppercase">Agent ID</th>
                         <th className="p-5 text-xs font-bold tracking-wider text-slate-500 uppercase">Telemetry Verification</th>
                         <th className="p-5 text-xs font-bold tracking-wider text-slate-500 uppercase">Trust Score</th>
                         <th className="p-5 text-xs font-bold tracking-wider text-slate-500 uppercase text-right">System Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {agents.map((agent) => (
                         <tr key={agent.id} className={`transition-colors hover:bg-slate-50/50 ${agent.status === "SLASHED" ? "bg-red-50/10" : ""}`}>
                           <td className="p-5 text-left">
                             <div className="font-bold text-slate-900">{agent.name}</div>
                             <div className="text-xs text-slate-400 font-mono mt-1">{agent.id}</div>
                           </td>
                           <td className="p-5 text-left">
                             <div className="flex items-center gap-3 text-sm font-semibold">
                               <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{agent.successCount} ✓</span>
                               <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">{agent.failCount} ✗</span>
                             </div>
                           </td>
                           <td className="p-5 text-left">
                             <div className="font-mono text-xl font-bold text-slate-900">
                               {agent.score.toFixed(1)}%
                             </div>
                           </td>
                           <td className="p-5 text-right">
                             {agent.status === "TRUSTED" && (
                               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                 <CheckCircle2 className="w-3.5 h-3.5" /> Trusted Partner
                               </span>
                             )}
                             {agent.status === "WARNING" && (
                               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                 <AlertTriangle className="w-3.5 h-3.5" /> At Risk
                               </span>
                             )}
                             {agent.status === "SLASHED" && (
                               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-700 border border-red-500/20">
                                 <XCircle className="w-3.5 h-3.5" /> Slashed / Banned
                               </span>
                             )}
                           </td>
                         </tr>
                       ))}
                       {agents.length === 0 && (
                         <tr>
                           <td colSpan={4} className="text-center p-12 text-slate-500">
                             No agent records found. Ensure telemetry is processed to index active agent systems.
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 )}
               </div>
             </div>
          )}
        </div>

        {/* Floating Action Bar */}
        {activeTab === "feed" && <BatchCommit selectedInsights={selectedInsights} onSuccess={() => setSelectedIds(new Set())} />}
        <OnboardingCards />
      </main>
    </div>
  );
}
