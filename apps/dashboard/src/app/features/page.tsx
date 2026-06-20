"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function FeaturesPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-[#030303] font-sans overflow-x-hidden selection:bg-white/20 relative">

      {/* Background ambient light */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-[#030303]/0 to-transparent pointer-events-none -z-10"></div>

      {/* Floating Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl bg-black/40 backdrop-blur-xl rounded-full shadow-2xl z-50 px-8 py-3 flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-medium text-xl tracking-tight text-white flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black"></div>
            </div>
            lore
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-400">
            <Link href="/features" className="text-white transition-colors">Features</Link>
            <Link href="https://github.com/Shardz4/lore" target="_blank" className="hover:text-white transition-colors">GitHub</Link>
          </nav>
        </div>

        <div className="flex items-center gap-8">
          <div className="relative group py-4">
            <button className="text-[14px] font-medium text-slate-400 hover:text-white transition-colors">
              Log in
            </button>
            <div className="absolute top-full right-0 mt-2 w-56 bg-[#0a0a0a] rounded-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 py-2 z-50 shadow-2xl backdrop-blur-xl">
              <button onClick={signInWithGoogle} className="w-full text-left px-5 py-3 text-[14px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Continue with Google
              </button>
            </div>
          </div>
          <button onClick={signInWithGoogle} className="bg-white text-black px-6 py-2.5 rounded-full text-[14px] font-medium hover:bg-slate-200 transition-colors hidden sm:block">
            Get Started
          </button>
        </div>
      </header>

      {/* Internal Hero */}
      <main className="relative pt-48 pb-24 border-b border-white/[0.05]">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-medium tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-slate-500 leading-tight"
          >
            Decentralized Behavioral Intelligence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-normal text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Lore provides the unified infrastructure required to capture, verify, and act upon decentralized application data securely on-chain.
          </motion.p>
        </div>
      </main>

      {/* Feature Details */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-6xl space-y-40">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <div className="w-full md:w-1/2">
              <div className="w-full aspect-[4/3] bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden p-2">
                <div className="w-full h-full bg-[#0a0a0a] rounded-2xl overflow-hidden relative border border-white/[0.02]">
                  <img src="/croo_card_build.png" alt="Verifiable Workflows" className="w-full h-full object-cover opacity-80 filter grayscale contrast-150" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="inline-flex px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-400 text-xs font-medium tracking-wider uppercase mb-6">Pillar 01</div>
              <h2 className="text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight">Verifiable Workflows</h2>
              <p className="text-lg text-slate-400 leading-relaxed font-normal">
                Every action, insight, and behavioral trace within your AI network is cryptographically signed and committed on-chain. This ensures absolute tamper-proof verification and provides a flawless audit trail for mission-critical enterprise applications.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col md:flex-row-reverse items-center gap-16"
          >
            <div className="w-full md:w-1/2">
              <div className="w-full aspect-[4/3] bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden p-2">
                <div className="w-full h-full bg-[#0a0a0a] rounded-2xl overflow-hidden relative border border-white/[0.02]">
                  <img src="/croo_card_connect.png" alt="Agentic Observability" className="w-full h-full object-cover opacity-80 filter grayscale contrast-150" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="inline-flex px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-400 text-xs font-medium tracking-wider uppercase mb-6">Pillar 02</div>
              <h2 className="text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight">Agentic Observability</h2>
              <p className="text-lg text-slate-400 leading-relaxed font-normal">
                Achieve unprecedented visibility into decentralized AI networks. Our observability tools allow you to monitor, trace, and debug complex multi-agent workflows in real-time, giving you total control over decentralized execution.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col md:flex-row items-center gap-16"
          >
            <div className="w-full md:w-1/2">
              <div className="w-full aspect-[4/3] bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden p-2">
                <div className="w-full h-full bg-[#0a0a0a] rounded-2xl overflow-hidden relative border border-white/[0.02]">
                  <img src="/croo_card_execute.png" alt="Digital Resilience" className="w-full h-full object-cover opacity-80 filter grayscale contrast-150" />
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="inline-flex px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-400 text-xs font-medium tracking-wider uppercase mb-6">Pillar 03</div>
              <h2 className="text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight">Digital Resilience</h2>
              <p className="text-lg text-slate-400 leading-relaxed font-normal">
                Built for environments where disruption simply isn't an option. Our decentralized, fault-tolerant infrastructure guarantees maximum uptime and security, protecting your behavioral data against single points of failure.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

    </div>
  );
}
