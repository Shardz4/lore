"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  Terminal, 
  Cpu, 
  Database, 
  Activity, 
  Play, 
  ArrowRight, 
  Server, 
  ShieldCheck, 
  Zap, 
  Code
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interface for simulated events
interface LogEvent {
  id: string;
  time: string;
  type: "info" | "success" | "warn" | "error";
  message: string;
}

export default function GettingStarted() {
  const router = useRouter();
  const [activeTabLeft, setActiveTabLeft] = useState<"env" | "code">("env");
  const [activeTabRight, setActiveTabRight] = useState<"payload" | "code">("payload");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  // Option 1: MCP Polling state
  const [isPolling, setIsPolling] = useState(true);
  const [mcpLogs, setMcpLogs] = useState<LogEvent[]>([
    { id: "1", time: "12:04:10", type: "info", message: "Scout Agent initializing connection to http://localhost:8080/mcp..." },
    { id: "2", time: "12:04:11", type: "success", message: "Connected to Novus MCP Server v1.0.0" },
    { id: "3", time: "12:04:15", type: "info", message: "Polling tool 'get_behavioral_events'..." },
    { id: "4", time: "12:04:15", type: "success", message: "Fetched 1 new event: action=login_success agent=agent-001" },
  ]);

  // Option 2: Redis Push state
  const [redisLogs, setRedisLogs] = useState<LogEvent[]>([
    { id: "1", time: "12:05:00", type: "info", message: "Redis Client connecting to redis://localhost:6379..." },
    { id: "2", time: "12:05:01", type: "success", message: "Connection established successfully." },
  ]);

  // Code snippets
  const mcpEnvCode = `# agents/scout-agent/.env
NOVUS_MCP_ENDPOINT=http://localhost:8080/mcp
AGENT_ID=agent-001
POLL_INTERVAL=10s`;

  const mcpServerCode = `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new Server({
  name: "my-custom-agent",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});

// Register the tool Lore looks for
server.tool("get_behavioral_events", "Get agent logs", {}, async () => {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        action: "trade_execution",
        agent: "alpha-trader",
        data: { token: "SOL", amount: 15.4 }
      })
    }]
  };
});`;

  const redisPayloadCode = `{
  "event": "agent_action",
  "metadata": {
    "timestamp": 1718567300000,
    "telemetry": {
      "trace_id": "tx-9921a-bc3",
      "agent_id": "alpha-trader"
    }
  },
  "data": {
    "action": "trade_execution",
    "details": { "token": "SOL", "amount": 15.4 }
  }
}`;

  const redisPushCode = `import { createClient } from "redis";

const client = createClient({ url: "redis://localhost:6379" });
await client.connect();

const payload = {
  event: "agent_action",
  metadata: JSON.stringify({
    timestamp: Date.now(),
    telemetry: { trace_id: "tx-9921a-bc3", agent_id: "alpha-trader" }
  }),
  data: JSON.stringify({
    action: "trade_execution",
    details: { token: "SOL", amount: 15.4 }
  })
};

// Publish directly to the raw stream
await client.xAdd("lore:stream:raw", "*", payload);`;

  // Simulate MCP Polling ticks
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const newLog: LogEvent = {
        id: String(Date.now()),
        time: timeStr,
        type: Math.random() > 0.85 ? "warn" : "success",
        message: Math.random() > 0.85 
          ? "Fetched events with warnings: rate limit warning from source endpoint"
          : `Polled get_behavioral_events: fetched trace_${Math.floor(Math.random() * 1000)} successfully`
      };
      setMcpLogs(prev => [newLog, ...prev.slice(0, 4)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPolling]);

  // Handle direct Redis push simulation
  const handleSimulateRedisPush = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const newLogs: LogEvent[] = [
      {
        id: String(Date.now()),
        time: timeStr,
        type: "info",
        message: `XADD lore:stream:raw * event=agent_action trace_id=tx-${Math.floor(Math.random() * 10000)}`
      },
      {
        id: String(Date.now() + 1),
        time: timeStr,
        type: "success",
        message: "Stream payload committed. Rust zkVM Analyst successfully verified transaction."
      }
    ];
    setRedisLogs(prev => [...newLogs, ...prev].slice(0, 5));
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden relative flex flex-col">
      {/* Dynamic Background Grid and Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-25"></div>
      
      {/* Top Header */}
      <header className="relative z-30 w-full px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="font-medium text-lg tracking-tight flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            </div>
            lore <span className="text-slate-500 text-xs font-normal">/ integration-guide</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
          >
            Enter Dashboard
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Title Banner */}
      <div className="relative z-20 text-center pt-8 pb-4 px-6 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          Connect Your Agent System
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
          Choose a pipeline integration that suits your software architecture. Complete the steps to feed cryptographically provable telemetry into the Lore network.
        </p>
      </div>

      {/* Split Screen Giant Cards Container */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch mt-4">
        
        {/* ==================== CARD 1: OPTION 1 ==================== */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="group relative bg-[#070707]/90 border border-white/5 hover:border-emerald-500/20 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between transition-all shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>

          <div>
            {/* Header / Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                Option 01
              </div>
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Pull Ingestion Model</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white mb-3">
              Model Context Protocol (MCP)
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Lore's built-in <strong>Scout Agent</strong> connects to your application over HTTP using Server-Sent Events (SSE). It polls your agent dynamically for traces and acts as the secure validator interface.
            </p>

            {/* In-Card Visual Pipeline */}
            <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-4 mb-6 relative">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3">
                <span>Data Flow Architecture</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Pull
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center py-2">
                <div className="px-3 py-2 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center w-full sm:w-auto">
                  <div className="font-semibold text-emerald-300 text-xs">Your Agent/App</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">MCP Server</div>
                </div>
                <div className="flex items-center justify-center my-1 sm:my-0">
                  <ArrowRight className="w-4 h-4 text-emerald-500/50 hidden sm:block rotate-0" />
                  <ArrowRight className="w-4 h-4 text-emerald-500/50 block sm:hidden rotate-90" />
                </div>
                <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-center w-full sm:w-auto">
                  <div className="font-semibold text-white text-xs">Scout Agent</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">SSE Client Poller</div>
                </div>
                <div className="flex items-center justify-center my-1 sm:my-0">
                  <ArrowRight className="w-4 h-4 text-emerald-500/50 hidden sm:block" />
                  <ArrowRight className="w-4 h-4 text-emerald-500/50 block sm:hidden rotate-90" />
                </div>
                <div className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-center w-full sm:w-auto">
                  <div className="font-semibold text-slate-300 text-xs">Lore Broker</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">zkVM Processing</div>
                </div>
              </div>
            </div>

            {/* Interactive Code / Env Configuration Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                <button 
                  onClick={() => setActiveTabLeft("env")}
                  className={`text-xs font-semibold px-2 py-1 transition-all rounded ${activeTabLeft === "env" ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  1. Configure Environment
                </button>
                <button 
                  onClick={() => setActiveTabLeft("code")}
                  className={`text-xs font-semibold px-2 py-1 transition-all rounded ${activeTabLeft === "code" ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  2. MCP Server Code
                </button>
              </div>

              <div className="relative bg-black/60 rounded-xl border border-white/5 p-4 font-mono text-xs overflow-x-auto min-h-[160px] max-h-[260px] group/code">
                <button 
                  onClick={() => copyToClipboard(activeTabLeft === "env" ? mcpEnvCode : mcpServerCode, "left")}
                  className="absolute top-3 right-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-1.5 rounded transition-all opacity-0 group-hover/code:opacity-100"
                  title="Copy snippet"
                >
                  {copiedSection === "left" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {activeTabLeft === "env" ? (
                  <pre className="text-slate-300 leading-relaxed">{mcpEnvCode}</pre>
                ) : (
                  <pre className="text-slate-300 leading-relaxed">{mcpServerCode}</pre>
                )}
              </div>
            </div>

            {/* Live Polling Visualizer */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Scout Ingestion Simulator</span>
                </div>
                <button 
                  onClick={() => setIsPolling(!isPolling)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all flex items-center gap-1 ${isPolling ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-400"}`}
                >
                  <Activity className={`w-3 h-3 ${isPolling ? "animate-pulse" : ""}`} />
                  {isPolling ? "Polling Live" : "Paused"}
                </button>
              </div>

              <div className="font-mono text-[10px] space-y-1.5 max-h-[110px] overflow-y-auto pr-2">
                <AnimatePresence initial={false}>
                  {mcpLogs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 text-slate-400"
                    >
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span className={log.type === "success" ? "text-emerald-400" : log.type === "warn" ? "text-amber-400" : "text-slate-300"}>
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Perfect for: Isolated hosts, Node.js/Python agent platforms.</span>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto bg-emerald-500 text-black hover:bg-emerald-400 px-5 py-2 rounded-full text-xs font-semibold text-center transition-all"
            >
              Verify Endpoint
            </Link>
          </div>
        </motion.div>

        {/* ==================== CARD 2: OPTION 2 ==================== */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="group relative bg-[#070707]/90 border border-white/5 hover:border-violet-500/20 rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between transition-all shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-violet-500/10 transition-colors"></div>

          <div>
            {/* Header / Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
                <Database className="w-3.5 h-3.5" />
                Option 02
              </div>
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Push Ingestion Model</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white mb-3">
              Direct Redis Stream Ingestion
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Bypass the Scout Agent polling setup. Write telemetry events and agent trace logs directly to Lore's internal message broker stream from your custom service wrapper.
            </p>

            {/* In-Card Visual Pipeline */}
            <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-4 mb-6 relative">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-3">
                <span>Data Flow Architecture</span>
                <span className="flex items-center gap-1 text-violet-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                  Active Push
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center py-2">
                <div className="px-3 py-2 bg-[#0d0a14] border border-violet-500/30 rounded-xl text-center w-full sm:w-auto">
                  <div className="font-semibold text-violet-300 text-xs">Your Agent/App</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Custom client</div>
                </div>
                <div className="flex items-center justify-center my-1 sm:my-0">
                  <ArrowRight className="w-4 h-4 text-violet-500/50 hidden sm:block" />
                  <ArrowRight className="w-4 h-4 text-violet-500/50 block sm:hidden rotate-90" />
                </div>
                <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-center w-full sm:w-auto">
                  <div className="font-semibold text-white text-xs">Redis stream</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">lore:stream:raw</div>
                </div>
                <div className="flex items-center justify-center my-1 sm:my-0">
                  <ArrowRight className="w-4 h-4 text-violet-500/50 hidden sm:block" />
                  <ArrowRight className="w-4 h-4 text-violet-500/50 block sm:hidden rotate-90" />
                </div>
                <div className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-center w-full sm:w-auto">
                  <div className="font-semibold text-slate-300 text-xs">Lore Broker</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">zkVM Processing</div>
                </div>
              </div>
            </div>

            {/* Interactive Code / Env Configuration Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                <button 
                  onClick={() => setActiveTabRight("payload")}
                  className={`text-xs font-semibold px-2 py-1 transition-all rounded ${activeTabRight === "payload" ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  1. JSON Payload Spec
                </button>
                <button 
                  onClick={() => setActiveTabRight("code")}
                  className={`text-xs font-semibold px-2 py-1 transition-all rounded ${activeTabRight === "code" ? "bg-white/5 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  2. Redis Publisher Code
                </button>
              </div>

              <div className="relative bg-black/60 rounded-xl border border-white/5 p-4 font-mono text-xs overflow-x-auto min-h-[160px] max-h-[260px] group/code">
                <button 
                  onClick={() => copyToClipboard(activeTabRight === "payload" ? redisPayloadCode : redisPushCode, "right")}
                  className="absolute top-3 right-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-1.5 rounded transition-all opacity-0 group-hover/code:opacity-100"
                  title="Copy snippet"
                >
                  {copiedSection === "right" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {activeTabRight === "payload" ? (
                  <pre className="text-slate-300 leading-relaxed">{redisPayloadCode}</pre>
                ) : (
                  <pre className="text-slate-300 leading-relaxed">{redisPushCode}</pre>
                )}
              </div>
            </div>

            {/* Direct Push Interactive Simulator */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold text-slate-300">Redis Stream Logger</span>
                </div>
                <button 
                  onClick={handleSimulateRedisPush}
                  className="text-[10px] bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1 rounded-lg transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:scale-105 active:scale-95"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  Trigger Test Push
                </button>
              </div>

              <div className="font-mono text-[10px] space-y-1.5 max-h-[110px] overflow-y-auto pr-2">
                <AnimatePresence initial={false}>
                  {redisLogs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 text-slate-400"
                    >
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span className={log.type === "success" ? "text-emerald-400" : "text-slate-300"}>
                        {log.message}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">Perfect for: High-throughput events, low-latency microservices.</span>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto bg-violet-600 text-white hover:bg-violet-500 px-5 py-2 rounded-full text-xs font-semibold text-center transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]"
            >
              Verify Stream
            </Link>
          </div>
        </motion.div>

      </main>

      {/* Footer Details */}
      <footer className="relative z-20 w-full px-6 py-6 border-t border-white/5 bg-black/40 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 Lore Protocol. All telemetry pipelines are verified cryptographically in RISC Zero zkVM guest circuits.</p>
      </footer>
    </div>
  );
}
