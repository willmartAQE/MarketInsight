"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  TrendingUp,
  Zap,
  DollarSign,
  Globe,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Target,
  ArrowRight,
  Layers,
  Activity,
  Award,
  Search,
  ExternalLink,
  Flame,
  Scale
} from "lucide-react";

interface WikiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "overview" | "indicators" | "playbook" | "stores" | "faq";

export function WikiModal({ isOpen, onClose }: WikiModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white px-6 py-5 flex items-center justify-between border-b border-indigo-800/40 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3.5 z-10">
              <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-400/30 shadow-inner">
                <BookOpen className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">MarketInsight Knowledge Wiki</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Official Arbitrage Guide
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Comprehensive documentation on platform analytics, indicators, and e-commerce marketing arbitrage strategies.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="z-10 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-indigo-600 border-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Platform Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("indicators")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === "indicators"
                  ? "bg-white text-indigo-600 border-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Analytics Indicators</span>
            </button>

            <button
              onClick={() => setActiveTab("playbook")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === "playbook"
                  ? "bg-white text-indigo-600 border-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent"
              }`}
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Arbitrage Playbook</span>
            </button>

            <button
              onClick={() => setActiveTab("stores")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === "stores"
                  ? "bg-white text-indigo-600 border-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent"
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Global Store Index</span>
            </button>

            <button
              onClick={() => setActiveTab("faq")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === "faq"
                  ? "bg-white text-indigo-600 border-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>FAQ & Methodology</span>
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6 text-slate-700 text-sm">
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">What is MarketInsight?</h3>
                      <p className="mt-1 text-slate-600 leading-relaxed">
                        MarketInsight is an enterprise-grade real-time e-commerce intelligence and price analytics engine.
                        It scans live product catalogs across <strong>12 global retail platforms</strong> in <strong>9 major countries</strong> to detect real-time price drops, cross-border price disparities, and arbitrage opportunities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span>100% Live Dynamic Scraping</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Zero hardcoded fallback arrays or artificial product entries. Every product card is verified in real-time against actual store Product Detail Pages (PDP) and live image CDN servers.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-2">
                      <Globe className="h-4 w-4" />
                      <span>Multi-Region Coverage</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Continuous monitoring across USA, Canada, United Kingdom, Germany, France, Spain, Italy, Netherlands, and Poland with automatic local-to-USD currency conversions.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-2">
                      <Zap className="h-4 w-4" />
                      <span>High-Performance Analytics Engine</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Advanced analytical processing for outlier deal detection, category quantiles, price distribution clusters, and cross-border arbitrage matrices.
                    </p>
                  </div>
                </div>

                {/* Key Features Overview */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    Core Platform Capabilities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block font-semibold">Cross-Store Grouping Modal</strong>
                        <span>Merges identical products across Amazon, Walmart, El Corte Inglés, Cdiscount, etc., into grouped price comparison matrix.</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block font-semibold">Historical Price Floor Tracker</strong>
                        <span>Provides 90-day and 365-day historical floor/ceiling price curves for Amazon products to verify true historical price troughs.</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block font-semibold">Google Trends Interest Velocity</strong>
                        <span>Overlays 90-day search interest momentum to validate whether price dips coincide with high consumer demand.</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block font-semibold">One-Click CSV Export</strong>
                        <span>Exports full filtered datasets with pre-formatted prices, rating volumes, and product links for Excel/Google Sheets workflow.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. ANALYTICS INDICATORS TAB */}
            {activeTab === "indicators" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
                  <h3 className="text-base font-bold flex items-center gap-2 text-indigo-300">
                    <Activity className="h-5 w-5 text-indigo-400" />
                    How to Read Market Analytics & Metrics
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    MarketInsight provides quantitative metrics to eliminate guess-work. Here is how each indicator is calculated and how to interpret it for profitable decision-making.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Attractiveness Score */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg font-bold text-xs">
                          Score 0 - 100
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">Attractiveness Score</h4>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                        Key Arbitrage Metric
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      The Attractiveness Score is a composite algorithm that rates a product's market viability for resale or purchase.
                    </p>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                      <div className="font-semibold text-slate-900">Score Weighting Formula:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li><strong>35% Discount Percentage:</strong> Difference between current live price and original MSRP list price.</li>
                        <li><strong>30% Review Volume Density:</strong> Number of verified customer reviews (higher volume = proven consumer demand).</li>
                        <li><strong>20% Customer Rating:</strong> Average rating score (items &gt; 4.5 stars minimize return risks).</li>
                        <li><strong>15% Category Quantile Position:</strong> Position of price relative to the 25th percentile category floor.</li>
                      </ul>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-center font-medium">
                      <div className="p-2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <strong>80 - 100: Prime Arbitrage</strong>
                        <span className="block text-[10px] text-emerald-600">Heavy discount + high demand</span>
                      </div>
                      <div className="p-2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        <strong>50 - 79: Moderate Value</strong>
                        <span className="block text-[10px] text-amber-600">Fair margin / standard demand</span>
                      </div>
                      <div className="p-2 rounded bg-rose-50 text-rose-800 border border-rose-200">
                        <strong>0 - 49: Low Liquidity</strong>
                        <span className="block text-[10px] text-rose-600">Overpriced or low reviews</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Rating & Reviews Trust Density */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-indigo-600" />
                      Reviews Trust Density & Consumer Rating
                    </h4>
                    <p className="text-xs text-slate-600">
                      High ratings alone can be misleading if review counts are low. MarketInsight evaluates <strong>Trust Density</strong> by multiplying review rating by log-scaled review volume.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <strong className="text-blue-900 block font-semibold mb-1">Low Trust Density Scenario:</strong>
                        <span className="text-slate-600">Rating 5.0 / 5 with only 3 reviews. High risk of fake reviews or unproven velocity. Avoid high-volume arbitrage buys.</span>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <strong className="text-emerald-900 block font-semibold mb-1">High Trust Density Scenario:</strong>
                        <span className="text-slate-600">Rating 4.8 / 5 with 3,500+ reviews. Exceptional market confidence and high resale velocity.</span>
                      </div>
                    </div>
                  </div>

                  {/* 30-Day Predictive Price Forecast */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      30-Day Predictive Price Forecast & OHLC
                    </h4>
                    <p className="text-xs text-slate-600">
                      Calculates exponential smoothing price trends ($\alpha = 0.3, \beta = 0.1$) to forecast whether a price is likely to drop further or rebound.
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5">
                      <li><strong className="text-emerald-700">Wait - Price Dropping:</strong> Price slope is negative. Ideal time to monitor before purchasing at floor.</li>
                      <li><strong className="text-blue-700">Buy Now - Best Deal:</strong> Price is at or below the 90-day minimum floor.</li>
                      <li><strong className="text-amber-700">Price Spike Warning:</strong> Price has increased above 30-day average. Avoid sourcing until price normalizes.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. ARBITRAGE PLAYBOOK TAB */}
            {activeTab === "playbook" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-xl p-5 text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-md">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">E-Commerce Marketing Arbitrage Playbook</h3>
                      <p className="text-xs text-slate-700 mt-0.5">
                        Step-by-step methodology for turning price disparities into risk-free profit margins across global e-commerce channels.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Strategy 1 */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow">
                        1
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">Cross-Border Regional Arbitrage (EU Store Spreads)</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Prices for identical electronics and appliances vary significantly across European Amazon marketplaces (DE, IT, FR, ES, UK) due to regional promotion cycles.
                    </p>
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <Scale className="h-4 w-4 text-indigo-600" />
                        Practical Example:
                      </div>
                      <p className="text-slate-600">
                        A <em>De'Longhi Magnifica Espresso Machine</em> is listed on <strong>Amazon Germany (DE) for €299</strong> on promotion, while listed on <strong>Amazon UK or Spain for €429 (£370)</strong>.
                      </p>
                      <div className="text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                        Spread Profit Margin: €130 gross profit per unit before shipping.
                      </div>
                    </div>
                  </div>

                  {/* Strategy 2 */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow">
                        2
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">Clearance-to-Marketplace Resale Arbitrage</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Retailers like <strong>El Corte Inglés (Spain)</strong> or <strong>Cdiscount (France)</strong> run aggressive seasonal clearance sales on specific brands (e.g. Moulinex, Taurus, BRA).
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                      <li>Use MarketInsight to filter by <strong>Discount &gt; 30%</strong> and <strong>Attractiveness Score &gt; 80</strong>.</li>
                      <li>Cross-reference the historical price chart for Amazon to verify that Amazon's price ceiling remains high.</li>
                      <li>Source from clearance store and list on Amazon/eBay for market rate.</li>
                    </ul>
                  </div>

                  {/* Strategy 3 */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow">
                        3
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">Statistical Outlier Deals & Quantile Arbitrage</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Open the <strong>Advanced Analytics tab</strong> and view the <strong>Outlier Deals Table</strong>. Products highlighted here deviate more than $2.5\sigma$ below the category median price floor.
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
                      💡 Pro Tip: Outliers with high rating counts represent flash discounts that quickly sell out. Buy immediately or launch paid traffic campaigns targeting these deal URLs.
                    </div>
                  </div>

                  {/* Strategy 4 */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow">
                        4
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">Google Trends Demand Velocity Alignment</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Before acquiring inventory or investing ad spend into an arbitrage deal, verify search interest in the <strong>Google Trends Widget</strong>.
                    </p>
                    <p className="text-xs text-slate-600">
                      When Google Trends shows an upward breakout spike ($+50\%$ interest velocity) while MarketInsight detects a local store price dip, conversion rates for paid ads (Google Ads / TikTok Ads) peak at maximum ROI.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. GLOBAL STORES TAB */}
            {activeTab === "stores" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-600" />
                    Supported Global Retail Stores & Scraper Coverage
                  </h3>
                  <p className="text-xs text-slate-600">
                    MarketInsight monitors 12 major e-commerce platforms using live real-time scrapers and automated catalog analytics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇺🇸 Walmart US</strong>
                    <span className="text-slate-600 block">Category coverage: Electronics, Kitchen, Home</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Scraping Active</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇺🇸 Amazon US / EU</strong>
                    <span className="text-slate-600 block">Coverage: US, DE, FR, ES, IT, UK</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Store Tracker Active</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇪🇸 El Corte Inglés</strong>
                    <span className="text-slate-600 block">Coverage: Spain (Electronics, Kitchen, Home)</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live PDP Store Scraper</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇳🇱 Bol.com</strong>
                    <span className="text-slate-600 block">Coverage: Netherlands & Belgium</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Catalog Scraper</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇫🇷 Cdiscount</strong>
                    <span className="text-slate-600 block">Coverage: France High-Tech & Appliances</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Store Scraper</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇩🇪 Otto.de</strong>
                    <span className="text-slate-600 block">Coverage: Germany Appliances & Tech</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Store Scraper</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇵🇱 Allegro</strong>
                    <span className="text-slate-600 block">Coverage: Poland Market Leader</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Store Scraper</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇪🇺 eBay EU / US</strong>
                    <span className="text-slate-600 block">Coverage: DE, IT, FR, ES, UK, US</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Store Tracker Active</span>
                  </div>

                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50">
                    <strong className="text-slate-900 block font-bold text-sm mb-1">🇨🇦 Canadian Retail</strong>
                    <span className="text-slate-600 block">Coverage: Walmart CA, Best Buy CA</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Status: Live Store Scraper</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. FAQ TAB */}
            {activeTab === "faq" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-indigo-600" />
                    Frequently Asked Questions & Methodology
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong className="text-slate-900 block font-semibold text-sm mb-1">Q: How often is product price data updated?</strong>
                      <p className="text-slate-600">
                        Scraping workers run on demand and via scheduled automated intervals. You can click <strong>"Purge Cache & Full Scrape"</strong> in the top header at any time to wipe server-side job caches and launch a fresh real-time scrape across all 12 global retail platforms.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong className="text-slate-900 block font-semibold text-sm mb-1">Q: How does currency conversion work?</strong>
                      <p className="text-slate-600">
                        Prices are extracted in the store's native currency (€, $, £, zł) and can be toggled in real time between <strong>"Local Currency"</strong> and <strong>"USD ($)"</strong> using the currency mode toggle.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong className="text-slate-900 block font-semibold text-sm mb-1">Q: What guarantees data accuracy?</strong>
                      <p className="text-slate-600">
                        MarketInsight enforces strict 100% live DOM extraction and DAM image URL validation. Any product card with a missing image or corrupt URL is automatically rejected by the database engine.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong className="text-slate-900 block font-semibold text-sm mb-1">Q: How can I compare identical products across different stores?</strong>
                      <p className="text-slate-600">
                        Click the <strong>"Cross-Store Grouping"</strong> button in the top navigation bar. MarketInsight uses string-matching algorithms to group identical products across stores, allowing side-by-side price comparison in one click.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-100 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>MarketInsight Wiki v1.0 • Enterprise Analytics Documentation</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition-all cursor-pointer"
            >
              Close Wiki
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
