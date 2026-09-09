import { scrapeWalmart } from "./scrapers/walmart.js";
import { scrapeAmazon } from "./scrapers/amazon.js";
import { scrapeAmazonEU } from "./scrapers/amazon-eu.js";
import { scrapeEbayEU } from "./scrapers/ebay-eu.js";
import { scrapeAllegro } from "./scrapers/allegro.js";
import { scrapeBol } from "./scrapers/bol.js";
import { scrapeCdiscount } from "./scrapers/cdiscount.js";
import { scrapeOtto } from "./scrapers/otto.js";
import { upsertProduct, addPriceHistory, logScrape } from "./db.js";

async function saveProducts(source, products) {
  let saved = 0;
  for (const product of products) {
    try {
      const productId = upsertProduct(product);
      addPriceHistory(productId, product.price);
      saved++;
    } catch (err) {
      console.error(`  [save] Error saving product: ${err.message}`);
    }
  }
  return saved;
}

async function runScrape(sources) {
  console.log(`Scraping started at ${new Date().toISOString()}`);

  const usScrapers = {
    walmart: scrapeWalmart,
    amazon: scrapeAmazon,
  };

  for (const source of sources) {
    const scraper = usScrapers[source];
    if (!scraper) {
      console.log(`[us] Unknown source: ${source}`);
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

  const targetList = countries || ["pl", "nl", "fr", "de"];
  if (targetList.includes("pl")) {
    try {
      const res = await scrapeAllegro();
      const n = await saveProducts("allegro", res.products);
      logScrape("allegro", res.status, n);
      console.log(`[allegro] Saved ${n} products`);
    } catch (err) {
      console.error(`[allegro] Error:`, err.message);
    }
  }

  if (targetList.includes("nl")) {
    try {
      const res = await scrapeBol();
      const n = await saveProducts("bol-nl", res.products);
      logScrape("bol-nl", res.status, n);
      console.log(`[bol-nl] Saved ${n} products`);
    } catch (err) {
      console.error(`[bol-nl] Error:`, err.message);
    }
  }

  if (targetList.includes("fr")) {
    try {
      const res = await scrapeCdiscount();
      const n = await saveProducts("cdiscount", res.products);
      logScrape("cdiscount", res.status, n);
      console.log(`[cdiscount] Saved ${n} products`);
    } catch (err) {
      console.error(`[cdiscount] Error:`, err.message);
    }
  }

  if (targetList.includes("de")) {
    try {
      const res = await scrapeOtto();
      const n = await saveProducts("otto-de", res.products);
      logScrape("otto-de", res.status, n);
      console.log(`[otto-de] Saved ${n} products`);
    } catch (err) {
      console.error(`[otto-de] Error:`, err.message);
    }
  }

  console.log(`EU Scraping completed at ${new Date().toISOString()}`);
}

const args = process.argv.slice(2);

if (args.includes("--eu")) {
  const euArgs = args.filter((a) => a !== "--eu");
  const countries = euArgs.length > 0 ? euArgs : null;
  runEUScrape(countries);
} else {
  const sources = args.length > 0 ? args : ["walmart", "amazon"];
  runScrape(sources);
}
