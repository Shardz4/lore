"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";

type Agent = {
  id: string;
  name: string;
  successCount: number;
  failCount: number;
  score: number;
  status: "TRUSTED" | "WARNING" | "SLASHED";
};

export default function Leaderboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    async function fetchLeaderboard() {
      let token = process.env.NEXT_PUBLIC_API_BEARER_TOKEN || "lore_default_secret_api_token";
      if (user && user.uid !== "mock_user") {
        try {
          token = await user.getIdToken();
        } catch (e) {
          console.error("Error getting ID token:", e);
        }
      }

      try {
        const res = await fetch(`${API_BASE}/api/v1/leaderboard`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();

        if (data && data.length > 0) {
          setAgents(data.sort((a: any, b: any) => b.score - a.score));
        } else {
          setAgents([]);
        }
        setBackendOnline(true);
      } catch (err) {
        console.warn("Leaderboard API unreachable:", err);
        setAgents([]);
        setBackendOnline(false);
      }
    }

    fetchLeaderboard();
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-emerald-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-900/10 blur-[150px]"></div>
      </div>
      
      <header className="absolute top-6 left-6 z-50">
        <a href="/dashboard" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 font-medium transition-colors">
          &larr; Back to Dashboard
        </a>
      </header>
 
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium tracking-wide mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Algorithmic Reputation
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Trust Index</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Real-time mathematical evaluation of agent reliability. 
            Agents falling below the 60% threshold are cryptographically banned from committing further data.
          </p>
        </div>
 
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01]">
                <th className="p-6 text-sm font-semibold tracking-wider text-slate-400 uppercase">Agent</th>
                <th className="p-6 text-sm font-semibold tracking-wider text-slate-400 uppercase">Proofs</th>
                <th className="p-6 text-sm font-semibold tracking-wider text-slate-400 uppercase">Trust Score</th>
                <th className="p-6 text-sm font-semibold tracking-wider text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agents.map((agent) => (
                <tr key={agent.id} className={`transition-colors hover:bg-white/[0.02] ${agent.status === "SLASHED" ? "opacity-50 grayscale" : ""}`}>
                  <td className="p-6">
                    <div className="font-bold text-lg">{agent.name}</div>
                    <div className="text-sm text-slate-500 font-mono mt-1">{agent.id}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400">{agent.successCount} ✓</span>
                      <span className="text-red-400">{agent.failCount} ✗</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-mono text-2xl font-bold">
                      {agent.score.toFixed(1)}%
                    </div>
                  </td>
                  <td className="p-6">
                    {agent.status === "TRUSTED" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition-colors hover:bg-emerald-500/20">Trusted Partner</span>}
                    {agent.status === "WARNING" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 transition-colors hover:bg-amber-500/20">At Risk</span>}
                    {agent.status === "SLASHED" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 transition-colors hover:bg-red-500/20">Slashed / Banned</span>}
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 font-medium">
                    {backendOnline
                      ? "No active agent reputation indexes found. Please ensure telemetry events are processed."
                      : "Backend offline — agent data unavailable. Please ensure the Narrative Agent is running."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
