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

export async function getStats(source?: string, country?: string): Promise<Stats> {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (country) params.set("country", country);
  const qs = params.toString();
  return fetchJSON<Stats>(`/api/stats${qs ? `?${qs}` : ""}`);
}

export async function getPriceHistory(productId: number): Promise<PricePoint[]> {
  return fetchJSON<PricePoint[]>(`/api/products/${productId}/history`);
}

export async function getTopProducts(source?: string, country?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (country) params.set("country", country);
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

