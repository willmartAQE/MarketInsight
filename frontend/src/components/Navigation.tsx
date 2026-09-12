"use client";

import { CurrencyMode } from "@/lib/currency";
import { LayoutGrid, Calculator, BarChart3, Scale, TrendingUp, BookOpen, DollarSign } from "lucide-react";

export type ActiveTab = "catalog" | "calculator" | "analytics" | "compare" | "trends" | "wiki";

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currencyMode: CurrencyMode;
  onCurrencyModeToggle: () => void;
  usdRate?: number;
}

export function Navigation({
  activeTab,
  onTabChange,
  currencyMode,
  onCurrencyModeToggle,
}: NavigationProps) {
  const tabs: { id: ActiveTab; label: string; icon: any; badge?: string }[] = [
    { id: "catalog", label: "Catalog & Margins", icon: LayoutGrid },
    { id: "calculator", label: "Margin & ROI Calculator", icon: Calculator, badge: "NEW" },
    { id: "analytics", label: "BI Analytics", icon: BarChart3 },
    { id: "compare", label: "Store Matcher", icon: Scale },
    { id: "trends", label: "Market Trends", icon: TrendingUp },
    { id: "wiki", label: "Arbitrage Playbook", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#060709]/95 backdrop-blur-md border-b border-[rgba(212,175,55,0.2)] text-white shadow-2xl">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Impeccable Neo Kinpaku Brand Lockup */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onTabChange("catalog")}
          >
            {/* Kinpaku Carved Tile Glyph */}
            <div className="h-9 w-9 rounded-md bg-[#121418] border border-[rgba(212,175,55,0.4)] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(212,175,55,0.25)] group-hover:border-[#d4af37] transition-all">
              <div className="h-4 w-4 bg-[#d4af37] [clip-path:polygon(0_0,100%_0,100%_35%,35%_100%,0_100%)] group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-xl tracking-[0.12em] uppercase text-[#f8fafc] group-hover:text-[#d4af37] transition-colors">
                  MarketInsight
                </span>
                <span className="bg-[#121418] text-[#d4af37] text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border border-[rgba(212,175,55,0.3)]">
                  BI PLATFORM
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Arbitrage & Price Intelligence Hub</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-all relative ${
                    isActive
                      ? "bg-[#121418] text-[#d4af37] border border-[rgba(212,175,55,0.4)] shadow-[0_0_12px_-3px_rgba(212,175,55,0.2)]"
                      : "text-slate-300 hover:text-white hover:bg-[#121418]/60 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#d4af37]" : "text-slate-400"}`} />
                  <span className="tracking-wide">{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-[#2dd4bf]/10 text-[#2dd4bf] text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#2dd4bf]/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Currency Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCurrencyModeToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                currencyMode === "usd"
                  ? "bg-[#121418] border-[#2dd4bf]/40 text-[#2dd4bf] shadow-[0_0_12px_-3px_rgba(45,212,191,0.25)]"
                  : "bg-[#121418] border-slate-700 text-slate-300 hover:border-[#d4af37]/40 hover:text-[#d4af37]"
              }`}
              title="Toggle between USD conversion ($) and Local marketplace currencies (£/€)"
            >
              <DollarSign className="h-3.5 w-3.5 text-[#2dd4bf]" />
              <span>Currency: <strong className="text-white">{currencyMode === "usd" ? "USD ($)" : "Local (£/€)"}</strong></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 no-scrollbar border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-[#121418] text-[#d4af37] border border-[rgba(212,175,55,0.4)]"
                    : "text-slate-300 bg-[#121418]/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
