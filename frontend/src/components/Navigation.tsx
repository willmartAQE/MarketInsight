"use client";

import React from "react";
import {
  LayoutGrid,
  Calculator,
  BarChart3,
  Scale,
  TrendingUp,
  BookOpen,
  Sparkles,
  DollarSign
} from "lucide-react";

export type ActiveTab = "catalog" | "calculator" | "analytics" | "compare" | "trends" | "wiki";

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currencyMode: "usd" | "local";
  onCurrencyModeToggle: () => void;
  usdRate: number;
}

export function Navigation({
  activeTab,
  onTabChange,
  currencyMode,
  onCurrencyModeToggle,
  usdRate,
}: NavigationProps) {
  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: "catalog", label: "Catalog & Margins", icon: LayoutGrid },
    { id: "calculator", label: "Margin & ROI Calculator", icon: Calculator, badge: "NEW" },
    { id: "analytics", label: "BI Analytics", icon: BarChart3 },
    { id: "compare", label: "Store Matcher", icon: Scale },
    { id: "trends", label: "Market Trends", icon: TrendingUp },
    { id: "wiki", label: "Arbitrage Playbook", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange("catalog")}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Sparkles className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  MarketInsight
                </span>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-400/30">
                  BI PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Arbitrage & Price Intelligence Hub</p>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? "bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                currencyMode === "usd"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title="Toggle between USD conversion ($) and Local marketplace currencies (£/€)"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <span>Currency: <strong className="text-white">{currencyMode === "usd" ? "USD ($)" : "Local (£/€)"}</strong></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 no-scrollbar border-t border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 bg-slate-800/60"
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
