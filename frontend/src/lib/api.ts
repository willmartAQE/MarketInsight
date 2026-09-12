import { Product, PricePoint, Stats, ScrapeLog, Filters, CountryStores } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getProducts(filters: Partial<Filters> & { ids?: string | number[] } = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.ids) {
    const idsStr = Array.isArray(filters.ids) ? filters.ids.join(",") : String(filters.ids);
    params.set("ids", idsStr);
  }
  if (filters.source) params.set("source", filters.source);
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.order) params.set("order", filters.order);
  if (filters.min_price !== null && filters.min_price !== undefined) params.set("min_price", String(filters.min_price));
  if (filters.max_price !== null && filters.max_price !== undefined) params.set("max_price", String(filters.max_price));
  params.set("limit", "500");
  return fetchJSON<Product[]>(`/api/products?${params.toString()}`);
}

export async function getStats(filters: Partial<Filters> = {}): Promise<Stats> {
  const params = new URLSearchParams();
  if (filters.source) params.set("source", filters.source);
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.min_price !== null && filters.min_price !== undefined) params.set("min_price", String(filters.min_price));
  if (filters.max_price !== null && filters.max_price !== undefined) params.set("max_price", String(filters.max_price));
  const qs = params.toString();
  return fetchJSON<Stats>(`/api/stats${qs ? `?${qs}` : ""}`);
}

export async function getPriceHistory(productId: number): Promise<PricePoint[]> {
  return fetchJSON<PricePoint[]>(`/api/products/${productId}/history`);
}

export async function getTopProducts(filters: Partial<Filters> = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.source) params.set("source", filters.source);
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.min_price !== null && filters.min_price !== undefined) params.set("min_price", String(filters.min_price));
  if (filters.max_price !== null && filters.max_price !== undefined) params.set("max_price", String(filters.max_price));
  const qs = params.toString();
  return fetchJSON<Product[]>(`/api/top-products${qs ? `?${qs}` : ""}`);
}

export async function getScrapeLogs(): Promise<ScrapeLog[]> {
  return fetchJSON<ScrapeLog[]>("/api/scrape-logs");
}

export async function getCountries(): Promise<{ code: string; count: number }[]> {
  return fetchJSON<{ code: string; count: number }[]>("/api/countries");
}

export async function getStores(): Promise<Record<string, CountryStores>> {
  return fetchJSON<Record<string, CountryStores>>("/api/stores");
}

export interface ScrapeJob {
  jobId: string;
  status: string;
}

export interface ScrapeStatus {
  status: "running" | "completed" | "error";
  progress: { source: string; status: string; count?: number }[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export async function startScrape(country?: string, sources?: string[]): Promise<ScrapeJob> {
  const res = await fetch(`${API_BASE}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, sources }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getScrapeStatus(jobId: string): Promise<ScrapeStatus> {
  return fetchJSON<ScrapeStatus>(`/api/scrape/status/${jobId}`);
}

export async function startAIScrape(url: string, model: string = "ollama/llama3.2", prompt?: string): Promise<{ status: string; model: string; output?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/scrape/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, model, prompt }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getDuckDBHeatmap(): Promise<any[]> {
  return fetchJSON<any[]>("/api/analytics/duckdb/heatmap");
}

export async function getDuckDBOutliers(): Promise<any[]> {
  return fetchJSON<any[]>("/api/analytics/duckdb/outliers");
}

export async function getDuckDBQuantiles(): Promise<any[]> {
  return fetchJSON<any[]>("/api/analytics/duckdb/quantiles");
}

export async function getDuckDBClusters(): Promise<any[]> {
  return fetchJSON<any[]>("/api/analytics/duckdb/clusters");
}

export async function getDuckDBCrossBorderArbitrage(): Promise<any[]> {
  return fetchJSON<any[]>("/api/analytics/duckdb/arbitrage");
}

export async function getDuckDBAttractiveness(): Promise<any[]> {
  return fetchJSON<any[]>("/api/analytics/duckdb/attractiveness");
}

export interface GoogleTrendsResult {
  status: string;
  keyword: string;
  keywords?: string[];
  geo: string;
  timeframeDays: number;
  averageScore: number;
  recentScore: number;
  momentumPct: number;
  demandStatus: string;
  timeline: (Record<string, any> & { date: string; timestamp: number; value: number })[];
}

export async function getGoogleTrendsData(keyword: string, country: string = "IT", timeframe: number = 90): Promise<GoogleTrendsResult> {
  const params = new URLSearchParams({
    keyword,
    country,
    timeframe: String(timeframe),
  });
  return fetchJSON<GoogleTrendsResult>(`/api/analytics/trends?${params.toString()}`);
}

export interface SentimentResult {
  score: number;
  scorePct: number;
  label: "Positive" | "Neutral" | "Critical";
  color: "emerald" | "amber" | "rose";
  highlights: string[];
  warnings: string[];
  reviewsAnalyzed: number;
}

export interface ForecastResult {
  currentPrice: number;
  projectedPrice: number;
  dailySlope: number;
  recommendation: string;
  recBadge: string;
  advice: string;
  confidencePct: number;
}

export interface OHLCPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export async function getProductSentiment(productId: number): Promise<SentimentResult> {
  return fetchJSON<SentimentResult>(`/api/analytics/sentiment/${productId}`);
}

export async function getProductForecast(productId: number): Promise<ForecastResult> {
  return fetchJSON<ForecastResult>(`/api/analytics/forecast/${productId}`);
}

export async function getProductOHLC(productId: number): Promise<OHLCPoint[]> {
  return fetchJSON<OHLCPoint[]>(`/api/analytics/ohlc/${productId}`);
}

export async function purgeAndRescrapeAll(): Promise<{ jobId: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/scrape/purge-and-rescrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface KeepaData {
  productId: number;
  name: string;
  asin: string;
  domain: string;
  domainId: number;
  chartUrl: string;
  keepaUrl: string;
  rangeDays: number;
  hasApiKey: boolean;
  apiData?: {
    stats?: any;
    title?: string;
    historyPoints?: { date: string; price: number }[];
  } | null;
}

export async function getKeepaData(productId: number, rangeDays: number = 90): Promise<KeepaData> {
  return fetchJSON<KeepaData>(`/api/keepa/${productId}?range=${rangeDays}`);
}

