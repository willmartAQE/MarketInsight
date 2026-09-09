import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import {
  getDb,
  normalizeCountryCode,
  upsertProduct,
  getProducts,
  getStats,
  getTopProducts,
  getCategories,
  getSources,
  getCountries,
  getPriceHistory,
  getScrapeLogs,
  addPriceHistory,
  logScrape,
} from "./db.js";
import {
  getDuckDBMarketplaceHeatmap,
  getDuckDBOutlierDeals,
  getDuckDBCategoryQuantiles,
  getDuckDBPriceClusters,
  getDuckDBCrossBorderArbitrage,
  getDuckDBMarketAttractiveness,
  resetDuckDB
} from "./duckdb.js";
import { analyzeProductSentiment } from "./nlp.js";
import { computePriceForecast, computeOHLCData } from "./forecasting.js";
import { STORES, AMAZON_EU } from "./stores.js";
import { scrapeWalmart } from "./scrapers/walmart.js";
import { scrapeAmazon } from "./scrapers/amazon.js";
import { scrapeAmazonEU } from "./scrapers/amazon-eu.js";
import { scrapeEbayEU } from "./scrapers/ebay-eu.js";
import { scrapeAllegro } from "./scrapers/allegro.js";
import { scrapeBol } from "./scrapers/bol.js";
import { scrapeCdiscount } from "./scrapers/cdiscount.js";
import { scrapeOtto } from "./scrapers/otto.js";
import { scrapeElCorteIngles } from "./scrapers/elcorteingles.js";
import { scrapeHomeDepot } from "./scrapers/homedepot.js";
import { scrapeBestBuy } from "./scrapers/bestbuy.js";
import { scrapeSears } from "./scrapers/sears.js";
import { scrapeCanadaStores } from "./scrapers/canada.js";
import { getGoogleTrendsInterest } from "./scrapers/google-trends.js";

const __dirname = dirname(fileURLToPath(import.meta.url));


const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
  })
);
app.use(express.json());

const scrapingJobs = new Map();

async function runScrapeJob(jobId, countries, sources) {
  scrapingJobs.set(jobId, { status: "running", progress: [], startedAt: new Date().toISOString() });

  try {
    if (sources.includes("walmart")) {
      scrapingJobs.get(jobId).progress.push({ source: "walmart", status: "running" });
      const result = await scrapeWalmart();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("walmart", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "walmart", status: "done", count: saved });
    }

    if (sources.includes("amazon")) {
      scrapingJobs.get(jobId).progress.push({ source: "amazon", status: "running" });
      const result = await scrapeAmazon();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("amazon", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "amazon", status: "done", count: saved });
    }

    if (sources.includes("homedepot") || countries.includes("us")) {
      scrapingJobs.get(jobId).progress.push({ source: "homedepot", status: "running" });
      const result = await scrapeHomeDepot();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("homedepot", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "homedepot", status: "done", count: saved });
    }

    if (countries.length > 0) {
      const amazonResult = await scrapeAmazonEU(countries);
      for (const [source, count] of Object.entries(amazonResult.results)) {
        const products = amazonResult.products.filter((p) => p.source === source);
        let saved = 0;
        for (const p of products) {
          const id = upsertProduct(p);
          addPriceHistory(id, p.price);
          saved++;
        }
        logScrape(source, "success", saved);
        scrapingJobs.get(jobId).progress.push({ source, status: "done", count: saved });
      }

      const ebayResult = await scrapeEbayEU(countries);
      for (const [source, count] of Object.entries(ebayResult.results)) {
        const products = ebayResult.products.filter((p) => p.source === source);
        let saved = 0;
        for (const p of products) {
          const id = upsertProduct(p);
          addPriceHistory(id, p.price);
          saved++;
        }
        logScrape(source, "success", saved);
        scrapingJobs.get(jobId).progress.push({ source, status: "done", count: saved });
      }

      if (countries.includes("pl")) {
        scrapingJobs.get(jobId).progress.push({ source: "allegro", status: "running" });
        const result = await scrapeAllegro();
        let saved = 0;
        for (const p of result.products) {
          const id = upsertProduct(p);
          addPriceHistory(id, p.price);
          saved++;
        }
        logScrape("allegro", result.status, saved);
        scrapingJobs.get(jobId).progress.push({ source: "allegro", status: "done", count: saved });
      }

      if (countries.includes("nl")) {
        scrapingJobs.get(jobId).progress.push({ source: "bol-nl", status: "running" });
        const result = await scrapeBol();
        let saved = 0;
        for (const p of result.products) {
          const id = upsertProduct(p);
          addPriceHistory(id, p.price);
          saved++;
        }
        logScrape("bol-nl", result.status, saved);
        scrapingJobs.get(jobId).progress.push({ source: "bol-nl", status: "done", count: saved });
      }

      if (countries.includes("fr")) {
        scrapingJobs.get(jobId).progress.push({ source: "cdiscount", status: "running" });
        const result = await scrapeCdiscount();
        let saved = 0;
        for (const p of result.products) {
          const id = upsertProduct(p);
          addPriceHistory(id, p.price);
          saved++;
        }
        logScrape("cdiscount", result.status, saved);
        scrapingJobs.get(jobId).progress.push({ source: "cdiscount", status: "done", count: saved });
      }

      if (countries.includes("de")) {
        scrapingJobs.get(jobId).progress.push({ source: "otto-de", status: "running" });
        const result = await scrapeOtto();
        let saved = 0;
        for (const p of result.products) {
          const id = upsertProduct(p);
          addPriceHistory(id, p.price);
          saved++;
        }
        logScrape("otto-de", result.status, saved);
        scrapingJobs.get(jobId).progress.push({ source: "otto-de", status: "done", count: saved });
      }

      if (countries.includes("es") || sources.includes("elcorteingles")) {
        scrapingJobs.get(jobId).progress.push({ source: "elcorteingles", status: "running" });
        const result = await scrapeElCorteIngles();
        let saved = 0;
        for (const p of result.products) {
          const id = upsertProduct(p);
          addPriceHistory(id, p.price);
          saved++;
        }
        logScrape("elcorteingles", result.status, saved);
        scrapingJobs.get(jobId).progress.push({ source: "elcorteingles", status: "done", count: saved });
      }
    }

    if (sources.includes("allegro") && !countries.includes("pl")) {
      scrapingJobs.get(jobId).progress.push({ source: "allegro", status: "running" });
      const result = await scrapeAllegro();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("allegro", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "allegro", status: "done", count: saved });
    }

    if ((sources.includes("bol") || sources.includes("bol-nl")) && !countries.includes("nl")) {
      scrapingJobs.get(jobId).progress.push({ source: "bol-nl", status: "running" });
      const result = await scrapeBol();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("bol-nl", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "bol-nl", status: "done", count: saved });
    }

    if (sources.includes("cdiscount") && !countries.includes("fr")) {
      scrapingJobs.get(jobId).progress.push({ source: "cdiscount", status: "running" });
      const result = await scrapeCdiscount();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("cdiscount", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "cdiscount", status: "done", count: saved });
    }

    if ((sources.includes("otto") || sources.includes("otto-de")) && !countries.includes("de")) {
      scrapingJobs.get(jobId).progress.push({ source: "otto-de", status: "running" });
      const result = await scrapeOtto();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("otto-de", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "otto-de", status: "done", count: saved });
    }

    if (sources.includes("bestbuy") || sources.includes("all")) {
      scrapingJobs.get(jobId).progress.push({ source: "bestbuy", status: "running" });
      const result = await scrapeBestBuy();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("bestbuy", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "bestbuy", status: "done", count: saved });
    }

    if (sources.includes("sears") || sources.includes("all")) {
      scrapingJobs.get(jobId).progress.push({ source: "sears", status: "running" });
      const result = await scrapeSears();
      let saved = 0;
      for (const p of result.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("sears", result.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "sears", status: "done", count: saved });
    }

    if (sources.includes("canada") || sources.includes("bestbuy-ca") || sources.includes("walmart-ca") || sources.includes("all")) {
      const caResult = await scrapeCanadaStores();
      let saved = 0;
      for (const p of caResult.products) {
        const id = upsertProduct(p);
        addPriceHistory(id, p.price);
        saved++;
      }
      logScrape("canada", caResult.status, saved);
      scrapingJobs.get(jobId).progress.push({ source: "canada", status: "done", count: saved });
    }

    scrapingJobs.set(jobId, {
      ...scrapingJobs.get(jobId),
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    scrapingJobs.set(jobId, {
      ...scrapingJobs.get(jobId),
      status: "error",
      error: err.message,
      completedAt: new Date().toISOString(),
    });
  }
}

app.get("/", (_req, res) => {
  res.json({
    name: "MarketInsight API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      products: "GET /api/products?country=de&source=amazon-de",
      stats: "GET /api/stats?country=de",
      top: "GET /api/top-products?country=de",
      categories: "GET /api/categories?country=de",
      sources: "GET /api/sources?country=de",
      countries: "GET /api/countries",
      stores: "GET /api/stores",
      history: "GET /api/products/:id/history",
      scrapeLogs: "GET /api/scrape-logs",
      startScrape: "POST /api/scrape { country: 'de' }",
      scrapeStatus: "GET /api/scrape/status/:jobId",
    },
  });
});

app.get("/api/products", (req, res) => {
  const { source, category, country, sort_by, order, min_price, max_price, limit, offset, ids } = req.query;
  const products = getProducts({
    source, category, country, sort_by, order,
    min_price: min_price ? parseFloat(min_price) : null,
    max_price: max_price ? parseFloat(max_price) : null,
    limit: limit ? parseInt(limit) : 200,
    offset: offset ? parseInt(offset) : 0,
    ids: ids || null,
  });
  res.json(products);
});

app.get("/api/products/:id/history", (req, res) => {
  res.json(getPriceHistory(parseInt(req.params.id)));
});

app.get("/api/stats", (req, res) => {
  res.json(getStats(req.query.source || null, req.query.country || null));
});

app.get("/api/top-products", (req, res) => {
  res.json(getTopProducts(req.query.source || null, req.query.country || null, parseInt(req.query.limit) || 10));
});

app.get("/api/categories", (req, res) => {
  res.json(getCategories(req.query.country || null));
});

app.get("/api/sources", (req, res) => {
  res.json(getSources(req.query.country || null));
});

app.get("/api/countries", (_req, res) => {
  res.json(getCountries());
});

app.get("/api/stores", (_req, res) => {
  res.json(STORES);
});

app.get("/api/scrape-logs", (req, res) => {
  res.json(getScrapeLogs(parseInt(req.query.limit) || 10));
});

// DuckDB OLAP Analytics Endpoints
app.get("/api/analytics/duckdb/heatmap", async (_req, res) => {
  try {
    const data = await getDuckDBMarketplaceHeatmap();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/duckdb/outliers", async (_req, res) => {
  try {
    const data = await getDuckDBOutlierDeals();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/duckdb/quantiles", async (_req, res) => {
  try {
    const data = await getDuckDBCategoryQuantiles();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/duckdb/clusters", async (_req, res) => {
  try {
    const data = await getDuckDBPriceClusters();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/duckdb/arbitrage", async (_req, res) => {
  try {
    const data = await getDuckDBCrossBorderArbitrage();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/duckdb/attractiveness", async (_req, res) => {
  try {
    const data = await getDuckDBMarketAttractiveness();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/sentiment/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const result = analyzeProductSentiment(product.name, product.reviews_count, product.rating);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/forecast/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const history = getPriceHistory(id);
    const forecast = computePriceForecast(product, history);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/ohlc/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const history = getPriceHistory(id);
    const ohlc = computeOHLCData(product, history);
    res.json(ohlc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/scrape", (req, res) => {
  const { country, sources } = req.body;
  const countries = country ? [country] : [];
  const scrapeSources = sources || [];

  if (countries.length === 0 && scrapeSources.length === 0) {
    return res.status(400).json({ error: "Provide country or sources" });
  }

  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  runScrapeJob(jobId, countries, scrapeSources);

  res.json({ jobId, status: "started" });
});

app.post("/api/scrape/purge-and-rescrape", async (req, res) => {
  try {
    // 1. Purge server-side job status caches & reset DuckDB OLAP connection
    scrapingJobs.clear();
    await resetDuckDB();

    // 2. Launch full rescrape across all countries and stores
    const allCountries = ["us", "ca", "uk", "de", "fr", "es", "it", "nl", "pl"];
    const allSources = [
      "walmart", "amazon", "homedepot", "allegro", "bol", "bol-nl",
      "cdiscount", "otto", "otto-de", "elcorteingles", "bestbuy",
      "sears", "canada", "bestbuy-ca", "walmart-ca", "all"
    ];

    const jobId = `purge-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    runScrapeJob(jobId, allCountries, allSources);

    res.json({
      jobId,
      status: "started",
      message: "Server cache successfully purged. Initiated full rescrape across all 12 global stores."
    });
  } catch (err) {
    console.error("Purge and rescrape error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/scrape/status/:jobId", (req, res) => {
  const job = scrapingJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.post("/api/scrape/ai", async (req, res) => {
  const { url, model, prompt } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing target URL parameter 'url'" });
  }

  const selectedModel = model || "ollama/llama3.2";
  const pythonPath = path.resolve(__dirname, "../../scraper/.venv/bin/python");
  const scriptPath = path.resolve(__dirname, "../../scraper/run_scraper.py");
  const projectRoot = path.resolve(__dirname, "../../");

  import("child_process").then(({ execFile }) => {
    execFile(
      pythonPath,
      [scriptPath, "scrapegraph", url, selectedModel],
      { cwd: projectRoot },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`[ai-scrape] Error: ${error.message}`);
          return res.status(500).json({ status: "error", error: error.message, stderr });
        }
        res.json({ status: "success", model: selectedModel, output: stdout.trim() });
      }
    );
  });
});


app.get("/api/analytics/trends", async (req, res) => {
  try {
    const { keyword, country, timeframe } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: "Missing required query parameter 'keyword'" });
    }

    const timeframeDays = timeframe ? parseInt(String(timeframe)) : 90;
    const trendsData = await getGoogleTrendsInterest(String(keyword), String(country || "IT"), timeframeDays);
    res.json(trendsData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MarketInsight API running on http://localhost:${PORT}`);
});

