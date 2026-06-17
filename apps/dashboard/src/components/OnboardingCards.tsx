"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Lightbulb, Activity, ShieldCheck, Server, Wallet, BookOpen } from "lucide-react";

interface FlashCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
  color: string;
}

const CARDS: FlashCard[] = [
  {
    icon: <Activity className="w-6 h-6" />,
    title: "Insights Feed",
    description: "This is where you'll see real-time behavioral insights detected by your AI agents. Each card represents an anomaly or pattern the system found in your data stream.",
    tip: "Select insights using the checkboxes, then use the commit bar at the bottom to bundle them into a verifiable batch.",
    color: "emerald",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Proof Verifier",
    description: "Independently verify that an AI-generated insight hasn't been tampered with. Paste the proof data and the on-chain Merkle root to mathematically confirm integrity.",
    tip: "You'll receive proof data and Merkle roots after committing a batch. Use this tool to audit any historical commit.",
    color: "teal",
  },
  {
    icon: <Server className="w-6 h-6" />,
    title: "Agent Status",
    description: "Monitor the health and activity of your backend AI agents — Scout (data collector), Analyst (pattern detector), and Narrative (summarizer).",
    tip: "If this page shows 'offline', make sure all three agents are running in separate terminal windows.",
    color: "blue",
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Wallet & Commits",
    description: "Connect a Web3 wallet (e.g. MetaMask) to sign and commit insight batches on-chain. Your wallet address is also used to check your agent's reputation score.",
    tip: "No wallet? You can still browse insights — a wallet is only needed to commit verified batches to the blockchain.",
    color: "violet",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Trust Leaderboard",
    description: "Visit the Leaderboard page to see how all agents rank by their trust score. Agents that produce bad data get automatically penalized and eventually banned.",
    tip: "An agent's score drops by 20% for every failure. Below 60% = permanently banned from committing.",
    color: "amber",
  },
];

const STORAGE_KEY = "lore_onboarding_dismissed";

export function OnboardingCards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden until we check localStorage
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== "true") {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
    if (typeof window !== "undefined" && (window as any).pendo) {
      (window as any).pendo.track("Onboarding Guide Dismissed", {
        completedAllCards: currentIndex === CARDS.length - 1,
        dismissedAtCard: currentIndex,
      });
    }
  };

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    if (typeof window !== "undefined" && (window as any).pendo) {
      (window as any).pendo.track("Onboarding Card Viewed", {
        cardTitle: CARDS[index].title,
        cardIndex: index,
      });
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  const next = () => goTo(Math.min(currentIndex + 1, CARDS.length - 1));
  const prev = () => goTo(Math.max(currentIndex - 1, 0));

  if (isDismissed) {
    return (
      <button
        onClick={() => {
          setIsDismissed(false);
          setCurrentIndex(0);
          if (typeof window !== "undefined" && (window as any).pendo) {
            (window as any).pendo.track("Onboarding Guide Started");
            (window as any).pendo.track("Onboarding Card Viewed", {
              cardTitle: CARDS[0].title,
              cardIndex: 0,
            });
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center hover:scale-110 group"
        title="Show getting started guide"
      >
        <Lightbulb className="w-5 h-5 group-hover:animate-pulse" />
      </button>
    );
  }

  const card = CARDS[currentIndex];
  const colorMap: Record<string, { bg: string; border: string; iconBg: string; dot: string }> = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500" },
    teal: { bg: "bg-teal-50", border: "border-teal-200", iconBg: "bg-teal-100 text-teal-600", dot: "bg-teal-500" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100 text-blue-600", dot: "bg-blue-500" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", iconBg: "bg-violet-100 text-violet-600", dot: "bg-violet-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100 text-amber-600", dot: "bg-amber-500" },
  };
  const colors = colorMap[card.color];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]">
      <div className={`${colors.bg} ${colors.border} border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Getting Started</span>
            <span className="text-xs text-slate-400 font-mono">{currentIndex + 1}/{CARDS.length}</span>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Card Body */}
        <div className="px-5 pb-4">
          <div className="flex items-start gap-4 mb-3">
            <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{card.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{card.description}</p>
            </div>
          </div>
          
          {/* Tip */}
          <div className="bg-white/70 rounded-xl p-3 border border-white/50 mt-3">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">💡 Tip: </span>
              {card.tip}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-5 py-3 bg-white/50 border-t border-white/30">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? `${colors.dot} w-5` : "bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            {currentIndex === CARDS.length - 1 ? (
              <button
                onClick={handleDismiss}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                onClick={next}
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
