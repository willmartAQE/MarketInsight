"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getDuckDBHeatmap, getDuckDBOutliers, getDuckDBQuantiles } from "@/lib/api";
import { Database, Zap, Sparkles, TrendingDown, Layers, Loader2 } from "lucide-react";

// Dynamically import Plotly with SSR disabled for Next.js compatibility
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function DuckDBPlotlyAnalytics() {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [outliersData, setOutliersData] = useState<any[]>([]);
  const [quantilesData, setQuantilesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        console.error("Failed to load DuckDB Plotly analytics:", err);
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 font-medium">Running DuckDB OLAP analytical queries in-process...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 text-sm">
        Failed to load DuckDB analytics: {error}
      </div>
    );
  }

  // 1. Prepare Heatmap Data (Category vs Store)
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
      colorbar: { title: "Avg Price ($)" }
    }
  ];

  // 2. Prepare Outliers Scatter Plot (Price vs Rating)
  const outlierPlotData: any = [
    {
      x: outliersData.map((d) => d.price),
      y: outliersData.map((d) => d.rating || 4.0),
      text: outliersData.map((d) => `${d.name} (${d.source}) - ${d.savings_vs_avg_pct}% cheaper than avg`),
      mode: "markers",
      type: "scatter",
      marker: {
        size: outliersData.map((d) => Math.max(12, Math.min(30, (d.savings_vs_avg_pct || 15) / 2))),
        color: outliersData.map((d) => d.savings_vs_avg_pct),
        colorscale: "Portland",
        showscale: true,
        colorbar: { title: "% vs Avg" }
      }
    }
  ];

  // 3. Prepare Quantiles Box Plot
  const boxPlotData: any = quantilesData.map((q) => ({
    type: "box",
    name: q.category,
    q1: [q.p25_price],
    median: [q.median_price],
    q3: [q.p75_price],
    mean: [q.avg_price],
    boxpoints: false
  }));

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
              <h2 className="text-xl font-bold">DuckDB & Plotly High-Speed Analytics Engine</h2>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                <Zap className="h-3 w-3" /> In-Memory OLAP
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Executing vectorized OLAP queries directly on product datasets in milliseconds without database locking.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Plotly Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Price Heatmap by Store & Category</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Interactive DuckDB matrix showing average pricing levels across all monitored marketplaces.
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900">DuckDB Deal Outlier Detector</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {outliersData.length} Deals Detected
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Identifies products priced significantly lower than category standard deviation thresholds.
          </p>
          <div className="w-full h-[320px] flex items-center justify-center">
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
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Category Price Quantiles Box Plot */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Price Quantile Distribution (DuckDB Percentiles)</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Shows 25th percentile, Median, 75th percentile, and Average price bands computed by DuckDB.
        </p>
        <div className="w-full h-[300px] flex items-center justify-center">
          <Plot
            data={boxPlotData}
            layout={{
              autosize: true,
              margin: { l: 50, r: 40, t: 20, b: 50 },
              yaxis: { title: { text: "Price ($)", font: { size: 11 } } },
              showlegend: true,
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
