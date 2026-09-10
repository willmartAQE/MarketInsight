"use client";

import React, { useState } from "react";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  Truck,
  Building,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

interface MarginCalculatorProps {
  currencyMode: "usd" | "local";
}

export function MarginCalculator({ currencyMode }: MarginCalculatorProps) {
  // Calculator inputs
  const [buyPrice, setBuyPrice] = useState<number>(15.43);
  const [sellPrice, setSellPrice] = useState<number>(22.99);
  const [feePct, setFeePct] = useState<number>(15); // Amazon standard 15%
  const [shippingCost, setShippingCost] = useState<number>(2.50);
  const [taxPct, setTaxPct] = useState<number>(0); // Custom taxes

  const symbol = currencyMode === "usd" ? "$" : "€";

  // Calculations
  const grossRevenue = sellPrice || 0;
  const marketplaceFee = Math.round((grossRevenue * (feePct / 100)) * 100) / 100;
  const taxAmount = Math.round((grossRevenue * (taxPct / 100)) * 100) / 100;
  const totalCosts = (buyPrice || 0) + (shippingCost || 0) + marketplaceFee + taxAmount;
  
  const netProfit = Math.round((grossRevenue - totalCosts) * 100) / 100;
  const netMarginPct = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 1000) / 10 : 0;
  const roiPct = buyPrice > 0 ? Math.round((netProfit / (buyPrice + (shippingCost || 0))) * 1000) / 10 : 0;

  // Break-even formula: (BuyPrice + Shipping) / (1 - feePct/100 - taxPct/100)
  const feeTaxFactor = 1 - (feePct / 100) - (taxPct / 100);
  const breakEvenPrice = feeTaxFactor > 0 
    ? Math.round(((buyPrice + shippingCost) / feeTaxFactor) * 100) / 100 
    : 0;

  const resetPreset = (preset: "amazon" | "ebay" | "high_margin") => {
    if (preset === "amazon") {
      setFeePct(15);
      setShippingCost(2.50);
    } else if (preset === "ebay") {
      setFeePct(12.5);
      setShippingCost(3.00);
    } else if (preset === "high_margin") {
      setFeePct(10);
      setShippingCost(1.50);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white border border-blue-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                ARBITRAGE SIMULATOR
              </span>
              <span className="text-slate-400 text-xs">• Active Currency: {symbol}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Calculator className="h-7 w-7 text-blue-400" />
              Arbitrage & Net Margin Calculator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Instantly calculate net profit margin, marketplace referral fees, shipping costs, and return on investment (ROI) before purchasing an item.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 shrink-0">
            <span className="text-xs text-slate-400 font-medium px-2">Presets:</span>
            <button
              onClick={() => resetPreset("amazon")}
              className="px-2.5 py-1 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 border border-amber-500/30 transition-all"
            >
              Amazon (15%)
            </button>
            <button
              onClick={() => resetPreset("ebay")}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 border border-blue-500/30 transition-all"
            >
              eBay (12.5%)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Real-time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Trade Parameters
          </h2>

          {/* Buy Price */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Purchase Price (Item Cost) ({symbol})
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">
                {symbol}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={buyPrice || ""}
                onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Target Sell Price */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Target Selling Price ({symbol})
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">
                {symbol}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellPrice || ""}
                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Marketplace Fee % */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Marketplace Referral Fee (%)
              </label>
              <span className="text-xs text-blue-600 font-semibold">{symbol}{marketplaceFee.toFixed(2)} fee</span>
            </div>
            <div className="relative rounded-xl shadow-sm">
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={feePct || ""}
                onChange={(e) => setFeePct(parseFloat(e.target.value) || 0)}
                className="w-full pl-4 pr-8 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="15"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 font-bold">
                %
              </div>
            </div>
          </div>

          {/* Shipping & Logistics Cost */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Shipping & Logistics Cost ({symbol})
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">
                {symbol}
              </div>
              <input
                type="number"
                step="0.10"
                min="0"
                value={shippingCost || ""}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Computed KPI Dashboard & Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Profit Card */}
            <div className={`rounded-2xl p-5 border shadow-sm transition-all ${
              netProfit > 0 
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950" 
                : netProfit < 0 
                ? "bg-rose-50/80 border-rose-200 text-rose-950" 
                : "bg-gray-50 border-gray-200 text-gray-900"
            }`}>
              <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase opacity-80 mb-2">
                <span>Net Profit</span>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-3xl font-extrabold tracking-tight">
                {netProfit >= 0 ? `+${symbol}${netProfit.toFixed(2)}` : `-${symbol}${Math.abs(netProfit).toFixed(2)}`}
              </div>
              <p className="text-xs font-medium opacity-80 mt-1">
                {netProfit > 0 ? "Profitable Trade" : netProfit < 0 ? "Loss Making Trade" : "Break-Even"}
              </p>
            </div>

            {/* Margin % Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 rounded-2xl p-5 border border-blue-200 text-blue-950 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase opacity-80 mb-2">
                <span>Net Margin</span>
                <Percent className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-blue-600 tracking-tight">
                {netMarginPct}%
              </div>
              <p className="text-xs text-blue-700 font-medium mt-1">
                Share of profit on selling price
              </p>
            </div>

            {/* ROI % Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50/70 rounded-2xl p-5 border border-purple-200 text-purple-950 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase opacity-80 mb-2">
                <span>ROI Return</span>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold text-purple-600 tracking-tight">
                {roiPct}%
              </div>
              <p className="text-xs text-purple-700 font-medium mt-1">
                Return on invested capital
              </p>
            </div>
          </div>

          {/* Breakdown Table Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Financial Breakdown</span>
              <span className="text-xs font-semibold text-gray-500">Break-even: {symbol}{breakEvenPrice.toFixed(2)}</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-gray-700">
                <span className="font-medium">Gross Revenue (Target Selling Price)</span>
                <span className="font-bold text-gray-900">{symbol}{grossRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-gray-700">
                <span>Item Purchase Cost</span>
                <span className="font-semibold text-rose-600">-{symbol}{(buyPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-gray-700">
                <span>Marketplace Referral Fee ({feePct}%)</span>
                <span className="font-semibold text-amber-600">-{symbol}{marketplaceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-gray-700">
                <span>Shipping & Logistics Cost</span>
                <span className="font-semibold text-rose-600">-{symbol}{(shippingCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-slate-50 px-3 rounded-xl font-bold text-base text-gray-900 border border-slate-200">
                <span>Net Final Profit</span>
                <span className={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {netProfit >= 0 ? `+${symbol}${netProfit.toFixed(2)}` : `-${symbol}${Math.abs(netProfit).toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Dynamic Advice / Warning Box */}
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
              netMarginPct >= 20 
                ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
                : netMarginPct > 0 
                ? "bg-amber-50 text-amber-900 border-amber-200" 
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}>
              {netMarginPct >= 20 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Great Arbitrage Opportunity!</strong>
                    <p className="mt-0.5">A net margin of {netMarginPct}% and ROI of {roiPct}% provide a strong buffer against price fluctuations or competitor discounts.</p>
                  </div>
                </>
              ) : netMarginPct > 0 ? (
                <>
                  <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Moderate Margin ({netMarginPct}%)</strong>
                    <p className="mt-0.5 font-medium">The trade is profitable but has a tight margin buffer. Account for potential return rates or currency exchange shifts.</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">High Risk / Loss Making Trade</strong>
                    <p className="mt-0.5 font-medium">To achieve break-even, you must sell the item for at least <strong>{symbol}{breakEvenPrice.toFixed(2)}</strong>.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
