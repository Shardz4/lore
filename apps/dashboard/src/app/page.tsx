"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function SplashScreen() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] font-sans overflow-x-hidden selection:bg-white/20 relative">
      
      {/* Background ambient light */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.05] via-[#030303]/0 to-transparent pointer-events-none -z-10"></div>

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
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="https://github.com/lore-cybernetics" target="_blank" className="hover:text-white transition-colors">GitHub</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-8">
          {/* Dropdown Container */}
          <div className="relative group py-4">
            <button className="text-[14px] font-medium text-slate-400 hover:text-white transition-colors">
              Log in
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-2 w-56 bg-[#0a0a0a] rounded-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 py-2 z-50 shadow-2xl backdrop-blur-xl">
              <button onClick={signInWithGoogle} className="w-full text-left px-5 py-3 text-[14px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </div>
          </div>

          <button onClick={signInWithGoogle} className="bg-white text-black px-6 py-2.5 rounded-full text-[14px] font-medium hover:bg-slate-200 transition-colors hidden sm:block">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full min-h-screen flex items-center justify-center pt-20">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-300 text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Lore Protocol is now live
          </div>

          <h1 className="text-6xl md:text-[6rem] font-medium tracking-tight mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-slate-500">
            Decentralized <br /> Intelligence
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-normal tracking-wide max-w-2xl mb-12 leading-relaxed">
            Lore provides the unified infrastructure required to build, connect, execute, and trade autonomous behavioral workflows seamlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button onClick={signInWithGoogle} className="bg-white text-black px-8 py-4 rounded-full text-[15px] font-medium hover:bg-slate-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center gap-2">
              Enter Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
            <Link href="#features" className="bg-white/[0.03] backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-full text-[15px] font-medium hover:bg-white/[0.08] transition-all">
              Explore Protocol
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-20 bg-[#030303] py-32 border-t border-white/[0.05]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-24 text-center">
            <h2 className="text-4xl font-medium text-white mb-4 tracking-tight">Core Pillars</h2>
            <p className="text-lg text-slate-500 font-normal">The foundation of the most secure, verifiable behavioral intelligence platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-3 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="w-full h-[200px] bg-[#0a0a0a] rounded-3xl overflow-hidden mb-8 relative border border-white/[0.02]">
                <img src="/croo_card_build.png" alt="Verifiable Workflows" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 filter grayscale contrast-150" />
              </div>
              <div className="px-4 pb-6">
                <h3 className="text-xl font-medium text-white mb-3 tracking-tight">Verifiable Workflows</h3>
                <p className="text-slate-400 text-[14px] leading-relaxed font-normal">
                  Every action and behavioral trace is cryptographically signed and committed on-chain, ensuring absolute tamper-proof verification.
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-3 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="w-full h-[200px] bg-[#0a0a0a] rounded-3xl overflow-hidden mb-8 relative border border-white/[0.02]">
                <img src="/croo_card_connect.png" alt="Agentic Observability" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 filter grayscale contrast-150" />
              </div>
              <div className="px-4 pb-6">
                <h3 className="text-xl font-medium text-white mb-3 tracking-tight">Agentic Observability</h3>
                <p className="text-slate-400 text-[14px] leading-relaxed font-normal">
                  Achieve unprecedented visibility into decentralized networks. Monitor, trace, and debug complex multi-agent workflows in real-time.
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-3 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="w-full h-[200px] bg-[#0a0a0a] rounded-3xl overflow-hidden mb-8 relative border border-white/[0.02]">
                <img src="/croo_card_execute.png" alt="Digital Resilience" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 filter grayscale contrast-150" />
              </div>
              <div className="px-4 pb-6">
                <h3 className="text-xl font-medium text-white mb-3 tracking-tight">Digital Resilience</h3>
                <p className="text-slate-400 text-[14px] leading-relaxed font-normal">
                  Built for mission-critical deployments. When disruption isn't an option, our fault-tolerant infrastructure guarantees uptime.
                </p>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-3 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="w-full h-[200px] bg-[#0a0a0a] rounded-3xl overflow-hidden mb-8 relative border border-white/[0.02]">
                <img src="/croo_card_trade.png" alt="Immutable Ledgers" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 filter grayscale contrast-150" />
              </div>
              <div className="px-4 pb-6">
                <h3 className="text-xl font-medium text-white mb-3 tracking-tight">Immutable Ledgers</h3>
                <p className="text-slate-400 text-[14px] leading-relaxed font-normal">
                  Leverage decentralized storage layers to maintain a permanent, immutable record of all system behaviors and decisions.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
