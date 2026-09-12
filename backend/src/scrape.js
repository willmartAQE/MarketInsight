import { scrapeWalmart } from "./scrapers/walmart.js";
import { scrapeAmazon } from "./scrapers/amazon.js";
import { scrapeAmazonEU } from "./scrapers/amazon-eu.js";
import { scrapeEbayEU } from "./scrapers/ebay-eu.js";
import { scrapeTarget } from "./scrapers/target.js";
import { scrapeAmazonJP } from "./scrapers/amazon-jp.js";
import { scrapeSephora, scrapeSephoraLocalized } from "./scrapers/sephora.js";
import { scrapeLego } from "./scrapers/lego.js";
import { scrapeInterflora } from "./scrapers/interflora.js";
import { upsertProduct, addPriceHistory, logScrape } from "./db.js";

async function saveProducts(source, products) {
  let saved = 0;
  for (const product of products) {
    try {
      const productId = upsertProduct(product);
      if (productId) {
        addPriceHistory(productId, product.price);
        saved++;
      }
    } catch (err) {
      console.error(`  [save] Error saving product: ${err.message}`);
    }
  }
  return saved;
}

import { execFile } from "child_process";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

import fs from "fs";

export function runScraplingPythonScraper(sources) {
  return new Promise((resolve, reject) => {
    let pythonPath = path.resolve(__dirname, "../../scraper/.venv/bin/python");
    if (!fs.existsSync(pythonPath)) {
      pythonPath = "python3";
    }
    const scriptPath = path.resolve(__dirname, "../../scraper/run_scraper.py");
    const projectRoot = path.resolve(__dirname, "../../");

    const sourceArgs = Array.isArray(sources) ? sources : [sources];
    execFile(
      pythonPath,
      [scriptPath, ...sourceArgs],
      { cwd: projectRoot },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`[scrapling] Execution error: ${error.message}`);
          return reject(error);
        }
        console.log(`[scrapling] Python Output:\n${stdout.trim()}`);
        resolve(stdout);
      }
    );
  });
}

export async function runScrape(sources) {
  console.log(`Scraping started at ${new Date().toISOString()}`);

  const scraplingSources = [
    "lego", "interflora", "target", "sephora", "amazon-jp",
    "sephora-us", "sephora-ca", "sephora-fr", "sephora-it", "sephora-de", "sephora-es", "sephora-uk", "sephora-pl"
  ];
  const jsScrapers = {
    walmart: scrapeWalmart,
    amazon: scrapeAmazon,
    target: scrapeTarget,
    "amazon-jp": scrapeAmazonJP,
    sephora: () => scrapeSephoraLocalized("US"),
    "sephora-us": () => scrapeSephoraLocalized("US"),
    "sephora-ca": () => scrapeSephoraLocalized("CA"),
    "sephora-fr": () => scrapeSephoraLocalized("FR"),
    "sephora-it": () => scrapeSephoraLocalized("IT"),
    "sephora-de": () => scrapeSephoraLocalized("DE"),
    "sephora-es": () => scrapeSephoraLocalized("ES"),
    "sephora-uk": () => scrapeSephoraLocalized("UK"),
    "sephora-pl": () => scrapeSephoraLocalized("PL"),
    lego: scrapeLego,
    interflora: scrapeInterflora,
  };

  const scraplingTargets = sources.filter((s) => scraplingSources.includes(s));
  let failedScraplingTargets = [];

  if (scraplingTargets.length > 0) {
    console.log(`[scrapling] Delegating ${scraplingTargets.join(", ")} to Scrapling Python Engine...`);
    try {
      await runScraplingPythonScraper(scraplingTargets);
    } catch (err) {
      console.error(`[scrapling] Python engine error: ${err.message}. Falling back to JS scrapers...`);
      failedScraplingTargets = scraplingTargets;
    }
  }

  const jsTargets = Array.from(new Set([
    ...sources.filter((s) => !scraplingSources.includes(s)),
    ...failedScraplingTargets
  ]));

  for (const source of jsTargets) {
    const scraper = jsScrapers[source];
    if (!scraper) {
      console.log(`Unknown source: ${source}`);
      continue;
    }

    console.log(`Scraping ${source}...`);
    const startTime = Date.now();

    try {
      const result = await scraper();
      const saved = await saveProducts(source, result.products);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logScrape(source, result.status, saved);
      console.log(`[${source}] Saved ${saved} products (${result.status}) in ${elapsed}s`);
    } catch (err) {
      logScrape(source, "error", 0, err.message);
      console.error(`[${source}] Error:`, err.message);
    }
  }

  console.log(`Scraping completed at ${new Date().toISOString()}`);
}

async function runEUScrape(countries) {
  console.log(`EU Scraping started at ${new Date().toISOString()}`);

  const startTime = Date.now();
  try {
    const result = await scrapeAmazonEU(countries);
    let saved = 0;
    for (const [source, count] of Object.entries(result.results)) {
      const products = result.products.filter((p) => p.source === source);
      const n = await saveProducts(source, products);
      logScrape(source, "success", n);
      saved += n;
      console.log(`[${source}] Saved ${n} products`);
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[amazon-eu] Total saved: ${saved} products in ${elapsed}s`);
  } catch (err) {
    console.error(`[amazon-eu] Error:`, err.message);
  }

  try {
    const ebayResult = await scrapeEbayEU(countries);
    let saved = 0;
    for (const [source, count] of Object.entries(ebayResult.results)) {
      const products = ebayResult.products.filter((p) => p.source === source);
      const n = await saveProducts(source, products);
      logScrape(source, "success", n);
      saved += n;
      console.log(`[${source}] Saved ${n} products`);
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[ebay-eu] Total saved: ${saved} products in ${elapsed}s`);
  } catch (err) {
    console.error(`[ebay-eu] Error:`, err.message);
  }

  console.log(`EU Scraping completed at ${new Date().toISOString()}`);
}

const args = process.argv.slice(2);

if (args.includes("--eu")) {
  const euArgs = args.filter((a) => a !== "--eu");
  const countries = euArgs.length > 0 ? euArgs : null;
  runEUScrape(countries);
} else {
  const sources = args.length > 0 ? args : ["walmart", "amazon", "target", "amazon-jp", "sephora", "lego", "interflora"];
  runScrape(sources);
}
