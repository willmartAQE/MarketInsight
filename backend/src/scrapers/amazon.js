import * as cheerio from "cheerio";
import { safeLaunchBrowser } from "../browserHelper.js";

const AMAZON_URLS = [
  { url: "https://www.amazon.com/Best-Sellers/zgbs", category: "General" },
  { url: "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics", category: "Electronics" },
  { url: "https://www.amazon.com/Best-Sellers-Home-Garden/zgbs/home-garden", category: "Home & Garden" },
  { url: "https://www.amazon.com/Best-Sellers-Kitchen/zgbs/kitchen", category: "Kitchen" },
];

function extractProductsFromHtml(html, defaultCategory) {
  const $ = cheerio.load(html);
  const products = [];

  $("[data-asin]").each((_, itemEl) => {
    const item = $(itemEl);
    const asin = (item.attr("data-asin") || "").trim();
    if (!asin || asin.length < 5) return;

    const nameEl = item.find("a.a-link-normal span div, div._cDEzb_p13n-sc-css-line-clamp-3_g3dy1, span.zg-text-center-align").first();
    const name = (nameEl.text() || "").trim();
    if (!name) return;

    let price = null;
    const priceEl = item.find("span._cDEzb_p13n-sc-price_3mJ9Z, span.a-price span.a-offscreen").first();
    if (priceEl.length) {
      const match = (priceEl.text() || "").match(/([\d,]+\.?\d*)/);
      if (match) price = parseFloat(match[1].replace(/,/g, ""));
    }

    if (!price || price <= 0) {
      const allText = item.text() || "";
      const priceMatch = allText.match(/\$([\d,]+\.?\d*)/);
      if (priceMatch) price = parseFloat(priceMatch[1].replace(/,/g, ""));
    }

    if (!price || price <= 0) return;

    let rating = null;
    const ratingEl = item.find("span.a-icon-alt").first();
    if (ratingEl.length) {
      const match = (ratingEl.text() || "").match(/([\d.]+)\s+out/);
      if (match) rating = parseFloat(match[1]);
    }

    let reviews = null;
    const reviewsEl = item.find("span.a-size-small").first();
    if (reviewsEl.length) {
      const text = (reviewsEl.text() || "").replace(/,/g, "").trim();
      const parsed = parseInt(text);
      if (!isNaN(parsed)) reviews = parsed;
    }

    const imgEl = item.find("img").first();
    let imageUrl = imgEl.attr("src") || null;

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
  });

  return products;
}

export async function scrapeAmazon() {
  const allProducts = [];
  const seenAsins = new Set();

  let browserObj;
  try {
    browserObj = await safeLaunchBrowser();
    if (browserObj?.browser) {
      const { browser } = browserObj;
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
    }
  } catch (err) {
    console.error(`[amazon] Browser error:`, err.message);
  } finally {
    if (browserObj?.browser) await browserObj.browser.close();
  }

  return { source: "amazon", products: allProducts, status: "success" };
}
