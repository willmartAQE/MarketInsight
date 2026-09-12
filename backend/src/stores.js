export const STORES = {
  "us": {
    name: "United States",
    flag: "🇺🇸",
    currency: "$",
    stores: [
      { id: "walmart", name: "Walmart", type: "walmart", enabled: true },
      { id: "amazon-us", name: "Amazon US", type: "amazon", enabled: true },
      { id: "homedepot", name: "The Home Depot", type: "homedepot", enabled: true },
      { id: "bestbuy", name: "Best Buy", type: "bestbuy", enabled: true },
      { id: "target", name: "Target", type: "target", enabled: true },
      { id: "sephora", name: "Sephora US", type: "sephora", enabled: true },
      { id: "lego", name: "LEGO Store", type: "lego", enabled: true },
    ],
  },
  "ca": {
    name: "Canada",
    flag: "🇨🇦",
    currency: "$",
    stores: [
      { id: "amazon-ca", name: "Amazon Canada", type: "amazon", enabled: true },
      { id: "bestbuy-ca", name: "Best Buy Canada", type: "bestbuy", enabled: true },
      { id: "walmart-ca", name: "Walmart Canada", type: "walmart", enabled: true },
      { id: "sephora-ca", name: "Sephora Canada", type: "sephora", enabled: true },
    ],
  },
  "jp": {
    name: "Japan",
    flag: "🇯🇵",
    currency: "¥",
    stores: [
      { id: "amazon-jp", name: "Amazon Japan", type: "amazon", enabled: true },
    ],
  },
  "de": {
    name: "Germany",
    flag: "🇩🇪",
    currency: "€",
    stores: [
      { id: "amazon-de", name: "Amazon.de", type: "amazon", enabled: true },
      { id: "ebay-de", name: "eBay.de", type: "ebay", enabled: true },
      { id: "sephora-de", name: "Sephora Germany", type: "sephora", enabled: true },
    ],
  },
  "fr": {
    name: "France",
    flag: "🇫🇷",
    currency: "€",
    stores: [
      { id: "amazon-fr", name: "Amazon.fr", type: "amazon", enabled: true },
      { id: "ebay-fr", name: "eBay.fr", type: "ebay", enabled: true },
      { id: "sephora-fr", name: "Sephora France", type: "sephora", enabled: true },
    ],
  },
  "it": {
    name: "Italy",
    flag: "🇮🇹",
    currency: "€",
    stores: [
      { id: "amazon-it", name: "Amazon.it", type: "amazon", enabled: true },
      { id: "ebay-it", name: "eBay.it", type: "ebay", enabled: true },
      { id: "interflora", name: "Interflora", type: "interflora", enabled: true },
      { id: "sephora-it", name: "Sephora Italia", type: "sephora", enabled: true },
    ],
  },
  "es": {
    name: "Spain",
    flag: "🇪🇸",
    currency: "€",
    stores: [
      { id: "amazon-es", name: "Amazon.es", type: "amazon", enabled: true },
      { id: "ebay-es", name: "eBay.es", type: "ebay", enabled: true },
      { id: "sephora-es", name: "Sephora España", type: "sephora", enabled: true },
    ],
  },
  "uk": {
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "£",
    stores: [
      { id: "amazon-uk", name: "Amazon.co.uk", type: "amazon", enabled: true },
      { id: "ebay-uk", name: "eBay.co.uk", type: "ebay", enabled: true },
      { id: "sephora-uk", name: "Sephora UK", type: "sephora", enabled: true },
    ],
  },
  "nl": {
    name: "Netherlands",
    flag: "🇳🇱",
    currency: "€",
    stores: [
      { id: "amazon-nl", name: "Amazon.nl", type: "amazon", enabled: true },
    ],
  },
  "pl": {
    name: "Poland",
    flag: "🇵🇱",
    currency: "zł",
    stores: [
      { id: "amazon-pl", name: "Amazon.pl", type: "amazon", enabled: true },
      { id: "sephora-pl", name: "Sephora Polska", type: "sephora", enabled: true },
    ],
  },
};

export const AMAZON_EU = {
  "amazon-de": { domain: "amazon.de", lang: "de-DE", country: "de", bestSellers: "https://www.amazon.de/gp/bestsellers" },
  "amazon-fr": { domain: "amazon.fr", lang: "fr-FR", country: "fr", bestSellers: "https://www.amazon.fr/gp/bestsellers" },
  "amazon-it": { domain: "amazon.it", lang: "it-IT", country: "it", bestSellers: "https://www.amazon.it/gp/bestsellers" },
  "amazon-es": { domain: "amazon.es", lang: "es-ES", country: "es", bestSellers: "https://www.amazon.es/gp/bestsellers" },
  "amazon-uk": { domain: "amazon.co.uk", lang: "en-GB", country: "uk", bestSellers: "https://www.amazon.co.uk/gp/bestsellers" },
  "amazon-nl": { domain: "amazon.nl", lang: "nl-NL", country: "nl", bestSellers: "https://www.amazon.nl/gp/bestsellers" },
  "amazon-pl": { domain: "amazon.pl", lang: "pl-PL", country: "pl", bestSellers: "https://www.amazon.pl/gp/bestsellers" },
};

export const EBAY_EU = {
  "ebay-de": { domain: "ebay.de", country: "de", bestSellers: "https://www.ebay.de/e/deals" },
  "ebay-fr": { domain: "ebay.fr", country: "fr", bestSellers: "https://www.ebay.fr/e/deals" },
  "ebay-it": { domain: "ebay.it", country: "it", bestSellers: "https://www.ebay.it/e/deals" },
  "ebay-es": { domain: "ebay.es", country: "es", bestSellers: "https://www.ebay.es/e/deals" },
  "ebay-uk": { domain: "ebay.co.uk", country: "uk", bestSellers: "https://www.ebay.co.uk/e/deals" },
};
