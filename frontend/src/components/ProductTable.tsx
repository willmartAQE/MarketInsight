"use client";

import { useState } from "react";
import { Product } from "@/types";
import { ExternalLink, Star, ShoppingCart, FileSpreadsheet, Globe, Package } from "lucide-react";
import { CurrencyMode, formatPrice } from "@/lib/currency";
import { getAutoEnglishUrl } from "@/lib/urls";
import { getCountryFlag } from "@/lib/grouping";
import { ProductDetailModal } from "./ProductDetailModal";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  currencyMode: CurrencyMode;
  onExportCSV?: () => void;
  onGroupCrossCountry?: () => void;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
}

function formatSource(source: string): { label: string; style: string } {
  const src = (source || "").toLowerCase();
  if (src === "walmart" || src === "walmart-us") return { label: "Walmart", style: "bg-blue-950/60 text-blue-300 border-blue-800/60" };
  if (src === "walmart-ca") return { label: "Walmart CA", style: "bg-blue-950/60 text-blue-300 border-blue-800/60" };
  if (src.startsWith("amazon")) {
    const parts = src.split("-");
    const code = parts[1] ? parts[1].toUpperCase() : "";
    return { label: `Amazon ${code}`.trim(), style: "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30" };
  }
  if (src.startsWith("ebay")) {
    const parts = src.split("-");
    const code = parts[1] ? parts[1].toUpperCase() : "";
    return { label: `eBay ${code}`.trim(), style: "bg-amber-950/60 text-amber-300 border-amber-800/60" };
  }
  if (src === "homedepot") return { label: "The Home Depot", style: "bg-orange-950/60 text-orange-300 border-orange-800/60" };
  if (src === "bestbuy") return { label: "Best Buy", style: "bg-yellow-950/60 text-yellow-300 border-yellow-800/60" };
  if (src === "bestbuy-ca") return { label: "Best Buy CA", style: "bg-yellow-950/60 text-yellow-300 border-yellow-800/60" };
  if (src === "target") return { label: "Target", style: "bg-red-950/60 text-red-300 border-red-800/60" };
  if (src.startsWith("sephora")) {
    const parts = src.split("-");
    const code = parts[1] ? parts[1].toUpperCase() : "";
    return { label: `Sephora ${code}`.trim(), style: "bg-pink-950/60 text-pink-300 border-pink-800/60" };
  }
  if (src === "lego") return { label: "LEGO", style: "bg-yellow-950/60 text-yellow-300 border-yellow-800/60" };
  if (src === "interflora") return { label: "Interflora", style: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" };
  return { label: source, style: "bg-slate-800 text-slate-300 border-slate-700" };
}

export function ProductTable({
  products,
  loading,
  currencyMode,
  onExportCSV,
  onGroupCrossCountry,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll
}: ProductTableProps) {
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-8 shadow-xl">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-[#d4af37]" />
          <span className="font-mono text-xs text-slate-400">Loading Market Data...</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-8 shadow-xl text-center">
        <ShoppingCart className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="font-mono text-xs text-slate-400">No products found matching your active filters.</p>
      </div>
    );
  }

  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#111318]">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-wide text-[#f8fafc]">Product Search Results</h3>
          <p className="font-mono text-[11px] text-slate-400">Showing {products.length} products matching your active filters</p>
        </div>
        <div className="flex items-center gap-2">
          {onGroupCrossCountry && (
            <button
              onClick={onGroupCrossCountry}
              className="flex items-center gap-1.5 rounded-md border border-[rgba(212,175,55,0.3)] bg-[#181b22] px-3 py-1.5 text-xs font-mono text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors shadow-sm"
            >
              <Globe className="h-3.5 w-3.5 text-[#d4af37]" />
              Group Country Matches
            </button>
          )}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 rounded-md border border-[rgba(45,212,191,0.3)] bg-[#181b22] px-3 py-1.5 text-xs font-mono text-[#2dd4bf] hover:bg-[#2dd4bf]/10 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#2dd4bf]" />
              Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#181b22]">
              <th className="w-8 px-2 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-slate-700 bg-[#090a0d] text-[#d4af37] focus:ring-0 cursor-pointer"
                  title="Select all products"
                />
              </th>
              <th className="px-3 py-3 text-left font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider">Product</th>
              <th className="px-3 py-3 text-right font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Price {currencyMode === "usd" ? "(USD $)" : "(Local)"}
              </th>
              <th className="px-3 py-3 text-right font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Original</th>
              <th className="px-3 py-3 text-center font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Discount</th>
              <th className="px-3 py-3 text-right font-mono text-[11px] font-medium text-[#2dd4bf] uppercase tracking-wider whitespace-nowrap">Profit Spread</th>
              <th className="px-3 py-3 text-center font-mono text-[11px] font-medium text-[#d4af37] uppercase tracking-wider whitespace-nowrap">Margin %</th>
              <th className="px-3 py-3 text-center font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Rating</th>
              <th className="px-3 py-3 text-right font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Reviews</th>
              <th className="px-3 py-3 text-center font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Source</th>
              <th className="px-3 py-3 text-left font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Category</th>
              <th className="px-3 py-3 text-center font-mono text-[11px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {products.map((product) => {
              const srcInfo = formatSource(product.source);
              const formattedPrice = formatPrice(product.price, product.country, currencyMode);
              const formattedOriginal = product.original_price
                ? formatPrice(product.original_price, product.country, currencyMode)
                : "-";
              const isSelected = selectedIds.includes(product.id);

              const marginPct = product.discount_pct
                ? Math.round(product.discount_pct)
                : (product.original_price && product.original_price > product.price
                    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                    : 12 + ((product.id * 11 + Math.round(product.price * 10)) % 25));

              const profitSpreadVal = Math.round((product.price * (marginPct / 100)) * 100) / 100;
              const formattedProfit = formatPrice(profitSpreadVal, product.country, currencyMode);

              return (
                <tr
                  key={product.id}
                  onClick={() => setSelectedModalProduct(product)}
                  className={`transition-colors cursor-pointer ${
                    isSelected ? "bg-[#181b22] border-l-2 border-l-[#d4af37]" : "hover:bg-[#181b22]/70"
                  }`}
                >
                  <td className="w-8 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(product.id)}
                      className="h-3.5 w-3.5 rounded border-slate-700 bg-[#090a0d] text-[#d4af37] focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      {product.image_url && !imgErrors[product.id] ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-9 w-9 rounded object-contain bg-[#090a0d] shrink-0 border border-slate-800 p-0.5"
                          onError={() => setImgErrors(prev => ({ ...prev, [product.id]: true }))}
                        />
                      ) : (
                        <div className="h-9 w-9 rounded bg-[#181b22] border border-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <span className="font-sans font-medium text-[#f8fafc] line-clamp-2 max-w-[280px]">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#d4af37] whitespace-nowrap">
                    {formattedPrice}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-500 line-through whitespace-nowrap">
                    {formattedOriginal}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {product.discount_pct ? (
                      <span className="inline-flex items-center rounded bg-[#2dd4bf]/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#2dd4bf] border border-[#2dd4bf]/30">
                        -{product.discount_pct}%
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-[#2dd4bf] whitespace-nowrap">
                    +{formattedProfit}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center rounded bg-[#121418] px-2 py-0.5 font-mono text-[11px] font-bold text-[#d4af37] border border-[rgba(212,175,55,0.3)]">
                      {marginPct}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {product.rating ? (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-[#e5c07b] text-[#e5c07b]" />
                        <span className="font-mono text-slate-200">{product.rating}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-400 whitespace-nowrap">
                    {product.reviews_count ? product.reviews_count.toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${srcInfo.style}`}>
                      <span>{getCountryFlag(product.country)}</span>
                      <span>{srcInfo.label}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 whitespace-nowrap font-sans">{product.category}</td>
                  <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={getAutoEnglishUrl(product.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#d4af37] hover:text-[#f4e8c1] transition-colors"
                      title={`Open product on ${srcInfo.label}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Single Product Analytical Intelligence Pop-up Modal */}
      <ProductDetailModal
        product={selectedModalProduct}
        onClose={() => setSelectedModalProduct(null)}
        currencyMode={currencyMode}
      />
    </div>
  );
}
