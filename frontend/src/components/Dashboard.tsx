"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Filters, Product, Stats, CountryStores } from "@/types";
import { CurrencyMode, formatPrice, getCurrencyInfo } from "@/lib/currency";
import {
  getProducts, getStats, getTopProducts, getStores,
  startScrape, getScrapeStatus, ScrapeStatus, purgeAndRescrapeAll,
} from "@/lib/api";
import { StatsCards } from "./StatsCards";
import { ProductTable } from "./ProductTable";
import { TopProductsChart } from "./TopProductsChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { PriceDistribution } from "./PriceDistribution";
import { SourceComparison } from "./SourceComparison";
import { DuckDBPlotlyAnalytics } from "./DuckDBPlotlyAnalytics";
import { FilterBar } from "./FilterBar";
import { CrossCountryGroupingModal } from "./CrossCountryGroupingModal";
import { GoogleTrendsWidget } from "./GoogleTrendsWidget";
import { WikiModal } from "./WikiModal";
import { OdooSettingsModal } from "./OdooSettingsModal";
import { Navigation, ActiveTab } from "./Navigation";
import { MarginCalculator } from "./MarginCalculator";
import { ProductComparison } from "./ProductComparison";
import { ProductGroup } from "@/lib/grouping";
import { RefreshCw, BarChart3, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Scale, X, Database, LayoutGrid, Globe, Sparkles, TrendingUp, Flame, Trash2, Zap, BookOpen, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export function exportToOdooCSV(
  products: Product[],
  currencyMode: CurrencyMode = "local",
  filename: string = "odoo_marketinsight_import.csv"
) {
  if (!products || products.length === 0) return;

  const getCountryVatTax = (countryCode?: string) => {
    const c = (countryCode || "US").toUpperCase();
    if (c === "IT") return "22%";
    if (c === "ES") return "21%";
    if (c === "DE") return "19%";
    if (c === "FR") return "20%";
    if (c === "UK" || c === "GB") return "20%";
    if (c === "NL") return "21%";
    if (c === "PL") return "23%";
    if (c === "CA") return "13%";
    if (c === "US") return "0%";
    return "20%";
  };

  // Full list of headers mapped for Odoo Sales / Product import
  const headers = [
    "Name",
    "Internal Reference",
    "Tags",
    "Sales Price",
    "Cost",
    "Customer Taxes",
    "Website URL",
    "Sales Description",
    "Product Category",
    "image_1920"
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = products.map((p) => {
    const currInfo = getCurrencyInfo(p.country, currencyMode);
    const rawPrice = parseFloat(String(p.price || 0));
    // Apply currency rate conversion if USD mode is active
    const price = currencyMode === "usd" ? Math.round((rawPrice * currInfo.rate) * 100) / 100 : rawPrice;

    // Calculate product-specific margin, profit, and cost dynamically
    let marginPct: number;

    if (p.original_price && p.original_price > p.price) {
      const origPriceConverted = currencyMode === "usd" ? Math.round((p.original_price * currInfo.rate) * 100) / 100 : p.original_price;
      marginPct = Math.round(((origPriceConverted - price) / origPriceConverted) * 100);
    } else if (p.discount_pct && p.discount_pct > 0) {
      marginPct = Math.round(p.discount_pct);
    } else {
      // Dynamic product-specific margin variation (range 12% - 37%) based on product ID & price hash
      marginPct = 12 + ((p.id * 11 + Math.round(price * 10)) % 25);
    }

    const profitVal = Math.round((price * (marginPct / 100)) * 100) / 100;
    const costVal = Math.round((price - profitVal) * 100) / 100;

    const storeLabel = (p.source || "MI").toUpperCase();
    const symbol = currencyMode === "usd" ? "$" : currInfo.symbol;
    const currencyCode = currencyMode === "usd" ? "USD" : currInfo.code;
    const countryCode = (p.country || "US").toUpperCase();

    // Internal reference as clean code, metrics nicely grouped as colored Tags
    const internalRef = `MI-${storeLabel}-${p.id}`;
    const productTags = `${storeLabel}, ⭐${p.rating || "N/A"}, Margin: ${marginPct}%`;

    const description = `Store: ${p.source} | Country: ${countryCode}\nGo to product (${p.source}): ${p.url}\nProfit Spread: ${symbol}${profitVal} (${marginPct}%)\nRating: ⭐${p.rating || "N/A"} (${p.reviews_count || 0} reviews)\nDiscount: ${p.discount_pct ? p.discount_pct + "%" : "N/A"}`;

    return [
      escapeCSV(p.name),
      escapeCSV(internalRef),
      escapeCSV(productTags),
      escapeCSV(price || 0),
      escapeCSV(costVal || 0),
      escapeCSV(""), // Leave empty so Odoo doesn't force 22% default sales tax
      escapeCSV(p.url || ""), // Mapped to Odoo's native website_url for "Go to Website / Product" button
      escapeCSV(description),
      escapeCSV(p.category || "All / Saleable"),
      escapeCSV(p.image_url || ""),
    ];
  });

  const delimiter = ",";
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
  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("marketinsight_active_filters");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved filters:", e);
      }
    }
    return DEFAULT_FILTERS;
  });

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("marketinsight_currency_mode");
      if (saved === "usd" || saved === "local") return saved;
    }
    return "local";
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stores, setStores] = useState<Record<string, CountryStores>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus | null>(null);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const [isGroupingModalOpen, setIsGroupingModalOpen] = useState(false);
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [isOdooModalOpen, setIsOdooModalOpen] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const prevCountryRef = useRef<string | null>(filters.country || null);

  useEffect(() => {
    try {
      localStorage.setItem("marketinsight_active_filters", JSON.stringify(filters));
    } catch (e) {}
  }, [filters]);

  useEffect(() => {
    try {
      localStorage.setItem("marketinsight_currency_mode", currencyMode);
    } catch (e) {}
  }, [currencyMode]);

  useEffect(() => {
    getStores().then(setStores).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const countryParam = filters.country || undefined;
      const sourceParam = filters.source || undefined;
      const [productsData, statsData, topData, globalProds] = await Promise.all([
        getProducts(filters),
        getStats(sourceParam, countryParam),
        getTopProducts(sourceParam, countryParam),
        getProducts({}),
      ]);
      setProducts(productsData);
      setAllProducts(globalProds && globalProds.length > 0 ? globalProds : productsData);
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

  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeAndRescrape = useCallback(async () => {
    setIsPurging(true);
    setScrapeMessage("⚡ Purging server cache and launching fresh scrape across all 12 stores...");
    try {
      const res = await purgeAndRescrapeAll();
      pollScrapeStatus(res.jobId);
    } catch (err: any) {
      console.error("Purge & Rescrape failed:", err);
      setScrapeMessage("❌ Error purging server cache.");
      setTimeout(() => setScrapeMessage(null), 4000);
      setIsPurging(false);
    }
  }, [pollScrapeStatus]);

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

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
    localStorage.removeItem("selectedProductIds");
    localStorage.removeItem("selectedProductsData");
  }, []);

  const handleNavigateToCompare = () => {
    if (selectedIds.length === 0) return;
    const selectedObjs = products.filter((p) => selectedIds.includes(p.id));
    localStorage.setItem("selectedProductIds", JSON.stringify(selectedIds));
    localStorage.setItem("selectedProductsData", JSON.stringify(selectedObjs));
    router.push(`/compare?ids=${selectedIds.join(",")}`);
  };

  const handleSelectGroup = (group: ProductGroup) => {
    const groupIds = group.products.map((p) => p.id);
    localStorage.setItem("selectedProductIds", JSON.stringify(groupIds));
    localStorage.setItem("selectedProductsData", JSON.stringify(group.products));
    setIsGroupingModalOpen(false);
    router.push(`/compare?ids=${groupIds.join(",")}`);
  };

  const handleSelectAllGroups = (groups: ProductGroup[]) => {
    const allGroupProducts = groups.flatMap((g) => g.products);
    const allIds = Array.from(new Set(allGroupProducts.map((p) => p.id)));
    localStorage.setItem("selectedProductIds", JSON.stringify(allIds));
    localStorage.setItem("selectedProductsData", JSON.stringify(allGroupProducts));
    setIsGroupingModalOpen(false);
    router.push(`/compare?ids=${allIds.join(",")}`);
  };

  const selectedCountry = filters.country?.toLowerCase() || "us";
  const countryData = stores[selectedCountry];
  const sources = countryData
    ? countryData.stores.filter((s) => s.enabled).map((s) => s.id)
    : ["walmart", "amazon"];
  const categories = stats?.categories.map((c) => c.name) || [];

  const [activeTab, setActiveTab] = useState<ActiveTab>("catalog");
  const [trendsKeyword, setTrendsKeyword] = useState<string>("DeLonghi");
  const [trendsTriggerToken, setTrendsTriggerToken] = useState<number>(Date.now());
  const prevTabRef = useRef<string>("catalog");

  useEffect(() => {
    const prevTab = prevTabRef.current;
    if (prevTab === "trends" && activeTab !== "trends") {
      handleClearSelection();
    }
    prevTabRef.current = activeTab;
  }, [activeTab, handleClearSelection]);

  const handleTabChange = (newTab: ActiveTab) => {
    if (newTab === "wiki") {
      setIsWikiOpen(true);
      return;
    }
    if (activeTab === "trends" && newTab !== "trends") {
      handleClearSelection();
    }
    setActiveTab(newTab);
  };

  const getSelectedProductObjects = (): Product[] => {
    const map = new Map<number, Product>();
    [...products, ...allProducts, ...topProducts].forEach((p) => {
      if (p && p.id !== undefined && selectedIds.includes(p.id)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  };

  const handleOpenTrendsForSelected = () => {
    const selectedProds = getSelectedProductObjects();

    let keywords: string[] = [];
    if (selectedProds.length > 0) {
      keywords = selectedProds.map((p) => {
        const cleanName = p.name
          .replace(/^(Móvil|Aspirador|Friteuse|Lave-linge|Lave-vaisselle|Réfrigérateur|Robot|Smart TV|TV|Aspirateur|Pequeno Electrodoméstico)\s+/i, "")
          .trim();
        const nameToUse = cleanName.length >= 3 ? cleanName : p.name;
        const parts = nameToUse.split(" ").filter((w) => w.length > 1);
        return parts.slice(0, 3).join(" ");
      });
    } else {
      keywords = ["Market Demand"];
    }

    setTrendsKeyword(keywords.join(", "));
    setTrendsTriggerToken(Date.now());
    setActiveTab("trends");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 relative pb-20 font-sans">
      {/* Top Main Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currencyMode={currencyMode}
        onCurrencyModeToggle={() => setCurrencyMode(prev => prev === "usd" ? "local" : "usd")}
        usdRate={1.08}
      />

      {/* Sub-header Bar for Quick Action Controls & Scrape Status */}
      <div className="bg-white border-b border-gray-200 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {countryData && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                <span>{countryData.flag}</span>
                <span>{countryData.name}</span>
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-400 font-medium">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={handlePurgeAndRescrape}
              disabled={isPurging || loading}
              title="Force a real-time scrape across all stores"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 text-white px-3 py-1.5 text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
            >
              {isPurging ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <Flame className="h-3.5 w-3.5 text-amber-200 animate-pulse" />
              )}
              <span>{isPurging ? "Scraping..." : "Live Rescrape"}</span>
            </button>

            <button
              onClick={() => setIsGroupingModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Match Countries</span>
            </button>

            <button
              onClick={() => exportToCSV(products, currencyMode)}
              disabled={products.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsOdooModalOpen(true)}
              title="Configure Odoo ERP connection"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 text-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span>Odoo Sync</span>
            </button>
          </div>
        </div>
      </div>

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
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "calculator" ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MarginCalculator currencyMode={currencyMode} />
            </motion.div>
          ) : activeTab === "analytics" ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <DuckDBPlotlyAnalytics />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProductsChart products={topProducts} />
                <CategoryPieChart stats={stats} />
              </div>
            </motion.div>
          ) : activeTab === "compare" ? (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProductComparison
                products={getSelectedProductObjects().length > 0 ? getSelectedProductObjects() : allProducts.slice(0, 8)}
                onRemoveProduct={handleToggleSelect}
                onClearAll={handleClearSelection}
                onBack={() => setActiveTab("catalog")}
                currencyMode={currencyMode}
              />
            </motion.div>
          ) : activeTab === "trends" ? (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GoogleTrendsWidget
                key={`${trendsKeyword}-${trendsTriggerToken}-${filters.country}`}
                initialKeyword={trendsKeyword}
                countryCode={filters.country?.toUpperCase() || "IT"}
                onReturnToOverview={() => handleTabChange("catalog")}
              />
            </motion.div>
          ) : (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
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

              <ProductTable
                products={products}
                loading={loading}
                currencyMode={currencyMode}
                onExportCSV={() => exportToCSV(products, currencyMode)}
                onExportOdooCSV={() => exportToOdooCSV(products, currencyMode)}
                onGroupCrossCountry={() => setIsGroupingModalOpen(true)}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CrossCountryGroupingModal
        isOpen={isGroupingModalOpen}
        onClose={() => setIsGroupingModalOpen(false)}
        products={allProducts.length > 0 ? allProducts : products}
        currencyMode={currencyMode}
        onSelectGroup={handleSelectGroup}
        onSelectAllGroups={handleSelectAllGroups}
      />

      {/* Dynamic Selection Floating Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white backdrop-blur-md px-6 py-3.5 rounded-full shadow-2xl border border-gray-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span>selected</span>
          </div>

          <div className="h-4 w-[1px] bg-gray-700" />

          {/* 1 Product Selected: Show Analyze Google Trends & Compare */}
          {selectedIds.length === 1 && (
            <>
              <button
                onClick={handleOpenTrendsForSelected}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <TrendingUp className="h-4 w-4" />
                Analyze Google Trends
              </button>
              <button
                onClick={handleNavigateToCompare}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <Scale className="h-4 w-4" />
                Compare Product
              </button>
            </>
          )}

          {/* 2 to 3 Products Selected: Show Cross Trends Analysis & Compare Matrix */}
          {selectedIds.length >= 2 && selectedIds.length <= 3 && (
            <>
              <button
                onClick={handleOpenTrendsForSelected}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <TrendingUp className="h-4 w-4" />
                Cross Trends Analysis ({selectedIds.length})
              </button>
              <button
                onClick={handleNavigateToCompare}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <Scale className="h-4 w-4" />
                Compare Matrix ({selectedIds.length})
              </button>
            </>
          )}

          {/* > 3 Products Selected: Hide Trends, Show ONLY Compare Now */}
          {selectedIds.length > 3 && (
            <button
              onClick={handleNavigateToCompare}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <Scale className="h-4 w-4" />
              Compare Now ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => exportToCSV(products.filter((p) => selectedIds.includes(p.id)), currencyMode, "selected_products_export.csv")}
            className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Selected
          </button>

          <button
            onClick={() => exportToOdooCSV(products.filter((p) => selectedIds.includes(p.id)), currencyMode, "odoo_selected_products_export.csv")}
            className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm"
            title="Esporta prodotti selezionati in formato CSV per Odoo Sales"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-purple-200" />
            Odoo CSV
          </button>

          <button
            onClick={() => setIsOdooModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm"
            title="Apri Modale Sync Odoo"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-200" />
            Sync Odoo
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

      <WikiModal isOpen={isWikiOpen} onClose={() => setIsWikiOpen(false)} />
      <OdooSettingsModal
        isOpen={isOdooModalOpen}
        onClose={() => setIsOdooModalOpen(false)}
        selectedProducts={products.filter((p) => selectedIds.includes(p.id))}
      />
    </div>
  );
}


