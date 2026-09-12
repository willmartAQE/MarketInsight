"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { CurrencyMode, formatPrice } from "@/lib/currency";
import { getAutoEnglishUrl } from "@/lib/urls";
import { getCountryFlag, getCountryName, groupCrossCountryProducts, ProductGroup } from "@/lib/grouping";
import { GoogleTrendsWidget } from "./GoogleTrendsWidget";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Check,
  X,
  Trophy,
  Tag,
  ShoppingBag,
  TrendingUp,
  Scale,
  Globe,
  Sparkles,
  Layers,
  Info,
  Package
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";

interface ProductComparisonProps {
  products: Product[];
  onRemoveProduct: (id: number) => void;
  onClearAll: () => void;
  onBack: () => void;
  currencyMode: CurrencyMode;
}

function formatSource(source: string): { label: string; style: string } {
  const src = (source || "").toLowerCase();
  if (src === "walmart" || src === "walmart-us") return { label: "Walmart", style: "bg-blue-100 text-blue-700 border-blue-200" };
  if (src === "walmart-ca") return { label: "Walmart CA", style: "bg-blue-100 text-blue-800 border-blue-300" };
  if (src.startsWith("amazon")) {
    const parts = src.split("-");
    const code = parts[1] ? parts[1].toUpperCase() : "";
    return { label: `Amazon ${code}`.trim(), style: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  if (src === "allegro") return { label: "Allegro", style: "bg-orange-100 text-orange-700 border-orange-200" };
  if (src === "bol-nl" || src === "bol") return { label: "Bol.com", style: "bg-sky-100 text-sky-700 border-sky-200" };
  if (src === "cdiscount") return { label: "Cdiscount", style: "bg-red-100 text-red-700 border-red-200" };
  if (src === "otto-de" || src === "otto") return { label: "Otto.de", style: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (src === "elcorteingles") return { label: "El Corte Inglés", style: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  if (src === "homedepot") return { label: "The Home Depot", style: "bg-orange-100 text-orange-800 border-orange-300" };
  if (src === "bestbuy") return { label: "Best Buy", style: "bg-yellow-100 text-blue-900 border-yellow-300" };
  if (src === "bestbuy-ca") return { label: "Best Buy CA", style: "bg-yellow-100 text-blue-900 border-yellow-300" };
  if (src === "sears") return { label: "Sears", style: "bg-indigo-100 text-indigo-800 border-indigo-200" };
  if (src === "canadiantire") return { label: "Canadian Tire", style: "bg-red-100 text-red-800 border-red-300" };
  return { label: source, style: "bg-gray-100 text-gray-700 border-gray-200" };
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function ProductComparison({
  products,
  onRemoveProduct,
  onClearAll,
  onBack,
  currencyMode
}: ProductComparisonProps) {
  const productGroups = useMemo(() => {
    return groupCrossCountryProducts(products, false);
  }, [products]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const activeGroup = useMemo(() => {
    if (!productGroups || productGroups.length === 0) return null;
    if (selectedGroupId) {
      const found = productGroups.find((g) => g.id === selectedGroupId);
      if (found) return found;
    }
    return productGroups[0];
  }, [productGroups, selectedGroupId]);

  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center max-w-md w-full">
          <Scale className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Products Selected</h2>
          <p className="text-gray-500 text-sm mb-6">
            Please return to the dashboard and select products using the checkboxes to compare them side-by-side.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeProducts = activeGroup ? activeGroup.products : products;

  // Calculate best metrics for active group
  const lowestPriceProduct = [...activeProducts].sort((a, b) => a.price - b.price)[0];
  const highestRatingProduct = [...activeProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  const highestDiscountProduct = [...activeProducts].sort((a, b) => (b.discount_pct || 0) - (a.discount_pct || 0))[0];

  const chartData = activeProducts.map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name,
    fullTitle: p.name,
    price: p.price,
    rating: p.rating || 0,
    reviews: p.reviews_count || 0
  }));

  const maxPrice = Math.max(...activeProducts.map((p) => p.price || 1));
  const minPrice = Math.min(...activeProducts.map((p) => p.price || 1));
  const priceRange = Math.max(maxPrice - minPrice, 1);

  const radarData = [
    {
      subject: "Price Efficiency",
      fullMark: 100,
      ...Object.fromEntries(
        activeProducts.map((p) => [
          p.id,
          Math.round(100 - ((p.price - minPrice) / priceRange) * 50)
        ])
      )
    },
    {
      subject: "User Rating",
      fullMark: 100,
      ...Object.fromEntries(
        activeProducts.map((p) => [
          p.id,
          Math.round(((p.rating || 4.0) / 5) * 100)
        ])
      )
    },
    {
      subject: "Review Density",
      fullMark: 100,
      ...Object.fromEntries(
        activeProducts.map((p) => [
          p.id,
          Math.min(100, Math.round(Math.log10(Math.max(p.reviews_count || 10, 1)) * 22))
        ])
      )
    },
    {
      subject: "Discount Depth",
      fullMark: 100,
      ...Object.fromEntries(
        activeProducts.map((p) => [
          p.id,
          Math.min(100, Math.max(35, Math.round((p.discount_pct || 10) * 1.4 + 30)))
        ])
      )
    },
    {
      subject: "Deal Score",
      fullMark: 100,
      ...Object.fromEntries(
        activeProducts.map((p) => {
          const rScore = ((p.rating || 4.0) / 5) * 40;
          const revScore = Math.min(30, Math.log10(Math.max(p.reviews_count || 10, 1)) * 7);
          const pScore = 30 - ((p.price - minPrice) / priceRange) * 20;
          return [p.id, Math.round(rScore + revScore + pScore)];
        })
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Bar */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <div className="h-6 w-[1px] bg-gray-200" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                Product Comparison Matrix
              </h1>
              <p className="text-xs text-gray-500">Comparing {products.length} selected products</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClearAll}
              className="px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Product Group Selector Tabs */}
        {productGroups.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Product Group Tabs ({productGroups.length})
                </span>
                <span className="text-[11px] text-gray-500">
                  — Select a product group to compare its identical cross-country items
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {productGroups.map((group) => {
                const isActive = activeGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <span>{group.countries.map((c) => getCountryFlag(c)).join(" ")}</span>
                    <span className="line-clamp-1 max-w-[220px]">{group.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {group.products.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Single Item Warning Banner if group has only 1 product */}
        {activeProducts.length === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-800">
            <Info className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <strong>Single Product Group:</strong> Showing 1 product in this group (<em>{activeProducts[0].name}</em>). Select matching items from other countries or run scraping to compare cross-country prices side-by-side.
            </div>
          </div>
        )}

        {/* Highlights Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lowest Price */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-lg bg-emerald-500 text-white shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Lowest Price Deal</span>
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{lowestPriceProduct.name}</p>
              <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
                {formatPrice(lowestPriceProduct.price, lowestPriceProduct.country, currencyMode)}
              </p>
            </div>
          </div>

          {/* Highest Rating */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-lg bg-amber-500 text-white shrink-0">
              <Star className="h-5 w-5 fill-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Top Rated</span>
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{highestRatingProduct.name}</p>
              <p className="text-lg font-extrabold text-amber-700 mt-0.5 flex items-center gap-1">
                {highestRatingProduct.rating ? `${highestRatingProduct.rating} / 5` : "N/A"}
              </p>
            </div>
          </div>

          {/* Highest Discount */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 rounded-lg bg-purple-500 text-white shrink-0">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">Biggest Discount</span>
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                {highestDiscountProduct.discount_pct ? highestDiscountProduct.name : "No Discount Found"}
              </p>
              <p className="text-lg font-extrabold text-purple-700 mt-0.5">
                {highestDiscountProduct.discount_pct ? `-${highestDiscountProduct.discount_pct}% OFF` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-side Table Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left font-medium text-gray-500 w-48 shrink-0 bg-gray-50/80 sticky left-0 z-10 border-r border-gray-200">
                    Feature / Product
                  </th>
                  {activeProducts.map((product) => {
                    const isLowest = product.id === lowestPriceProduct.id;
                    const srcInfo = formatSource(product.source);

                    return (
                      <th key={product.id} className="p-4 text-left min-w-[240px] max-w-[300px] align-top relative border-r border-gray-100 last:border-r-0">
                        <button
                          onClick={() => onRemoveProduct(product.id)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="pr-6">
                          {product.image_url && !imgErrors[product.id] ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-28 w-28 object-contain bg-gray-50 rounded-lg p-2 border border-gray-200 mb-3 mx-auto"
                              onError={() => setImgErrors(prev => ({ ...prev, [product.id]: true }))}
                            />
                          ) : (
                            <div className="h-28 w-28 bg-gray-50 rounded-lg border border-gray-200 mb-3 mx-auto flex items-center justify-center text-gray-400">
                              <Package className="h-10 w-10 text-gray-300" />
                            </div>
                          )}
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mb-2 ${srcInfo.style}`}>
                            {srcInfo.label}
                          </span>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                            {product.name}
                          </h3>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {/* Price Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Price
                  </td>
                  {activeProducts.map((p) => {
                    const isLowest = p.id === lowestPriceProduct.id;
                    const formatted = formatPrice(p.price, p.country, currencyMode);

                    return (
                      <td key={p.id} className={`p-4 align-top border-r border-gray-100 last:border-r-0 ${isLowest ? "bg-emerald-50/50" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xl font-bold text-gray-900">{formatted}</span>
                          {isLowest && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2 py-0.5 rounded-full">
                              <Check className="h-3 w-3" /> Best Price
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Original Price Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Original Price
                  </td>
                  {activeProducts.map((p) => (
                    <td key={p.id} className="p-4 text-gray-500 border-r border-gray-100 last:border-r-0">
                      {p.original_price ? (
                        <span className="line-through">{formatPrice(p.original_price, p.country, currencyMode)}</span>
                      ) : (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Discount Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Discount
                  </td>
                  {activeProducts.map((p) => (
                    <td key={p.id} className="p-4 border-r border-gray-100 last:border-r-0">
                      {p.discount_pct ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                          -{p.discount_pct}% OFF
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Rating Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Rating & Reviews
                  </td>
                  {activeProducts.map((p) => (
                    <td key={p.id} className="p-4 border-r border-gray-100 last:border-r-0">
                      {p.rating ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 font-semibold text-gray-900">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span>{p.rating} / 5</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {p.reviews_count ? `${p.reviews_count.toLocaleString()} reviews` : "No reviews count"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-300">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Country / Origin Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Country / Origin
                  </td>
                  {activeProducts.map((p) => (
                    <td key={p.id} className="p-4 border-r border-gray-100 last:border-r-0 font-medium text-gray-900">
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-xs">
                        <span>{getCountryFlag(p.country)}</span>
                        <strong>{getCountryName(p.country)}</strong>
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Marketplace / Source Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Marketplace
                  </td>
                  {activeProducts.map((p) => {
                    const srcInfo = formatSource(p.source);
                    return (
                      <td key={p.id} className="p-4 border-r border-gray-100 last:border-r-0 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{getCountryFlag(p.country)}</span>
                          <span>{srcInfo.label}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Seller Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Seller
                  </td>
                  {activeProducts.map((p) => (
                    <td key={p.id} className="p-4 border-r border-gray-100 last:border-r-0 text-gray-600">
                      {p.seller || "N/A"}
                    </td>
                  ))}
                </tr>

                {/* Availability Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Availability
                  </td>
                  {activeProducts.map((p) => (
                    <td key={p.id} className="p-4 border-r border-gray-100 last:border-r-0 text-gray-600">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                        <Check className="h-3.5 w-3.5" />
                        {p.availability || "In Stock"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Direct Link Row */}
                <tr>
                  <td className="p-4 font-semibold text-gray-700 bg-gray-50/50 sticky left-0 z-10 border-r border-gray-200">
                    Action
                  </td>
                  {activeProducts.map((p) => (
                    <td key={p.id} className="p-4 border-r border-gray-100 last:border-r-0">
                      <a
                        href={getAutoEnglishUrl(p.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Product
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Charts Comparison: Radar & Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Multi-Dimensional Radar/Spider Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Multi-Dimensional Radar Analysis (Spider Chart)
                </h3>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  0-100 Score Matrix
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Compares selected items across 5 core dimensions: Price Efficiency, Rating, Review Density, Discount Depth, and Overall Deal Score.
              </p>
            </div>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#475569" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  {activeProducts.map((p, idx) => (
                    <Radar
                      key={p.id}
                      name={p.name.length > 22 ? p.name.slice(0, 20) + "..." : p.name}
                      dataKey={String(p.id)}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={COLORS[idx % COLORS.length]}
                      fillOpacity={0.25}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Price Visual Comparison Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Direct Price Comparison
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Visualizes raw price difference across selected items in {currencyMode.toUpperCase()}.
              </p>
            </div>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    formatter={(value: any) => [`${value} ${currencyMode === "usd" ? "$" : "€"}`, "Price"]}
                  />
                  <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Real Consumer Demand & Google Trends Search Validation */}
        <GoogleTrendsWidget
          key={lowestPriceProduct?.id || "compare-trends"}
          initialKeyword={lowestPriceProduct?.name ? lowestPriceProduct.name.split(" ")[0] + " " + (lowestPriceProduct.name.split(" ")[1] || "") : "DeLonghi"}
          countryCode={lowestPriceProduct?.country || "IT"}
        />
      </main>
    </div>
  );
}
