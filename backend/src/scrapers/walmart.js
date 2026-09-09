import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { JSDOM } from "jsdom";
import nwsapi from "nwsapi";

puppeteer.use(StealthPlugin());

const WALMART_SEARCH_URLS = [
  "https://www.walmart.com/search?q=best+sellers&sort=best_seller",
  "https://www.walmart.com/search?q=electronics+best+sellers&sort=best_seller",
  "https://www.walmart.com/search?q=home+best+sellers&sort=best_seller",
  "https://www.walmart.com/search?q=kitchen+best+sellers&sort=best_seller",
];

function extractProductsFromHtml(html) {
  const dom = new JSDOM(html);
  const { window } = dom;

  const nw = nwsapi(window);
  nw.configure({ IDS_DUPES: false, LIVECACHE: true, LOGERRORS: false });

  const scriptEl = nw.first("script#__NEXT_DATA__", window.document);
  if (!scriptEl) return [];

  let data;
  try {
    data = JSON.parse(scriptEl.textContent);
  } catch {
    return [];
  }

  let stacks;
  try {
    stacks = data.props.pageProps.initialData.searchResult.itemStacks;
  } catch {
    return [];
  }

  const products = [];

  for (const stack of stacks || []) {
    for (const item of stack.items || []) {
      if (item.__typename !== "Product") continue;

      const price = parseFloat(item.price);
      if (!price || price <= 0) continue;

      const priceInfo = item.priceInfo || {};
      let originalPrice = null;
      if (priceInfo.linePriceDisplay) {
        const parsed = parseFloat(priceInfo.linePriceDisplay.replace(/[$,]/g, ""));
        if (parsed > price) originalPrice = parsed;
      }

      const ratingData = item.rating || {};
      const avgRating = item.averageRating || ratingData.averageRating || null;
      const reviews = item.numberOfReviews || ratingData.numberOfReviews || null;

      const availability = item.availabilityStatusV2 || {};
      const availText = typeof availability === "object" ? availability.display || "Unknown" : "Unknown";

      let url = item.canonicalUrl || "";
      if (url && !url.startsWith("http")) url = `https://www.walmart.com${url}`;

      products.push({
        name: item.name || "Unknown",
        price,
        original_price: originalPrice,
        discount_pct: originalPrice ? Math.round((1 - price / originalPrice) * 100) : null,
        rating: avgRating ? parseFloat(String(avgRating)) : null,
        reviews_count: reviews ? parseInt(String(reviews)) : null,
        category: item.departmentName || "General",
        source: "walmart",
        url,
        image_url: item.image || null,
        seller: item.sellerName || null,
        availability: availText,
        country: "USA",
      });
    }
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

export async function scrapeWalmart() {
  const allProducts = [];
  const seenUrls = new Set();

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

    for (const url of WALMART_SEARCH_URLS) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForSelector("script#__NEXT_DATA__", { timeout: 10000 }).catch(() => {});
        const html = await page.content();
        const products = extractProductsFromHtml(html);

        for (const p of products) {
          if (!seenUrls.has(p.url)) {
            seenUrls.add(p.url);
            allProducts.push(p);
          }
        }
        console.log(`[walmart] ${url.split("?")[0]}: found ${products.length} products`);
      } catch (err) {
        console.error(`[walmart] Error fetching ${url}:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }

  return { source: "walmart", products: allProducts, status: allProducts.length > 0 ? "success" : "error" };
}
