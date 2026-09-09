import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { JSDOM } from "jsdom";
import nwsapi from "nwsapi";
import { AMAZON_EU } from "../stores.js";

puppeteer.use(StealthPlugin());

const CATEGORIES_PER_COUNTRY = {
  de: [
    { url: "https://www.amazon.de/gp/bestsellers/kitchen", category: "Kitchen" },
    { url: "https://www.amazon.de/gp/bestsellers/electronics", category: "Electronics" },
    { url: "https://www.amazon.de/gp/bestsellers/diy", category: "Home & Garden" },
    { url: "https://www.amazon.de/gp/bestsellers/toys", category: "Toys" },
  ],
  fr: [
    { url: "https://www.amazon.fr/gp/bestsellers/kitchen", category: "Kitchen" },
    { url: "https://www.amazon.fr/gp/bestsellers/electronics", category: "Electronics" },
    { url: "https://www.amazon.fr/gp/bestsellers/jardin", category: "Home & Garden" },
    { url: "https://www.amazon.fr/gp/bestsellers/toys", category: "Toys" },
  ],
  it: [
    { url: "https://www.amazon.it/gp/bestsellers/kitchen", category: "Kitchen" },
    { url: "https://www.amazon.it/gp/bestsellers/elettronica", category: "Electronics" },
    { url: "https://www.amazon.it/gp/bestsellers/giardino", category: "Home & Garden" },
    { url: "https://www.amazon.it/gp/bestsellers/giocattoli", category: "Toys" },
  ],
  es: [
    { url: "https://www.amazon.es/gp/bestsellers/kitchen", category: "Kitchen" },
    { url: "https://www.amazon.es/gp/bestsellers/electronica", category: "Electronics" },
    { url: "https://www.amazon.es/gp/bestsellers/bricolaje", category: "Home & Garden" },
    { url: "https://www.amazon.es/gp/bestsellers/juguetes", category: "Toys" },
  ],
  uk: [
    { url: "https://www.amazon.co.uk/gp/bestsellers/kitchen", category: "Kitchen" },
    { url: "https://www.amazon.co.uk/gp/bestsellers/electronics", category: "Electronics" },
    { url: "https://www.amazon.co.uk/gp/bestsellers/diy", category: "Home & Garden" },
    { url: "https://www.amazon.co.uk/gp/bestsellers/toys", category: "Toys" },
  ],
  nl: [
    { url: "https://www.amazon.nl/gp/bestsellers/kitchen", category: "Kitchen" },
    { url: "https://www.amazon.nl/gp/bestsellers/electronics", category: "Electronics" },
  ],
  pl: [
    { url: "https://www.amazon.pl/gp/bestsellers/kitchen", category: "Kitchen" },
    { url: "https://www.amazon.pl/gp/bestsellers/electronics", category: "Electronics" },
  ],
};

function extractProductsFromHtml(html, defaultCategory, country) {
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
      nw.first("span.a-price span.a-offscreen", item) ||
      nw.first("span.a-color-price", item);

    if (priceEl) {
      const text = priceEl.textContent || "";
      const match = text.match(/([\d]+[.,]\d{2})/);
      if (match) {
        let numStr = match[1];
        if (numStr.includes(",") && !numStr.includes(".")) {
          numStr = numStr.replace(",", ".");
        } else {
          numStr = numStr.replace(/,/g, "");
        }
        price = parseFloat(numStr);
      }
    }

    if (!price || price <= 0) {
      const allText = item.textContent || "";
      const match = allText.match(/([\d]+[.,]\d{2})\s*[€£]/);
      if (match) {
        let numStr = match[1];
        if (numStr.includes(",") && !numStr.includes(".")) {
          numStr = numStr.replace(",", ".");
        } else {
          numStr = numStr.replace(/,/g, "");
        }
        price = parseFloat(numStr);
      }
    }

    if (!price || price <= 0) {
      const allText = item.textContent || "";
      const match = allText.match(/[€£]\s*([\d]+[.,]\d{2})/);
      if (match) {
        let numStr = match[1];
        if (numStr.includes(",") && !numStr.includes(".")) {
          numStr = numStr.replace(",", ".");
        } else {
          numStr = numStr.replace(/,/g, "");
        }
        price = parseFloat(numStr);
      }
    }

    if (!price || price <= 0) continue;

    let rating = null;
    const ratingEl = nw.first("span.a-icon-alt", item);
    if (ratingEl) {
      const match = (ratingEl.textContent || "").match(/([\d.,]+)\s/);
      if (match) rating = parseFloat(match[1].replace(",", "."));
    }

    let reviews = null;
    const reviewsEl = nw.first("span.a-size-small", item);
    if (reviewsEl) {
      const text = (reviewsEl.textContent || "").replace(/[.,]/g, "").trim();
      const parsed = parseInt(text);
      if (!isNaN(parsed)) reviews = parsed;
    }

    let imageUrl = null;
    const imgEl = nw.first("img", item);
    if (imgEl) imageUrl = imgEl.getAttribute("src");

    const domain = AMAZON_EU[`amazon-${country}`]?.domain || `amazon.${country}`;
    const currencySymbol = country === "uk" ? "£" : "€";

    products.push({
      name,
      price,
      original_price: null,
      discount_pct: null,
      rating,
      reviews_count: reviews,
      category: defaultCategory,
      source: `amazon-${country}`,
      url: `https://www.${domain}/dp/${asin}`,
      image_url: imageUrl,
      seller: domain,
      availability: "In Stock",
      country: country.toUpperCase(),
      currency: currencySymbol,
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

export async function scrapeAmazonEU(countries = null) {
  const targetCountries = countries || Object.keys(CATEGORIES_PER_COUNTRY);
  const allProducts = [];
  const results = {};

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

    for (const country of targetCountries) {
      const categories = CATEGORIES_PER_COUNTRY[country];
      if (!categories) {
        console.log(`[amazon-${country}] No categories configured`);
        continue;
      }

      const seenAsins = new Set();
      const countryProducts = [];

      for (const { url, category } of categories) {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          await new Promise((r) => setTimeout(r, 2000));
          const html = await page.content();
          const products = extractProductsFromHtml(html, category, country);

          for (const p of products) {
            const asin = p.url.split("/dp/")[1];
            if (asin && !seenAsins.has(asin)) {
              seenAsins.add(asin);
              countryProducts.push(p);
            }
          }
          console.log(`[amazon-${country}] ${category}: ${products.length} products`);
        } catch (err) {
          console.error(`[amazon-${country}] Error: ${err.message}`);
        }
      }

      results[`amazon-${country}`] = countryProducts.length;
      allProducts.push(...countryProducts);
    }
  } finally {
    await browser.close();
  }

  return { products: allProducts, results };
}
