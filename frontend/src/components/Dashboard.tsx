"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Filters, Product, Stats, CountryStores } from "@/types";
import { CurrencyMode, formatPrice, getCurrencyInfo } from "@/lib/currency";
import {
  getProducts, getStats, getTopProducts, getStores,
  startScrape, getScrapeStatus, ScrapeStatus,
} from "@/lib/api";
import { StatsCards } from "./StatsCards";
import { ProductTable } from "./ProductTable";
import { TopProductsChart } from "./TopProductsChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { PriceDistribution } from "./PriceDistribution";
import { SourceComparison } from "./SourceComparison";
import { FilterBar } from "./FilterBar";
import { RefreshCw, BarChart3, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Scale, X } from "lucide-react";

const DEFAULT_FILTERS: Filters = {
  source: null,
  category: null,
  country: null,
  sort_by: "reviews_count",
  order: "desc",
  min_price: null,
  max_price: null,
};

export function exportToCSV(
  products: Product[],
  currencyMode: CurrencyMode = "local",
  filename: string = "marketinsight_products_export.csv"
) {
  if (!products || products.length === 0) return;

  const getStoreLabel = (src: string) => {
    const s = (src || "").toLowerCase();
    if (s === "walmart" || s === "walmart-us") return "Walmart US";
    if (s === "walmart-ca") return "Walmart Canada";
    if (s.startsWith("amazon-")) {
      const code = s.replace("amazon-", "").toUpperCase();
      return `Amazon ${code}`;
    }
    if (s === "amazon") return "Amazon US";
    if (s === "bestbuy") return "Best Buy US";
    if (s === "bestbuy-ca") return "Best Buy Canada";
    if (s === "homedepot") return "The Home Depot";
    if (s === "sears") return "Sears";
    if (s === "canadiantire") return "Canadian Tire";
    if (s === "elcorteingles") return "El Corte Inglés";
    if (s === "allegro") return "Allegro";
    if (s === "bol-nl" || s === "bol") return "Bol.com";
    if (s === "cdiscount") return "Cdiscount";
    if (s === "otto-de" || s === "otto") return "Otto.de";
    return src;
  };

  const headers = [
    "Product ID",
    "Product Title",
    "Price",
    "Original Price",
    "Currency",
    "Formatted Price",
    "Discount %",
    "Rating",
    "Reviews Count",
    "Marketplace",
    "Category",
    "Country",
    "Seller",
    "Availability",
    "Product Link"
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = products.map((p) => {
    const currInfo = getCurrencyInfo(p.country, currencyMode);
    const rawPrice = p.price !== null && p.price !== undefined ? p.price : "";
    const rawOriginal = p.original_price !== null && p.original_price !== undefined ? p.original_price : "";
    const formattedPrice = formatPrice(p.price, p.country, currencyMode);
    const discount = p.discount_pct !== null && p.discount_pct !== undefined ? `${p.discount_pct}%` : "";
    const rating = p.rating !== null && p.rating !== undefined ? p.rating : "";
    const reviews = p.reviews_count !== null && p.reviews_count !== undefined ? String(p.reviews_count) : "0";
    const store = getStoreLabel(p.source);
    const seller = p.seller || "";
    const availability = p.availability || "";

    return [
      escapeCSV(p.id),
      escapeCSV(p.name),
      escapeCSV(rawPrice),
      escapeCSV(rawOriginal),
      escapeCSV(currInfo.code),
      escapeCSV(formattedPrice),
      escapeCSV(discount),
      escapeCSV(rating),
      escapeCSV(reviews),
      escapeCSV(store),
      escapeCSV(p.category),
      escapeCSV(p.country),
      escapeCSV(seller),
      escapeCSV(availability),
      escapeCSV(p.url)
    ];
  });

  const delimiter = ";";
  const csvContent =
    "\uFEFF" +
    [
      headers.map(escapeCSV).join(delimiter),
      ...rows.map((r) => r.join(delimiter)),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("local");
  const [products, setProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stores, setStores] = useState<Record<string, CountryStores>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus | null>(null);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountryRef = useRef<string | null>(null);

  useEffect(() => {
    getStores().then(setStores).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const countryParam = filters.country || undefined;
      const sourceParam = filters.source || undefined;
      const [productsData, statsData, topData] = await Promise.all([
        getProducts(filters),
        getStats(sourceParam, countryParam),
        getTopProducts(sourceParam, countryParam),
      ]);
      setProducts(productsData);
      setStats(statsData);
      setTopProducts(topData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pollScrapeStatus = useCallback((jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const status = await getScrapeStatus(jobId);
        setScrapeStatus(status);

        if (status.status === "completed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setScrapeMessage(null);
          setScrapeStatus(null);
          fetchData();
        } else if (status.status === "error") {
          if (pollRef.current) clearInterval(pollRef.current);
          setScrapeMessage("Scraping failed. Try again.");
          setTimeout(() => {
            setScrapeMessage(null);
            setScrapeStatus(null);
          }, 4000);
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 1500);
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleFilterChange = useCallback(async (newFilters: Filters) => {
    const prevCountry = prevCountryRef.current;
    const newCountry = newFilters.country;
    prevCountryRef.current = newCountry;

    setFilters(newFilters);

    if (newCountry !== prevCountry) {
      if (newCountry) {
        setScrapeMessage(`Scraping ${stores[newCountry]?.name || newCountry}...`);
        setScrapeStatus(null);
        try {
          const { jobId } = await startScrape(newCountry);
          pollScrapeStatus(jobId);
        } catch (err) {
          setScrapeMessage("Failed to start scraping");
          setTimeout(() => setScrapeMessage(null), 3000);
        }
      } else {
        fetchData();
      }
    }
  }, [stores, fetchData, pollScrapeStatus]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("selectedProductIds");
    if (saved) {
      try {
        setSelectedIds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load selectedProductIds:", e);
      }
    }
  }, []);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem("selectedProductIds", JSON.stringify(next));
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allOnPage = products.map((p) => p.id);
      const isAllSelected = allOnPage.length > 0 && allOnPage.every((id) => prev.includes(id));
      const next = isAllSelected ? [] : Array.from(new Set([...prev, ...allOnPage]));
      localStorage.setItem("selectedProductIds", JSON.stringify(next));
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    localStorage.removeItem("selectedProductIds");
  };

  const handleNavigateToCompare = () => {
    if (selectedIds.length === 0) return;
    localStorage.setItem("selectedProductIds", JSON.stringify(selectedIds));
    router.push(`/compare?ids=${selectedIds.join(",")}`);
  };

  const selectedCountry = filters.country?.toLowerCase() || "us";
  const countryData = stores[selectedCountry];
  const sources = countryData
    ? countryData.stores.filter((s) => s.enabled).map((s) => s.id)
    : ["walmart", "amazon"];
  const categories = stats?.categories.map((c) => c.name) || [];

  return (
    <div className="min-h-screen bg-gray-50 relative pb-20">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MarketInsight</h1>
                <p className="text-sm text-gray-500">
                  E-Commerce Product Analytics
                  {countryData && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {countryData.flag} {countryData.name}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              {selectedIds.length > 0 && (
                <button
                  onClick={handleNavigateToCompare}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm animate-pulse"
                >
                  <Scale className="h-4 w-4" />
                  Compare ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => exportToCSV(products, currencyMode)}
                disabled={products.length === 0}
                className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3.5 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Export CSV ({products.length})
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {scrapeMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
            {scrapeStatus?.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : scrapeStatus?.status === "error" ? (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            ) : (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{scrapeMessage}</p>
              {scrapeStatus?.progress && scrapeStatus.progress.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {scrapeStatus.progress.map((p) => (
                    <span
                      key={p.source}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "done"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {p.status === "done" ? "✓" : "..."} {p.source}
                      {p.count !== undefined && ` (${p.count})`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <StatsCards stats={stats} />

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          sources={sources}
          categories={categories}
          stores={stores}
          currencyMode={currencyMode}
          onCurrencyModeChange={setCurrencyMode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsChart products={topProducts} />
          <CategoryPieChart stats={stats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceDistribution stats={stats} />
          <SourceComparison stats={stats} />
        </div>

        <ProductTable
          products={products}
          loading={loading}
          currencyMode={currencyMode}
          onExportCSV={() => exportToCSV(products, currencyMode)}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />
      </main>

      {/* Floating Comparison Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white backdrop-blur-md px-6 py-3.5 rounded-full shadow-2xl border border-gray-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span>products selected</span>
          </div>

          <div className="h-4 w-[1px] bg-gray-700" />

          <button
            onClick={handleNavigateToCompare}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
          >
            <Scale className="h-4 w-4" />
            Compare Now ({selectedIds.length})
          </button>

          <button
            onClick={() => exportToCSV(products.filter((p) => selectedIds.includes(p.id)), currencyMode, "selected_products_export.csv")}
            className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Selected
          </button>

          <button
            onClick={handleClearSelection}
            className="p-1 text-gray-400 hover:text-white rounded-full transition-colors ml-1"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}


