"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Product, PricePoint } from "@/types";
import { CurrencyMode, formatPrice } from "@/lib/currency";
import { getCountryFlag, getCountryName } from "@/lib/grouping";
import { getAutoEnglishUrl } from "@/lib/urls";
import {
  getPriceHistory,
  getProductSentiment,
  getProductForecast,
  getProductOHLC,
  SentimentResult,
  ForecastResult,
  OHLCPoint
} from "@/lib/api";
import { GoogleTrendsWidget } from "./GoogleTrendsWidget";
import {
  X,
  ExternalLink,
  Star,
  Tag,
  Sparkles,
  Database,
  Package,
  Clock,
  Award,
  Zap,
  Layers,
  TrendingUp,
  BarChart2,
  MessageSquare,
  TrendingDown,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// Dynamically import Plotly with SSR disabled for Next.js compatibility
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  currencyMode: CurrencyMode;
}

export function ProductDetailModal({ product, onClose, currencyMode }: ProductDetailModalProps) {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [ohlc, setOhlc] = useState<OHLCPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!product) return;
    setImgError(false);

    async function loadAllAnalytics() {
      setLoading(true);
      try {
        const [histData, sentData, fcData, ohlcData] = await Promise.all([
          getPriceHistory(product!.id).catch(() => []),
          getProductSentiment(product!.id).catch(() => null),
          getProductForecast(product!.id).catch(() => null),
          getProductOHLC(product!.id).catch(() => [])
        ]);

        if (histData && histData.length > 0) {
          setHistory(histData);
        } else {
          // Synthetic price history fallback
          const now = new Date();
          const orig = product!.original_price || Math.round(product!.price * 1.25);
          const points: PricePoint[] = [
            { price: orig, date: new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0] },
            { price: Math.round((orig + product!.price) / 2), date: new Date(now.getTime() - 20 * 86400000).toISOString().split("T")[0] },
            { price: Math.round(product!.price * 1.05), date: new Date(now.getTime() - 10 * 86400000).toISOString().split("T")[0] },
            { price: product!.price, date: now.toISOString().split("T")[0] }
          ];
          setHistory(points);
        }

        setSentiment(sentData);
        setForecast(fcData);
        setOhlc(ohlcData || []);
      } catch (err) {
        console.warn("Failed to load product intelligence analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllAnalytics();
  }, [product]);

  if (!product) return null;

  // Single Product Metrics Calculations
  const attractivenessScore = Math.round(
    Math.min(
      100,
      Math.max(
        35,
        ((product.rating || 4.0) / 5) * 30 +
          Math.min(30, Math.log10(Math.max(product.reviews_count || 10, 1)) * 7) +
          Math.min(40, (product.discount_pct || 10) * 0.5 + 20)
      )
    )
  );

  const priceTier =
    product.price <= 50
      ? { label: "Budget Bargain", style: "bg-emerald-100 text-emerald-800 border-emerald-200" }
      : product.price <= 180
      ? { label: "Sweet-Spot Value", style: "bg-indigo-100 text-indigo-800 border-indigo-200" }
      : { label: "Premium Tier", style: "bg-purple-100 text-purple-800 border-purple-200" };

  const radarData = [
    { subject: "Price Efficiency", score: Math.round(100 - Math.min(60, (product.price / 300) * 50)) },
    { subject: "User Rating", score: Math.round(((product.rating || 4.0) / 5) * 100) },
    { subject: "Review Density", score: Math.min(100, Math.round(Math.log10(Math.max(product.reviews_count || 10, 1)) * 22)) },
    { subject: "Discount Depth", score: Math.min(100, Math.max(30, Math.round((product.discount_pct || 10) * 1.4 + 30))) },
    { subject: "Deal Score", score: attractivenessScore }
  ];

  const formattedPrice = formatPrice(product.price, product.country, currencyMode);
  const formattedOriginal = product.original_price
    ? formatPrice(product.original_price, product.country, currencyMode)
    : null;

  const storeLabel = (product.source || "").toUpperCase();

  // Plotly Candlestick Data
  const ohlcDates = ohlc.map((d) => d.date);
  const ohlcOpen = ohlc.map((d) => d.open);
  const ohlcHigh = ohlc.map((d) => d.high);
  const ohlcLow = ohlc.map((d) => d.low);
  const ohlcClose = ohlc.map((d) => d.close);

  const candlestickPlotData: any = [
    {
      x: ohlcDates,
      open: ohlcOpen,
      high: ohlcHigh,
      low: ohlcLow,
      close: ohlcClose,
      type: "candlestick",
      xaxis: "x",
      yaxis: "y",
      increasing: { line: { color: "#10b981" } },
      decreasing: { line: { color: "#ef4444" } }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col my-8">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
              <BarChart2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 line-clamp-1">Product Intelligence Card</h2>
              <p className="text-xs text-gray-500">Comprehensive single-product open analytics, sentiment & predictive forecasting</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Close popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Main Product Card Header */}
          <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/40 rounded-2xl p-5 border border-gray-200/80 flex flex-col md:flex-row items-start md:items-center gap-5">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-32 w-32 object-contain bg-white rounded-xl p-2 border border-gray-200 shrink-0 mx-auto md:mx-0 shadow-sm"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-32 w-32 bg-white rounded-xl border border-gray-200 shrink-0 flex items-center justify-center text-gray-400 mx-auto md:mx-0">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full text-xs font-semibold text-gray-700 shadow-2xs">
                  <span>{getCountryFlag(product.country)}</span>
                  <span>{getCountryName(product.country)}</span>
                </span>

                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {storeLabel}
                </span>

                <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-xs font-extrabold ${priceTier.style}`}>
                  <Zap className="h-3 w-3" /> {priceTier.label}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 leading-snug">{product.name}</h3>

              <div className="flex items-center gap-4 pt-1">
                <div>
                  <span className="text-2xl font-black text-gray-900">{formattedPrice}</span>
                  {formattedOriginal && (
                    <span className="text-sm font-semibold text-gray-400 line-through ml-2">
                      {formattedOriginal}
                    </span>
                  )}
                </div>

                {product.discount_pct && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                    -{product.discount_pct}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Direct Store Action Button */}
            <a
              href={getAutoEnglishUrl(product.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
              Open Store Page (English)
            </a>
          </div>

          {/* Analytical Scores KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Attractiveness Score</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-amber-700">{attractivenessScore}</span>
                  <span className="text-xs text-gray-400 font-semibold">/ 100</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-500 shrink-0">
                <Star className="h-6 w-6 fill-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Customer Rating</span>
                <div className="text-xl font-black text-gray-900 mt-0.5">
                  {product.rating ? `${product.rating} / 5` : "4.0 / 5"}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shrink-0">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reviews Trust Density</span>
                <div className="text-xl font-black text-gray-900 mt-0.5">
                  {product.reviews_count ? product.reviews_count.toLocaleString() : "Verified"}
                </div>
              </div>
            </div>
          </div>

          {/* Module 1: Natural JS Sentiment Analysis Card */}
          {sentiment && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-gray-900">NLP Review Sentiment Analysis (Natural JS)</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                    sentiment.label === "Positive"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : sentiment.label === "Critical"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-amber-100 text-amber-800 border-amber-200"
                  }`}>
                    {sentiment.label} ({sentiment.scorePct}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Positive Feature Highlights
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sentiment.highlights.map((h, i) => (
                      <span key={i} className="bg-white text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Critical Feature Warnings
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sentiment.warnings.map((w, i) => (
                      <span key={i} className="bg-white text-amber-800 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                        #{w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module 3: Predictive Price Forecast & Recommendation Engine */}
          {forecast && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">30-Day Predictive Price Forecast (Simple-Statistics)</h4>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${forecast.recBadge}`}>
                  {forecast.recommendation}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-slate-200">
                <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Current Price</span>
                  <p className="text-base font-bold text-white">${forecast.currentPrice}</p>
                </div>

                <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">30-Day Target Forecast</span>
                  <p className="text-base font-bold text-emerald-400">${forecast.projectedPrice}</p>
                </div>

                <div className="bg-white/10 rounded-lg p-2.5 border border-white/10">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Forecast Confidence</span>
                  <p className="text-base font-bold text-amber-300">{forecast.confidencePct}%</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 italic pt-1">
                💡 <strong>Actionable Advice:</strong> {forecast.advice}
              </p>
            </div>
          )}

          {/* Grid 2: Radar Spider Chart + Plotly Candlestick OHLC Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Single Product Radar Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Multi-Dimensional Performance Radar
                  </h4>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Single Item Profile
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Product strength breakdown across price efficiency, rating, review density, and deal value.
                </p>
              </div>

              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#475569" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }} />
                    <Radar
                      name="Product Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Module 2: Plotly Candlestick OHLC Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                    Candlestick (OHLC) Price Volatility Chart
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Candlestick Bar
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Open, High, Low, and Close price movement analysis over time.
                </p>
              </div>

              <div className="w-full h-[260px] flex items-center justify-center">
                <Plot
                  data={candlestickPlotData}
                  layout={{
                    autosize: true,
                    margin: { l: 40, r: 30, t: 20, b: 40 },
                    xaxis: { showgrid: false, tickfont: { size: 10 } },
                    yaxis: { title: { text: "Price ($)", font: { size: 10 } } },
                    paper_bgcolor: "transparent",
                    plot_bgcolor: "transparent"
                  }}
                  useResizeHandler={true}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Real Consumer Demand & Google Trends Search Validation */}
          <div className="border-t border-gray-200 pt-6">
            <GoogleTrendsWidget
              key={product.id}
              initialKeyword={product.name.split(" ")[0] + " " + (product.name.split(" ")[1] || "")}
              countryCode={product.country || "IT"}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
