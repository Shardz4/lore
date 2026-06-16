"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";

// ── Plexus network canvas animation ──
function PlexusCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const init = useCallback(() => {
    // Completely bypass canvas initialization on mobile screens to save resource usage
    if (typeof window === "undefined" || window.innerWidth < 768) {
      return () => {};
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Nodes - optimized count to 80 for production performance
    const COUNT = 80;
    const LINK_DIST = 140;
    interface Node { x: number; y: number; vx: number; vy: number; r: number }
    const nodes: Node[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.8,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Update positions
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      // Draw links - optimized using distance squared check to avoid Math.sqrt checks on every node pair
      const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
      for (let i = 0; i < COUNT; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < COUNT; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < LINK_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / LINK_DIST) * 0.25;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // Draw dots
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

export default function SplashScreen() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Close nav on click outside (mobile)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsNavExpanded(false);
        setIsLoginDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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

      {/* Left-Aligned Collapsible Navigation */}
      <header ref={navRef} className="fixed top-6 left-6 z-50 group/nav">
        <div className={`bg-black/50 backdrop-blur-xl rounded-full shadow-2xl border border-white/10 flex items-center gap-0 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isNavExpanded ? "w-[calc(100vw-3rem)] max-w-md pr-3" : "w-12"} md:w-12 md:group-hover/nav:w-auto md:group-hover/nav:pr-3`}>
          {/* Logo Dot — always visible, tap to expand on mobile */}
          <Link 
            href="/" 
            onClick={(e) => {
              if (window.innerWidth < 768) {
                e.preventDefault();
                setIsNavExpanded(!isNavExpanded);
              }
            }}
            className="flex items-center justify-center w-12 h-12 shrink-0"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform duration-300 group-hover/nav:scale-110">
              <div className="w-2 h-2 rounded-full bg-black"></div>
            </div>
          </Link>

          {/* Expanding Nav Items */}
          <div className={`flex items-center gap-5 transition-opacity duration-300 whitespace-nowrap ${isNavExpanded ? "opacity-100 pl-2 pr-3" : "opacity-0 pointer-events-none"} md:opacity-0 md:pointer-events-auto md:group-hover/nav:opacity-100 md:group-hover/nav:pointer-events-auto delay-100`}>
            <span className="text-sm font-medium text-white tracking-tight select-none">lore</span>
            <div className="h-3.5 w-px bg-white/10"></div>
            <Link href="/features" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link href="/getting-started" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">Connect Agent</Link>
            <Link href="https://github.com/lore-cybernetics" target="_blank" className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">GitHub</Link>
            <div className="h-3.5 w-px bg-white/10"></div>
            <div className="relative group/login py-2">
              <button 
                onClick={(e) => {
                  if (window.innerWidth < 768) {
                    e.preventDefault();
                    setIsLoginDropdownOpen(!isLoginDropdownOpen);
                  }
                }}
                className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors"
              >
                Log in
              </button>
              <div className={`absolute top-full left-0 mt-3 w-56 bg-[#0a0a0a] rounded-2xl border border-white/10 py-2 z-50 shadow-2xl backdrop-blur-xl transition-all duration-200 origin-top-left ${isLoginDropdownOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"} md:opacity-0 md:invisible md:group-hover/login:opacity-100 md:group-hover/login:visible md:scale-95 md:group-hover/login:scale-100`}>
                <button onClick={signInWithGoogle} className="w-full text-left px-5 py-3 text-[14px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section — Right-Aligned Giant Logo */}
      <main className="relative z-10 w-full min-h-screen flex items-center justify-end pt-20 pb-20 px-6 md:px-16 lg:px-24">
        
        {/* Left-side animated plexus network visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0 w-[55%] hidden md:block pointer-events-none"
          style={{
            maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 100%)",
          }}
        >
          <PlexusCanvas />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-right max-w-5xl flex flex-col items-end"
        >
          <p className="text-base md:text-lg text-slate-500 font-normal tracking-[0.2em] uppercase mb-4">
            Decentralized Intelligence
          </p>

          <h1 className="text-[7rem] md:text-[11rem] lg:text-[14rem] font-bold tracking-tighter leading-[0.85] text-white select-none mb-8" style={{ textShadow: '0 0 120px rgba(255,255,255,0.06)' }}>
            LORE
          </h1>

          <p className="text-base md:text-lg text-slate-400 font-normal tracking-wide max-w-xl mb-12 leading-relaxed text-right">
            The unified infrastructure required to build, connect, execute, and trade autonomous behavioral workflows — verified cryptographically.
          </p>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <button onClick={signInWithGoogle} className="bg-white text-black px-8 py-4 rounded-full text-[15px] font-medium hover:bg-slate-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center gap-2">
              Enter Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
            <Link href="/getting-started" className="bg-white/[0.03] backdrop-blur-sm border border-white/10 text-white px-8 py-4 rounded-full text-[15px] font-medium hover:bg-white/[0.08] transition-all flex items-center gap-2">
              Connect Agent
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
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
