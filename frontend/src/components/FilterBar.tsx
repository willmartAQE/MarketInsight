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
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#d4af37]" />
          <span className="font-mono text-xs font-semibold tracking-wider text-[#f8fafc] uppercase">Filter Controls</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-xs text-slate-400 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-[#2dd4bf]" />
            Currency Mode:
          </label>
          <select
            value={currencyMode}
            onChange={(e) => onCurrencyModeChange(e.target.value as CurrencyMode)}
            className="rounded-md border border-[rgba(45,212,191,0.3)] bg-[#181b22] px-2.5 py-1 text-xs font-mono font-medium text-[#2dd4bf] focus:border-[#2dd4bf] outline-none cursor-pointer"
          >
            <option value="local">Local Currency (Native)</option>
            <option value="usd">Convert to USD ($)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="block font-mono text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">
            <Globe className="inline h-3 w-3 mr-1 text-[#d4af37]" />
            Country
          </label>
          <select
            value={filters.country || ""}
            onChange={(e) => {
              const newCountry = e.target.value || null;
              update({ country: newCountry, source: null, category: null });
            }}
            className="w-full rounded-md border border-slate-800 bg-[#181b22] px-3 py-2 text-xs font-sans text-slate-200 focus:border-[#d4af37] outline-none transition-colors"
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
          <label className="block font-mono text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Store</label>
          <select
            value={filters.source || ""}
            onChange={(e) => update({ source: e.target.value || null, category: null })}
            className="w-full rounded-md border border-slate-800 bg-[#181b22] px-3 py-2 text-xs font-sans text-slate-200 focus:border-[#d4af37] outline-none transition-colors"
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
          <label className="block font-mono text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Category</label>
          <select
            value={filters.category || ""}
            onChange={(e) => update({ category: e.target.value || null })}
            className="w-full rounded-md border border-slate-800 bg-[#181b22] px-3 py-2 text-xs font-sans text-slate-200 focus:border-[#d4af37] outline-none transition-colors"
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
          <label className="block font-mono text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Sort By</label>
          <select
            value={filters.sort_by}
            onChange={(e) => update({ sort_by: e.target.value })}
            className="w-full rounded-md border border-slate-800 bg-[#181b22] px-3 py-2 text-xs font-sans text-slate-200 focus:border-[#d4af37] outline-none transition-colors"
          >
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="reviews_count">Reviews</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Order</label>
          <button
            onClick={() => update({ order: filters.order === "asc" ? "desc" : "asc" })}
            className="flex items-center justify-between w-full rounded-md border border-slate-800 bg-[#181b22] px-3 py-2 text-xs font-sans text-slate-200 hover:border-[#d4af37]/40 transition-colors"
          >
            <span>{filters.order === "asc" ? "Ascending" : "Descending"}</span>
            <ArrowUpDown className="h-3.5 w-3.5 text-[#d4af37]" />
          </button>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-medium text-slate-400 mb-1 uppercase tracking-wider">Price Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_price ?? ""}
              onChange={(e) =>
                update({ min_price: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full rounded-md border border-slate-800 bg-[#181b22] px-3 py-2 text-xs font-mono text-slate-200 focus:border-[#d4af37] outline-none placeholder:text-slate-600"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_price ?? ""}
              onChange={(e) =>
                update({ max_price: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full rounded-md border border-slate-800 bg-[#181b22] px-3 py-2 text-xs font-mono text-slate-200 focus:border-[#d4af37] outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
