import fetch from "node-fetch";

/**
 * Keepa Domain IDs mapping:
 * 1: com, 2: uk, 3: de, 4: fr, 5: jp, 6: ca, 8: it, 9: es
 */
export const KEEPA_DOMAINS = {
  US: { id: 1, tld: "com" },
  UK: { id: 2, tld: "co.uk" },
  GB: { id: 2, tld: "co.uk" },
  DE: { id: 3, tld: "de" },
  FR: { id: 4, tld: "fr" },
  JP: { id: 5, tld: "co.jp" },
  CA: { id: 6, tld: "ca" },
  IT: { id: 8, tld: "it" },
  ES: { id: 9, tld: "es" },
};

/**
 * Extracts 10-character Amazon ASIN (e.g. B08JHCVHTY) from product URL
 */
export function extractAmazonAsin(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/(?:dp|gp\/product|ASIN|product)\/([A-Z0-9]{10})/i);
  if (match) return match[1].toUpperCase();
  const rawMatch = url.match(/\/([B][0-9A-Z]{9})(?:[/?#]|$)/i);
  return rawMatch ? rawMatch[1].toUpperCase() : null;
}

/**
 * Gets domain TLD and Keepa Domain ID based on country code or Amazon URL
 */
export function getKeepaDomainInfo(countryCode, url) {
  if (url) {
    const u = url.toLowerCase();
    if (u.includes("amazon.co.uk")) return KEEPA_DOMAINS.UK;
    if (u.includes("amazon.de")) return KEEPA_DOMAINS.DE;
    if (u.includes("amazon.fr")) return KEEPA_DOMAINS.FR;
    if (u.includes("amazon.it")) return KEEPA_DOMAINS.IT;
    if (u.includes("amazon.es")) return KEEPA_DOMAINS.ES;
    if (u.includes("amazon.ca")) return KEEPA_DOMAINS.CA;
    if (u.includes("amazon.co.jp")) return KEEPA_DOMAINS.JP;
    if (u.includes("amazon.com")) return KEEPA_DOMAINS.US;
  }

  const code = (countryCode || "US").toUpperCase();
  return KEEPA_DOMAINS[code] || KEEPA_DOMAINS.US;
}

/**
 * Generates Keepa official visual price history chart image URL
 */
export function getKeepaChartUrl(asin, domainTld = "com", rangeDays = 90) {
  return `https://graph.keepa.com/pricehistory.png?asin=${asin}&domain=${domainTld}&amazon=1&new=1&used=1&range=${rangeDays}`;
}

/**
 * Generates Keepa product web detail link
 */
export function getKeepaProductUrl(asin, domainId = 1) {
  return `https://keepa.com/#!product/${domainId}-${asin}`;
}

/**
 * Converts Keepa minute timestamps to Date
 * Keepa Time Epoch starts at 2011-01-01 00:00:00 UTC (Minute 0 = 21564000 Unix Minutes)
 */
export function keepaTimeToDate(keepaMinutes) {
  const epochMinutes = 21564000;
  const unixTimestampMs = (keepaMinutes + epochMinutes) * 60 * 1000;
  return new Date(unixTimestampMs);
}

/**
 * Fetches real Keepa price history via official API if KEEPA_API_KEY is present
 */
export async function fetchKeepaApiData(asin, domainId = 1) {
  const apiKey = process.env.KEEPA_API_KEY;
  if (!apiKey) return null;

  try {
    const apiUrl = `https://api.keepa.com/product?key=${apiKey}&domain=${domainId}&asin=${asin}&history=1`;
    const res = await fetch(apiUrl);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.products || data.products.length === 0) return null;

    const product = data.products[0];
    const csv = product.csv;
    if (!csv) return null;

    // csv[0] = AMAZON price, csv[1] = NEW marketplace price
    const amazonPriceCsv = csv[0] || csv[1] || [];
    const historyPoints = [];

    for (let i = 0; i < amazonPriceCsv.length; i += 2) {
      const timeMin = amazonPriceCsv[i];
      const rawPrice = amazonPriceCsv[i + 1];
      if (rawPrice > 0) {
        historyPoints.push({
          date: keepaTimeToDate(timeMin).toISOString().split("T")[0],
          price: rawPrice / 100.0,
        });
      }
    }

    return {
      stats: product.stats,
      title: product.title,
      historyPoints,
    };
  } catch (err) {
    console.warn("[keepa] API fetch error:", err.message);
    return null;
  }
}
