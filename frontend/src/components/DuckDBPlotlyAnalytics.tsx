"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  getDuckDBHeatmap,
  getDuckDBOutliers,
  getDuckDBQuantiles,
  getDuckDBClusters,
  getDuckDBCrossBorderArbitrage,
  getDuckDBAttractiveness
} from "@/lib/api";
import {
  Database,
  Zap,
  Sparkles,
  TrendingDown,
  Layers,
  Loader2,
  ExternalLink,
  Tag,
  Star,
  Package,
  Globe,
  Award,
  ArrowRight,
  TrendingUp,
  PieChart
} from "lucide-react";
import { getAutoEnglishUrl } from "@/lib/urls";

// Dynamically import Plotly with SSR disabled for Next.js compatibility
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function DuckDBPlotlyAnalytics() {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [outliersData, setOutliersData] = useState<any[]>([]);
  const [quantilesData, setQuantilesData] = useState<any[]>([]);
  const [clustersData, setClustersData] = useState<any[]>([]);
  const [arbitrageData, setArbitrageData] = useState<any[]>([]);
  const [attractivenessData, setAttractivenessData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const [heatmap, outliers, quantiles, clusters, arbitrage, attractiveness] = await Promise.all([
          getDuckDBHeatmap(),
          getDuckDBOutliers(),
          getDuckDBQuantiles(),
          getDuckDBClusters(),
          getDuckDBCrossBorderArbitrage(),
          getDuckDBAttractiveness()
        ]);
        setHeatmapData(heatmap || []);
        setOutliersData(outliers || []);
        setQuantilesData(quantiles || []);
        setClustersData(clusters || []);
        setArbitrageData(arbitrage || []);
        setAttractivenessData(attractiveness || []);
        if (outliers && outliers.length > 0) {
          setSelectedDeal(outliers[0]);
        }
      } catch (err: any) {
        console.error("Failed to load analytics engine:", err);
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 font-medium">Computing high-speed market analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 text-sm">
        Failed to load analytics: {error}
      </div>
    );
  }

  // 1. Heatmap Data
  const categories = Array.from(new Set(heatmapData.map((d) => d.category)));
  const sources = Array.from(new Set(heatmapData.map((d) => d.source)));

  const zMatrix = categories.map((cat) => {
    return sources.map((src) => {
      const match = heatmapData.find((d) => d.category === cat && d.source === src);
      return match ? match.avg_price : null;
    });
  });

  const heatmapPlotData: any = [
    {
      x: sources.map((s) => s.toUpperCase()),
      y: categories,
      z: zMatrix,
      type: "heatmap",
      colorscale: "Viridis",
      reversescale: true,
      colorbar: { title: "Avg Price" }
    }
  ];

  // 2. Outliers Scatter Plot Data
  const outlierPlotData: any = [
    {
      x: outliersData.map((d) => d.price),
      y: outliersData.map((d) => d.rating || 4.0),
      text: outliersData.map((d) => `${d.name} (${d.source.toUpperCase()}) — ${d.savings_vs_avg_pct}% cheaper than avg`),
      customdata: outliersData.map((d) => d.url),
      mode: "markers",
      type: "scatter",
      marker: {
        size: outliersData.map((d) => Math.max(14, Math.min(32, (d.savings_vs_avg_pct || 15) / 2))),
        color: outliersData.map((d) => d.savings_vs_avg_pct),
        colorscale: "Portland",
        showscale: true,
        colorbar: { title: "Savings %", len: 0.8 }
      }
    }
  ];

  // 3. Price Tiers Quantiles Data
  const priceTiersPlotData: any = [
    {
      x: quantilesData.map((q) => q.category),
      y: quantilesData.map((q) => q.p25_price),
      name: "Budget Tier (25th Percentile)",
      type: "bar",
      marker: { color: "#10b981" }
    },
    {
      x: quantilesData.map((q) => q.category),
      y: quantilesData.map((q) => q.median_price),
      name: "Median Price",
      type: "bar",
      marker: { color: "#3b82f6" }
    },
    {
      x: quantilesData.map((q) => q.category),
      y: quantilesData.map((q) => q.p75_price),
      name: "Premium Tier (75th Percentile)",
      type: "bar",
      marker: { color: "#8b5cf6" }
    }
  ];

  // 4. Clusters Scatter Plot Data
  const budgetItems = clustersData.filter((c) => c.cluster_tier === "Budget Bargain");
  const valueItems = clustersData.filter((c) => c.cluster_tier === "Sweet-Spot Value");
  const premiumItems = clustersData.filter((c) => c.cluster_tier === "Premium Tier");

  const clusterPlotData: any = [
    {
      x: budgetItems.map((b) => b.price),
      y: budgetItems.map((b) => b.rating || 4.0),
      text: budgetItems.map((b) => `${b.name} (${b.category})`),
      mode: "markers",
      name: "Budget Bargain",
      type: "scatter",
      marker: { color: "#10b981", size: 10 }
    },
    {
      x: valueItems.map((v) => v.price),
      y: valueItems.map((v) => v.rating || 4.0),
      text: valueItems.map((v) => `${v.name} (${v.category})`),
      mode: "markers",
      name: "Sweet-Spot Value",
      type: "scatter",
      marker: { color: "#6366f1", size: 10 }
    },
    {
      x: premiumItems.map((p) => p.price),
      y: premiumItems.map((p) => p.rating || 4.0),
      text: premiumItems.map((p) => `${p.name} (${p.category})`),
      mode: "markers",
      name: "Premium Tier",
      type: "scatter",
      marker: { color: "#a855f7", size: 10 }
    }
  ];

  const handlePlotClick = (data: any) => {
    if (data && data.points && data.points.length > 0) {
      const pointIdx = data.points[0].pointIndex;
      const deal = outliersData[pointIdx];
      if (deal) {
        setSelectedDeal(deal);
        if (deal.url) {
          window.open(getAutoEnglishUrl(deal.url), "_blank");
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
            <Database className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">DuckDB Open-Source Analytical Intelligence</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Native Open Analytics
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Statistical clustering, cross-border price arbitrage spread detection, and composite attractiveness scoring computed via DuckDB OLAP SQL.
            </p>
          </div>
        </div>
      </div>

      {/* Grid 1: Marketplace Heatmap + Outlier Deals Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace Heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-gray-900">Average Price Matrix (Category × Store)</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Heatmap mapping average product prices across stores and categories to spot high-cost baseline markets.
          </p>
          <div className="w-full h-[320px] flex items-center justify-center">
            <Plot
              data={heatmapPlotData}
              layout={{
                autosize: true,
                margin: { l: 110, r: 40, t: 20, b: 50 },
                xaxis: { title: { text: "Store Source", font: { size: 11 } } },
                yaxis: { title: { text: "Category", font: { size: 11 } } },
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent"
              }}
              useResizeHandler={true}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Outlier Deals Scatter Plot */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900">Deal Outlier Detector</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Click dot to open product
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Highlights items priced significantly below category standard deviation thresholds. <strong>Click any marker to view product!</strong>
          </p>
          <div className="w-full h-[320px] flex items-center justify-center cursor-pointer">
            <Plot
              data={outlierPlotData}
              layout={{
                autosize: true,
                margin: { l: 50, r: 40, t: 20, b: 50 },
                xaxis: { title: { text: "Price ($)", font: { size: 11 } } },
                yaxis: { title: { text: "Rating (Stars)", font: { size: 11 } } },
                hovermode: "closest",
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent"
              }}
              useResizeHandler={true}
              onClick={handlePlotClick}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Cross-Border Arbitrage Leaderboard */}
      {arbitrageData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">Cross-Border Arbitrage Opportunities</h3>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {arbitrageData.length} Deals Detected
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Matches products across international stores where price spreads exceed 15%. Click to view the bargain store page (auto-translated).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {arbitrageData.slice(0, 6).map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      +{item.spread_pct}% Price Spread
                    </span>
                    <span className="text-xs font-semibold text-gray-500 uppercase">{item.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-3">{item.item_name}</h4>
                  
                  <div className="space-y-2 bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <span className="font-semibold text-emerald-600">{item.store_low.toUpperCase()}</span> ({item.country_low}):
                      </span>
                      <span className="font-bold text-emerald-700 text-sm">${item.price_low}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-1.5">
                      <span className="text-gray-500 flex items-center gap-1">
                        <span className="font-semibold text-rose-600">{item.store_high.toUpperCase()}</span> ({item.country_high}):
                      </span>
                      <span className="font-semibold text-gray-600 line-through">${item.price_high}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={getAutoEnglishUrl(item.url_low)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buy at ${item.price_low} ({item.store_low.toUpperCase()})
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Attractiveness Leaderboard */}
      {attractivenessData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900">Top Market Attractiveness Leaderboard</h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Open Analytics Score 0-100
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Ranks products using a multi-factor score combining price competitiveness, rating, review density, and discount depth.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attractivenessData.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={getAutoEnglishUrl(item.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                {item.image_url && !imgErrors[item.id] ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-12 w-12 rounded-md object-contain bg-gray-50 p-1 border border-gray-100 shrink-0"
                    onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-amber-700">
                      {item.name}
                    </h4>
                    <span className="text-xs font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                      {item.attractiveness_score}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-900">${item.price}</span>
                    <span className="text-xs text-amber-600 flex items-center gap-0.5 font-semibold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {item.rating || 4.0} ({item.reviews_count || 0})
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-amber-600 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Price Tier Clustering Scatter Plot */}
      {clustersData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              <h3 className="text-base font-bold text-gray-900">Statistical Price Tier Clustering</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Budget ({budgetItems.length})
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Sweet-Spot ({valueItems.length})
              </span>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Premium ({premiumItems.length})
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Segments products into 3 market tiers (*Budget Bargain*, *Sweet-Spot Value*, *Premium Tier*) using quantile distribution.
          </p>
          <div className="w-full h-[320px] flex items-center justify-center">
            <Plot
              data={clusterPlotData}
              layout={{
                autosize: true,
                margin: { l: 50, r: 40, t: 20, b: 50 },
                xaxis: { title: { text: "Price ($)", font: { size: 11 } } },
                yaxis: { title: { text: "Rating (Stars)", font: { size: 11 } } },
                hovermode: "closest",
                legend: { orientation: "h", y: 1.12, x: 0.05 },
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent"
              }}
              useResizeHandler={true}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Category Price Tiers Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Price Tiers & Market Percentiles by Category</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Compare typical budget (25th percentile), median, and premium (75th percentile) price levels across categories.
        </p>
        <div className="w-full h-[340px] flex items-center justify-center">
          <Plot
            data={priceTiersPlotData}
            layout={{
              autosize: true,
              barmode: "group",
              margin: { l: 50, r: 40, t: 30, b: 70 },
              xaxis: { title: { text: "Product Category", font: { size: 11 } }, tickangle: -15 },
              yaxis: { title: { text: "Price ($)", font: { size: 11 } } },
              legend: { orientation: "h", y: 1.15, x: 0.05 },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent"
            }}
            useResizeHandler={true}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
