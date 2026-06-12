"use client";

import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    // Mock fetching from the Go backend's Reputation module
    const mockAgents: Agent[] = [
      { id: "agent-001", name: "Alpha Protocol", successCount: 120, failCount: 0, score: 100, status: "TRUSTED" },
      { id: "agent-002", name: "Beta Node", successCount: 45, failCount: 1, score: 78.2, status: "WARNING" },
      { id: "agent-003", name: "Rogue Vector", successCount: 50, failCount: 4, score: 38.5, status: "SLASHED" },
      { id: "agent-004", name: "Omega Core", successCount: 12, failCount: 0, score: 100, status: "TRUSTED" }
    ];
    setAgents(mockAgents.sort((a, b) => b.score - a.score));
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-emerald-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-900/10 blur-[150px]"></div>
      </div>
      
      <Header />

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
                    {agent.status === "TRUSTED" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">Trusted Partner</Badge>}
                    {agent.status === "WARNING" && <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20">At Risk</Badge>}
                    {agent.status === "SLASHED" && <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20">Slashed / Banned</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
