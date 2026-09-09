"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Filters, Product, Stats, CountryStores } from "@/types";
import { CurrencyMode } from "@/lib/currency";
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
import { AIScrapeModal } from "./AIScrapeModal";
import { RefreshCw, BarChart3, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

const DEFAULT_FILTERS: Filters = {
  source: null,
  category: null,
  country: null,
  sort_by: "reviews_count",
  order: "desc",
  min_price: null,
  max_price: null,
};

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
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
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

  const selectedCountry = filters.country?.toLowerCase() || "us";
  const countryData = stores[selectedCountry];
  const sources = countryData
    ? countryData.stores.filter((s) => s.enabled).map((s) => s.id)
    : ["walmart", "amazon"];
  const categories = stats?.categories.map((c) => c.name) || [];

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-purple-600" />
                Scraper AI (Ollama)
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

        <ProductTable products={products} loading={loading} currencyMode={currencyMode} />
      </main>

      <AIScrapeModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}


