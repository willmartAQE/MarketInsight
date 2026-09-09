"use client";

import { useState, useEffect } from "react";
import { getGoogleTrendsData, GoogleTrendsResult } from "@/lib/api";
import { TrendingUp, Search, Globe, Flame, AlertCircle, RefreshCw, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GoogleTrendsWidgetProps {
  initialKeyword?: string;
  countryCode?: string;
}

export function GoogleTrendsWidget({ initialKeyword = "DeLonghi", countryCode = "IT font-bold" }: GoogleTrendsWidgetProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [geo, setGeo] = useState("IT");
  const [timeframe, setTimeframe] = useState(90);
  const [data, setData] = useState<GoogleTrendsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (searchKw: string, targetGeo: string, tf: number) => {
    if (!searchKw.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getGoogleTrendsData(searchKw, targetGeo, tf);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load Google Trends data:", err);
      setError("Unable to load trends. Please try a different query.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(keyword, geo, timeframe);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrends(keyword, geo, timeframe);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Widget Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600 font-bold">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Real Consumer Demand & Search Trends
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Google Trends Engine
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Validate product demand momentum & search interest before inventory investment
              </p>
            </div>
          </div>
        </div>

        {/* Search Controls */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search product demand..."
              className="pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-44 font-medium text-gray-800"
            />
          </div>

          <select
            value={geo}
            onChange={(e) => {
              setGeo(e.target.value);
              fetchTrends(keyword, e.target.value, timeframe);
            }}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-700 cursor-pointer"
          >
            <option value="IT">🇮🇹 Italy</option>
            <option value="DE">🇩🇪 Germany</option>
            <option value="FR">🇫🇷 France</option>
            <option value="ES">🇪🇸 Spain</option>
            <option value="GB">🇬🇧 United Kingdom</option>
            <option value="US">🇺🇸 United States</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTimeframe(val);
              fetchTrends(keyword, geo, val);
            }}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-700 cursor-pointer"
          >
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>6 Months</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Analyze
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-3 text-gray-500 text-sm font-medium">
          <Activity className="h-6 w-6 animate-spin text-orange-600" />
          <span>Fetching Google Trends market search volume data...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-700">
          <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Demand Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Market Demand Status */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 block">
                Demand Signal
              </span>
              <p className="text-base font-extrabold text-gray-900 mt-1 flex items-center gap-1.5">
                {data.demandStatus}
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Market Consumer Verification</span>
            </div>

            {/* Average Search Volume Index */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                Average Search Score
              </span>
              <p className="text-2xl font-black text-gray-900 mt-0.5">
                {data.averageScore} <span className="text-xs text-gray-400 font-normal">/ 100 index</span>
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">90-Day Interest Volume</span>
            </div>

            {/* Recent Demand Score */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                Recent Interest Index
              </span>
              <p className="text-2xl font-black text-gray-900 mt-0.5">
                {data.recentScore} <span className="text-xs text-gray-400 font-normal">/ 100 index</span>
              </p>
              <span className="text-[11px] text-gray-500 mt-1 block">Current 14-Day Velocity</span>
            </div>

            {/* Momentum Growth % */}
            <div className={`border rounded-xl p-4 ${data.momentumPct >= 0 ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider block">
                Demand Momentum
              </span>
              <p className="text-2xl font-black mt-0.5">
                {data.momentumPct >= 0 ? `+${data.momentumPct}%` : `${data.momentumPct}%`}
              </p>
              <span className="text-[11px] opacity-80 mt-1 block">Growth vs Prior Period</span>
            </div>
          </div>

          {/* Search Interest Timeline Chart */}
          <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-600" />
                Google Search Volume Curve ({data.geo})
              </h3>

              {data.keywords && data.keywords.length > 1 ? (
                <div className="flex items-center gap-3">
                  {data.keywords.map((kw, idx) => {
                    const colors = ["#ea580c", "#2563eb", "#10b981"];
                    return (
                      <span key={kw} className="flex items-center gap-1 text-xs font-bold" style={{ color: colors[idx % colors.length] }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                        {kw}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[11px] text-gray-500">Indexed from 0 (min) to 100 (peak search volume)</span>
              )}
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="trendGradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="trendGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    formatter={(val: any, name: any) => [`${val} / 100`, String(name)]}
                  />
                  {data.keywords && data.keywords.length > 1 ? (
                    data.keywords.map((kw, idx) => {
                      const colors = ["#ea580c", "#2563eb", "#10b981"];
                      const c = colors[idx % colors.length];
                      return (
                        <Area
                          key={kw}
                          type="monotone"
                          dataKey={kw}
                          name={kw}
                          stroke={c}
                          strokeWidth={2.5}
                          fillOpacity={0.7}
                          fill={`url(#trendGradient${idx % 3})`}
                        />
                      );
                    })
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="value"
                      name={data.keyword}
                      stroke="#ea580c"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#trendGradient0)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
