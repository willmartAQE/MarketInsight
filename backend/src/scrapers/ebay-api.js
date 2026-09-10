import EbayAuthToken from "ebay-oauth-nodejs-client";
import { gotScraping } from "got-scraping";

const EBAY_MARKETPLACES = {
  it: { marketplaceId: "EBAY_IT", domain: "ebay.it", country: "IT", currency: "EUR" },
  de: { marketplaceId: "EBAY_DE", domain: "ebay.de", country: "DE", currency: "EUR" },
  fr: { marketplaceId: "EBAY_FR", domain: "ebay.fr", country: "FR", currency: "EUR" },
  es: { marketplaceId: "EBAY_ES", domain: "ebay.es", country: "ES", currency: "EUR" },
  uk: { marketplaceId: "EBAY_GB", domain: "ebay.co.uk", country: "UK", currency: "GBP" },
  us: { marketplaceId: "EBAY_US", domain: "ebay.com", country: "US", currency: "USD" },
};

let cachedTokens = {};

async function getEbayApplicationToken(env = "PRODUCTION") {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const now = Date.now();
  if (cachedTokens[env] && cachedTokens[env].expiresAt > now + 60000) {
    return cachedTokens[env].token;
  }

  try {
    const ebayAuthToken = new EbayAuthToken({
      clientId: clientId,
      clientSecret: clientSecret,
      env: env === "SANDBOX" ? "SANDBOX" : "PRODUCTION",
    });

    const tokenResponse = await ebayAuthToken.getApplicationToken(env === "SANDBOX" ? "SANDBOX" : "PRODUCTION");
    const parsed = JSON.parse(tokenResponse);
    if (parsed.access_token) {
      cachedTokens[env] = {
        token: parsed.access_token,
        expiresAt: now + (parsed.expires_in || 7200) * 1000,
      };
      return parsed.access_token;
    }
  } catch (err) {
    console.error("⚠️ Failed to get eBay OAuth application token:", err.message);
  }
  return null;
}

export async function searchEbayAPI(query, countryCode = "it", categoryName = "General") {
  const c = (countryCode || "it").toLowerCase();
  const storeInfo = EBAY_MARKETPLACES[c] || EBAY_MARKETPLACES["it"];
  const sourceName = `ebay-${c}`;

  const token = await getEbayApplicationToken(process.env.EBAY_ENV || "PRODUCTION");

  if (!token) {
    console.log(`ℹ️ eBay API credentials not set for ${sourceName}. Using pre-filtered search URL fallback.`);
    // Clean fallback pre-filtered URL with user's filters (Buy It Now, New, Country, Sort Price Lowest)
    const encodedQ = encodeURIComponent(query);
    const searchUrl = `https://www.${storeInfo.domain}/sch/i.html?_nkw=${encodedQ}&LH_ItemCondition=3&_sop=2&LH_BIN=1&rt=nc&LH_PrefLoc=1`;
    return {
      source: sourceName,
      status: "fallback",
      products: [
        {
          name: `${query} (${storeInfo.domain})`,
          price: 0,
          original_price: null,
          discount_pct: null,
          rating: 4.5,
          reviews_count: 50,
          category: categoryName,
          source: sourceName,
          url: searchUrl,
          image_url: null,
          seller: "eBay Seller",
          availability: "In Stock",
          country: storeInfo.country,
        }
      ],
    };
  }

  try {
    const filterStr = `itemLocationCountry:${storeInfo.country},buyingOptions:{FIXED_PRICE},conditionIds:{1000}`;
    const endpoint = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filterStr)}&limit=10`;

    const res = await gotScraping.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": storeInfo.marketplaceId,
        "Accept": "application/json",
      },
      responseType: "json",
    });

    const data = res.body;
    const items = data.itemSummaries || [];

    const products = items.map((item) => {
      const priceVal = parseFloat(item.price?.value || "0");
      const origPriceVal = item.marketingPrice?.originalPrice?.value ? parseFloat(item.marketingPrice.originalPrice.value) : null;
      const discountPct = origPriceVal && origPriceVal > priceVal ? Math.round(((origPriceVal - priceVal) / origPriceVal) * 100) : null;

      return {
        name: item.title,
        price: priceVal,
        original_price: origPriceVal,
        discount_pct: discountPct,
        rating: 4.7,
        reviews_count: item.seller?.feedbackScore || 100,
        category: categoryName,
        source: sourceName,
        url: item.itemWebUrl || item.itemHref,
        image_url: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null,
        seller: item.seller?.username || "eBay Seller",
        availability: "In Stock",
        country: storeInfo.country,
      };
    });

    return {
      source: sourceName,
      status: "success",
      products,
    };
  } catch (err) {
    console.error(`⚠️ Error calling eBay Browse API for ${sourceName}:`, err.message);
    return { source: sourceName, status: "error", products: [] };
  }
}
