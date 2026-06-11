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
      <div className="min-h-screen bg-emerald-500 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#10b981] text-white font-sans overflow-x-hidden selection:bg-white/30 relative">
      {/* Background accents (optional, very subtle) */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>

      {/* Floating Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl bg-white rounded-full shadow-2xl z-50 px-8 py-3 flex items-center justify-between text-slate-900">
        <div className="flex items-center gap-10">
          <div className="font-black text-2xl tracking-tighter">lore<span className="text-[#10b981]">{'>'}</span></div>
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-semibold text-slate-700">
            <Link href="#" className="hover:text-[#10b981] transition-colors">Platform</Link>
            <Link href="#" className="hover:text-[#10b981] transition-colors">Security</Link>
            <Link href="#" className="hover:text-[#10b981] transition-colors">Observability</Link>
            <Link href="#" className="hover:text-[#10b981] transition-colors">Industries</Link>
            <Link href="#" className="hover:text-[#10b981] transition-colors">Resources</Link>
            <Link href="#" className="hover:text-[#10b981] transition-colors">Pricing</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-8">
          <Link href="#" className="text-[15px] font-semibold text-slate-700 hover:text-[#10b981] hidden md:block">Support</Link>
          
          {/* Dropdown Container */}
          <div className="relative group py-4">
            <button className="text-[15px] font-semibold text-slate-900 hover:text-[#10b981] flex items-center gap-1 transition-all">
              Log In
            </button>
            {/* Active underline indicator */}
            <div className="absolute bottom-1 left-0 w-full h-[3px] bg-[#10b981] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 py-3 z-50">
              <button onClick={signInWithGoogle} className="w-full text-left px-6 py-3 text-[15px] font-medium text-slate-700 hover:text-[#10b981] hover:bg-emerald-50 transition-colors">
                Log In
              </button>
              <button onClick={signInWithGoogle} className="w-full text-left px-6 py-3 text-[15px] font-medium text-slate-700 hover:text-[#10b981] hover:bg-emerald-50 transition-colors">
                Sign Up
              </button>
            </div>
          </div>

          <button onClick={signInWithGoogle} className="bg-slate-950 text-white px-7 py-3 rounded-full text-[15px] font-bold hover:bg-slate-800 transition-colors hidden sm:block">
            Trials & Downloads
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 pt-64 pb-32 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05]">
            When disruption <span className="text-emerald-900">isn't an option.</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-emerald-50 mb-12 max-w-2xl mx-auto">
            Trust the unified platform for decentralized behavioral intelligence at massive scale.
          </p>
          <button onClick={signInWithGoogle} className="bg-white text-[#10b981] font-bold px-10 py-4 rounded-full text-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform">
            Request a demo
          </button>
        </motion.div>
      </main>

      {/* Scrolling Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Digital resilience platform</h3>
            <p className="text-emerald-50 text-lg leading-relaxed">
              Unify cross-domain machine data at petabyte scale into contextualized, trusted intelligence. Give teams and AI a complete foundation to preempt issues and activate AgenticOps.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Agentic SOC</h3>
            <p className="text-emerald-50 text-lg leading-relaxed">
              Unify threat detection, investigation, and response with AI and built-in continuous threat intel. Use AI to anticipate, find, and stop emerging threats at machine speed.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Agentic observability</h3>
            <p className="text-emerald-50 text-lg leading-relaxed">
              See the business impact of every performance problem across any stack, owned and unowned networks, and AI workloads. Use AI to predict, preempt, and investigate fast.
            </p>
          </motion.div>

        </div>
      </section>

      {/* Extra space to demonstrate scroll */}
      <div className="h-64"></div>
    </div>
  );
}
