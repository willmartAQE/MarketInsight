"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getDuckDBHeatmap, getDuckDBOutliers, getDuckDBQuantiles } from "@/lib/api";
import { Database, Zap, Sparkles, TrendingDown, Layers, Loader2, ExternalLink, Tag, Star } from "lucide-react";

// Dynamically import Plotly with SSR disabled for Next.js compatibility
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function DuckDBPlotlyAnalytics() {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [outliersData, setOutliersData] = useState<any[]>([]);
  const [quantilesData, setQuantilesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const [heatmap, outliers, quantiles] = await Promise.all([
          getDuckDBHeatmap(),
          getDuckDBOutliers(),
          getDuckDBQuantiles()
        ]);
        setHeatmapData(heatmap || []);
        setOutliersData(outliers || []);
        setQuantilesData(quantiles || []);
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
        colorbar: { title: "% vs Avg" }
      }
    }
  ];

  // 3. Category Price Tiers Grouped Bar Chart
  const categoryNames = quantilesData.map((q) => q.category);
  const p25Prices = quantilesData.map((q) => q.p25_price);
  const medianPrices = quantilesData.map((q) => q.median_price);
  const p75Prices = quantilesData.map((q) => q.p75_price);

  const priceTiersPlotData: any = [
    {
      x: categoryNames,
      y: p25Prices,
      name: "Budget Tier (25th Percentile)",
      type: "bar",
      marker: { color: "#3b82f6" }
    },
    {
      x: categoryNames,
      y: medianPrices,
      name: "Median Market Price",
      type: "bar",
      marker: { color: "#10b981" }
    },
    {
      x: categoryNames,
      y: p75Prices,
      name: "Premium Tier (75th Percentile)",
      type: "bar",
      marker: { color: "#8b5cf6" }
    }
  ];

  const handlePlotClick = (data: any) => {
    if (data && data.points && data.points.length > 0) {
      const pointIdx = data.points[0].pointIndex;
      const deal = outliersData[pointIdx];
      if (deal) {
        setSelectedDeal(deal);
        if (deal.url) {
          window.open(deal.url, "_blank");
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
              <h2 className="text-xl font-bold">High-Speed Analytics Engine</h2>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                <Zap className="h-3 w-3" /> Real-Time OLAP
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Analyzing price anomalies, marketplace correlations, and statistical distribution in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Marketplace Price Matrix</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Heatmap comparing pricing levels across stores and product categories.
          </p>
          <div className="w-full h-[320px] flex items-center justify-center">
            <Plot
              data={heatmapPlotData}
              layout={{
                autosize: true,
                margin: { l: 110, r: 40, t: 20, b: 50 },
                xaxis: { title: { text: "Marketplace Store", font: { size: 11 } } },
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

      {/* Detected Outlier Deals Grid */}
      {outliersData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-600" />
              Top Detected Outlier Deals
            </h3>
            <span className="text-xs text-gray-500">Click any deal card to open store page</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {outliersData.slice(0, 6).map((deal) => (
              <a
                key={deal.id}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                {deal.image_url && (
                  <img
                    src={deal.image_url}
                    alt={deal.name}
                    className="h-12 w-12 rounded-md object-contain bg-gray-50 p-1 border border-gray-100 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-emerald-700">
                    {deal.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-900">${deal.price}</span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      -{deal.savings_vs_avg_pct}% vs avg
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 shrink-0" />
              </a>
            ))}
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
