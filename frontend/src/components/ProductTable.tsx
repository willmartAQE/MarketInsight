"use client";

import { useState } from "react";
import { Product } from "@/types";
import { ExternalLink, Star, ShoppingCart, FileSpreadsheet, Globe, Package } from "lucide-react";
import { CurrencyMode, formatPrice } from "@/lib/currency";
import { getAutoEnglishUrl } from "@/lib/urls";
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
  if (src === "walmart" || src === "walmart-us") return { label: "Walmart", style: "bg-blue-100 text-blue-700 border-blue-200" };
  if (src === "walmart-ca") return { label: "Walmart CA", style: "bg-blue-100 text-blue-800 border-blue-300" };
  if (src.startsWith("amazon")) {
    const parts = src.split("-");
    const code = parts[1] ? parts[1].toUpperCase() : "";
    return { label: `Amazon ${code}`.trim(), style: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  if (src.startsWith("ebay")) {
    const parts = src.split("-");
    const code = parts[1] ? parts[1].toUpperCase() : "";
    return { label: `eBay ${code}`.trim(), style: "bg-yellow-100 text-yellow-800 border-yellow-200" };
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
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span className="text-gray-500">Loading products...</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No products found. Select a country or store to load products.</p>
      </div>
    );
  }

  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Product Search Results</h3>
          <p className="text-xs text-gray-500">Showing {products.length} products matching your active filters</p>
        </div>
        <div className="flex items-center gap-2">
          {onGroupCrossCountry && (
            <button
              onClick={onGroupCrossCountry}
              className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
            >
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              Group Country Matches
            </button>
          )}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
              Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="Select all products"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                Price {currencyMode === "usd" ? "(USD $)" : "(Local)"}
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Original</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Discount</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Rating</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Reviews</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Source</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => {
              const srcInfo = formatSource(product.source);
              const formattedPrice = formatPrice(product.price, product.country, currencyMode);
              const formattedOriginal = product.original_price
                ? formatPrice(product.original_price, product.country, currencyMode)
                : "-";
              const isSelected = selectedIds.includes(product.id);

              return (
                <tr
                  key={product.id}
                  onClick={() => setSelectedModalProduct(product)}
                  className={`transition-colors cursor-pointer ${
                    isSelected ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-blue-50/40"
                  }`}
                >
                  <td className="w-10 px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(product.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_url && !imgErrors[product.id] ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-contain bg-gray-50 shrink-0 border border-gray-100 p-0.5"
                          onError={() => setImgErrors(prev => ({ ...prev, [product.id]: true }))}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 line-clamp-2 max-w-[300px]">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formattedPrice}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {formattedOriginal}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.discount_pct ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        -{product.discount_pct}%
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.rating ? (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-gray-700">{product.rating}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {product.reviews_count ? product.reviews_count.toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${srcInfo.style}`}>
                      {srcInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={getAutoEnglishUrl(product.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      title={`Open product on ${srcInfo.label}`}
                    >
                      <ExternalLink className="h-4 w-4" />
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

