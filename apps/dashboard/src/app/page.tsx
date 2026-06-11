"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Activity, ShieldCheck, Database, Fingerprint } from "lucide-react";

export default function SplashScreen() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060810] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060810] text-slate-100 font-sans overflow-hidden relative selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-6 py-20 min-h-screen flex flex-col justify-center items-center">
        
        <motion.div 
          className="text-center max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Lore Cybernetics v2.0
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-500">
              Decentralized
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]">
              Behavioral Intelligence.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Ingest user telemetry at the edge. Synthesize insights with Anthropic AI. Verify every narrative trace mathematically on the blockchain.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={signInWithGoogle}
              className="group relative px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl text-lg flex items-center gap-3 overflow-hidden transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white via-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="relative z-10">Authenticate with Google</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-32"
        >
          <motion.div variants={itemVariants} className="p-8 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:bg-slate-900/60 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Activity className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-100">Edge Telemetry</h3>
            <p className="text-slate-400 leading-relaxed">High-performance ingestion tracking rage clicks, drop-offs, and micro-interactions in real-time.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-8 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:bg-slate-900/60 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
              <Database className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-100">LLM Synthesis</h3>
            <p className="text-slate-400 leading-relaxed">Raw signals are aggregated and processed by Anthropic Claude 3.5 to generate actionable Product Insights.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-8 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:bg-slate-900/60 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Fingerprint className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-100">Zero-Trust Verification</h3>
            <p className="text-slate-400 leading-relaxed">Every insight is mathematically bound to an on-chain Merkle Root. Trust the process, verify the math.</p>
          </motion.div>
        </motion.div>

      </main>
    </div>
  );
}
