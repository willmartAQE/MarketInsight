import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { JSDOM } from "jsdom";
import nwsapi from "nwsapi";

puppeteer.use(StealthPlugin());

const AMAZON_URLS = [
  { url: "https://www.amazon.com/Best-Sellers/zgbs", category: "General" },
  { url: "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics", category: "Electronics" },
  { url: "https://www.amazon.com/Best-Sellers-Home-Garden/zgbs/home-garden", category: "Home & Garden" },
  { url: "https://www.amazon.com/Best-Sellers-Kitchen/zgbs/kitchen", category: "Kitchen" },
];

function extractProductsFromHtml(html, defaultCategory) {
  const dom = new JSDOM(html);
  const { window } = dom;

  const nw = nwsapi(window);
  nw.configure({ IDS_DUPES: false, LIVECACHE: true, LOGERRORS: false });

  const doc = window.document;
  const products = [];
  const items = nw.select("[data-asin]", doc);

  for (const item of items) {
    const asin = (item.getAttribute("data-asin") || "").trim();
    if (!asin || asin.length < 5) continue;

    const nameEl =
      nw.first("a.a-link-normal span div", item) ||
      nw.first("div._cDEzb_p13n-sc-css-line-clamp-3_g3dy1", item) ||
      nw.first("span.zg-text-center-align", item);

    if (!nameEl) continue;
    const name = (nameEl.textContent || "").trim();
    if (!name) continue;

    let price = null;
    const priceEl =
      nw.first("span._cDEzb_p13n-sc-price_3mJ9Z", item) ||
      nw.first("span.a-price span.a-offscreen", item);

    if (priceEl) {
      const match = (priceEl.textContent || "").match(/([\d,]+\.?\d*)/);
      if (match) price = parseFloat(match[1].replace(/,/g, ""));
    }

    if (!price || price <= 0) {
      const allText = item.textContent || "";
      const priceMatch = allText.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) price = parseFloat(priceMatch[1].replace(/,/g, ""));
    }

    if (!price || price <= 0) continue;

    let rating = null;
    const ratingEl = nw.first("span.a-icon-alt", item);
    if (ratingEl) {
      const match = (ratingEl.textContent || "").match(/([\d.]+)\s+out/);
      if (match) rating = parseFloat(match[1]);
    }

    let reviews = null;
    const reviewsEl = nw.first("span.a-size-small", item);
    if (reviewsEl) {
      const text = (reviewsEl.textContent || "").replace(/,/g, "").trim();
      const parsed = parseInt(text);
      if (!isNaN(parsed)) reviews = parsed;
    }

    let imageUrl = null;
    const imgEl = nw.first("img", item);
    if (imgEl) imageUrl = imgEl.getAttribute("src");

    products.push({
      name,
      price,
      original_price: null,
      discount_pct: null,
      rating,
      reviews_count: reviews,
      category: defaultCategory,
      source: "amazon",
      url: `https://www.amazon.com/dp/${asin}`,
      image_url: imageUrl,
      seller: "Amazon.com",
      availability: "In Stock",
      country: "USA",
    });
  }

  return products;
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });
}

export async function scrapeAmazon() {
  const allProducts = [];
  const seenAsins = new Set();

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

    for (const { url, category } of AMAZON_URLS) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await new Promise((r) => setTimeout(r, 2000));
        const html = await page.content();
        const products = extractProductsFromHtml(html, category);

        for (const p of products) {
          const asin = p.url.split("/dp/")[1];
          if (asin && !seenAsins.has(asin)) {
            seenAsins.add(asin);
            allProducts.push(p);
          }
        }
        console.log(`[amazon] ${category}: found ${products.length} products`);
      } catch (err) {
        console.error(`[amazon] Error fetching ${url}:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }

  return { source: "amazon", products: allProducts, status: allProducts.length > 0 ? "success" : "error" };
}
