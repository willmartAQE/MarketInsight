"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { ProductGroup, groupCrossCountryProducts, getCountryFlag, getCountryName } from "@/lib/grouping";
import { CurrencyMode, formatPrice } from "@/lib/currency";
import { Globe, X, ArrowRight, TrendingUp, Layers, Check, ShoppingCart, Sparkles } from "lucide-react";

interface CrossCountryGroupingModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currencyMode: CurrencyMode;
  onSelectGroup: (group: ProductGroup) => void;
  onSelectAllGroups: (groups: ProductGroup[]) => void;
}

export function CrossCountryGroupingModal({
  isOpen,
  onClose,
  products,
  currencyMode,
  onSelectGroup,
  onSelectAllGroups,
}: CrossCountryGroupingModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const groups = useMemo(() => {
    return groupCrossCountryProducts(products);
  }, [products]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;
    const q = searchTerm.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.countries.some((c) => getCountryName(c).toLowerCase().includes(q))
    );
  }, [groups, searchTerm]);

  if (!isOpen) return null;

  const totalMatchedProducts = groups.reduce((acc, g) => acc + g.products.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Cross-Country Product Matcher
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200">
                  <Sparkles className="h-3 w-3" /> Auto-Grouped
                </span>
              </h2>
              <p className="text-xs text-blue-200/80">
                Grouped identical products sold across different European and Global marketplaces
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-blue-200/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-600 font-medium">
            <span className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
              <Layers className="h-4 w-4 text-blue-600" />
              <strong>{groups.length}</strong> Product Groups
            </span>
            <span className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              <strong>{totalMatchedProducts}</strong> Items Matched
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search product group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 bg-white"
            />
            {groups.length > 0 && (
              <button
                onClick={() => onSelectAllGroups(groups)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                Compare All Groups ({totalMatchedProducts})
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">No matching cross-country product groups found</p>
              <p className="text-xs text-gray-400 mt-1">Try clearing your filters or selecting all stores</p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const lowestPriceFormatted = formatPrice(group.minPrice, group.cheapestProduct.country, currencyMode);
              const maxPriceFormatted = formatPrice(group.maxPrice, group.products[group.products.length - 1].country, currencyMode);

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                        {group.category}
                      </span>
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md text-xs font-semibold text-gray-700">
                        <span>Countries ({group.countries.length}):</span>
                        {group.countries.map((c) => (
                          <span key={c} title={getCountryName(c)}>
                            {getCountryFlag(c)}
                          </span>
                        ))}
                      </div>
                      {group.priceVariancePct > 10 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-extrabold">
                          <TrendingUp className="h-3 w-3" /> +{group.priceVariancePct}% Price Arbitrage
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                      {group.name}
                    </h3>

                    {/* Stores & Prices Breakdown */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {group.products.map((p) => (
                        <span
                          key={p.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                            p.id === group.cheapestProduct.id
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                              : "bg-gray-50 border-gray-200 text-gray-700"
                          }`}
                        >
                          <span>{getCountryFlag(p.country)}</span>
                          <span className="text-[11px] text-gray-500 uppercase">{p.source.replace("ebay-", "eBay ").replace("amazon-", "Amazon ")}</span>
                          <span>{formatPrice(p.price, p.country, currencyMode)}</span>
                          {p.id === group.cheapestProduct.id && (
                            <span className="bg-emerald-600 text-white text-[10px] px-1 rounded font-bold">BEST</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-5 space-y-2">
                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 font-medium block uppercase tracking-wider">Price Range</span>
                      <span className="text-sm font-bold text-gray-900">
                        {lowestPriceFormatted} <span className="text-gray-400 font-normal">to</span> {maxPriceFormatted}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectGroup(group)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95"
                    >
                      Compare {group.products.length} Products
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
