"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WikiModal } from "@/components/WikiModal";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";

export default function WikiPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center space-y-4 max-w-lg">
        <div className="inline-flex p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl">
          <BookOpen className="h-10 w-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">MarketInsight Wiki Documentation</h1>
        <p className="text-slate-400 text-sm">
          Comprehensive guide to e-commerce intelligence, market metrics, and arbitrage strategies.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Open Interactive Wiki</span>
        </button>
      </div>

      <WikiModal isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}
