"use client";

import { Filters, CountryStores } from "@/types";
import { Filter, ArrowUpDown, Globe, Coins } from "lucide-react";
import { CurrencyMode } from "@/lib/currency";

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  sources: string[];
  categories: string[];
  stores: Record<string, CountryStores>;
  currencyMode: CurrencyMode;
  onCurrencyModeChange: (mode: CurrencyMode) => void;
}

export function FilterBar({
  filters,
  onChange,
  sources,
  categories,
  stores,
  currencyMode,
  onCurrencyModeChange,
}: FilterBarProps) {
  const update = (partial: Partial<Filters>) => {
    onChange({ ...filters, ...partial });
  };

  const rawCountry = filters.country?.trim() || "";
  const selectedCountryKey = rawCountry
    ? Object.keys(stores).find((k) => k.toLowerCase() === rawCountry.toLowerCase())
    : null;

  const countryData = selectedCountryKey ? stores[selectedCountryKey] : null;

  const availableStores = countryData
    ? countryData.stores.filter((s) => s.enabled)
    : Object.values(stores)
        .flatMap((c) => c.stores)
        .filter((s) => s.enabled)
        .filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx);


  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-blue-600" />
            Display Currency:
          </label>
          <select
            value={currencyMode}
            onChange={(e) => onCurrencyModeChange(e.target.value as CurrencyMode)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="local">Valuta Locale (Local Currency)</option>
            <option value="usd">Converti in USD ($)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            <Globe className="inline h-3 w-3 mr-1" />
            Country
          </label>
          <select
            value={filters.country || ""}
            onChange={(e) => {
              const newCountry = e.target.value || null;
              update({ country: newCountry, source: null, category: null });
            }}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Countries</option>
            {Object.entries(stores).map(([code, data]) => (
              <option key={code} value={code}>
                {data.flag} {data.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Store</label>
          <select
            value={filters.source || ""}
            onChange={(e) => update({ source: e.target.value || null })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Stores</option>
            {availableStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            value={filters.category || ""}
            onChange={(e) => update({ category: e.target.value || null })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
          <select
            value={filters.sort_by}
            onChange={(e) => update({ sort_by: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="reviews_count">Reviews</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Order</label>
          <button
            onClick={() => update({ order: filters.order === "asc" ? "desc" : "asc" })}
            className="flex items-center gap-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {filters.order === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Price Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_price ?? ""}
              onChange={(e) =>
                update({ min_price: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_price ?? ""}
              onChange={(e) =>
                update({ max_price: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

