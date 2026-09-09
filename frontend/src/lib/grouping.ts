import { Product } from "@/types";

export interface ProductGroup {
  id: string;
  name: string;
  category: string;
  countries: string[];
  products: Product[];
  minPrice: number;
  maxPrice: number;
  priceVariancePct: number;
  cheapestProduct: Product;
  highestDiscountProduct?: Product;
}

export function getCountryFlag(countryCode?: string): string {
  const c = (countryCode || "").toUpperCase();
  if (c === "DE") return "🇩🇪";
  if (c === "FR") return "🇫🇷";
  if (c === "IT") return "🇮🇹";
  if (c === "ES") return "🇪🇸";
  if (c === "UK" || c === "GB") return "🇬🇧";
  if (c === "US") return "🇺🇸";
  if (c === "CA") return "🇨🇦";
  if (c === "NL") return "🇳🇱";
  if (c === "PL") return "🇵🇱";
  return "🌐";
}

export function getCountryName(countryCode?: string): string {
  const c = (countryCode || "").toUpperCase();
  if (c === "DE") return "Germany";
  if (c === "FR") return "France";
  if (c === "IT") return "Italy";
  if (c === "ES") return "Spain";
  if (c === "UK" || c === "GB") return "United Kingdom";
  if (c === "US") return "United States";
  if (c === "CA") return "Canada";
  if (c === "NL") return "Netherlands";
  if (c === "PL") return "Poland";
  return c || "Global";
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "pack", "piece", "original", "machine", "set", "pcs", "x",
  "der", "die", "das", "und", "fur", "mit", "stuck", "packung",
  "le", "la", "les", "et", "pour", "avec", "boite", "piece",
  "il", "i", "le", "e", "per", "con", "pezzi", "confezione", "colla",
  "el", "los", "las", "y", "para", "con", "piezas", "de", "del"
]);

export function tokenize(str: string): string[] {
  if (!str) return [];
  const normalized = str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");

  return normalized
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function calculateSimilarity(titleA: string, titleB: string): number {
  const tokensA = tokenize(titleA);
  const tokensB = tokenize(titleB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function extractBrand(name: string): string {
  const s = name.toLowerCase();
  const knownBrands = [
    "delonghi", "duracell", "pritt", "fischer", "wago", "pokemon", "pkm",
    "brita", "siemens", "lego", "skyjo", "amazon basics", "laica", "hansgrohe",
    "russell hobbs", "irobot", "roomba", "dyson", "samsung", "apple", "lg",
    "roborock", "taurus", "weber", "kenmore", "foppapedretti", "magilano"
  ];

  for (const brand of knownBrands) {
    if (s.includes(brand)) return brand;
  }
  const tokens = tokenize(name);
  return tokens.length > 0 ? tokens[0] : "generic";
}

export function groupCrossCountryProducts(products: Product[], onlyMultiItem: boolean = true): ProductGroup[] {
  if (!products || products.length === 0) return [];

  const groups: ProductGroup[] = [];
  const visited = new Set<number>();

  for (let i = 0; i < products.length; i++) {
    const p1 = products[i];
    if (visited.has(p1.id)) continue;

    const currentGroupProducts: Product[] = [p1];
    visited.add(p1.id);

    const brand1 = extractBrand(p1.name);

    for (let j = i + 1; j < products.length; j++) {
      const p2 = products[j];
      if (visited.has(p2.id)) continue;

      const brand2 = extractBrand(p2.name);

      // Strict Brand check: if both have explicit known brands and they differ, do not group!
      if (brand1 !== "generic" && brand2 !== "generic" && brand1 !== brand2) {
        continue;
      }

      // Price ratio safety check (max price cannot be > 3.5x min price for identical product)
      const minP = Math.min(p1.price, p2.price);
      const maxP = Math.max(p1.price, p2.price);
      if (minP > 0 && maxP / minP > 3.5) {
        continue;
      }

      // Similarity check
      const sim = calculateSimilarity(p1.name, p2.name);

      // Match condition: high title similarity OR exact brand + key model overlap
      if (sim >= 0.35 || (brand1 !== "generic" && brand1 === brand2 && sim >= 0.20)) {
        currentGroupProducts.push(p2);
        visited.add(p2.id);
      }
    }

    const sorted = [...currentGroupProducts].sort((a, b) => a.price - b.price);
    const minPrice = sorted[0].price;
    const maxPrice = sorted[sorted.length - 1].price;
    const variancePct = minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 100) : 0;
    const countrySet = new Set(sorted.map((item) => item.country));
    const canonicalTitle = sorted.reduce((prev, curr) => (curr.name.length > prev.name.length ? curr : prev)).name;

    groups.push({
      id: `group_${p1.id}`,
      name: canonicalTitle,
      category: p1.category || "General",
      countries: Array.from(countrySet),
      products: sorted,
      minPrice,
      maxPrice,
      priceVariancePct: variancePct,
      cheapestProduct: sorted[0],
      highestDiscountProduct: [...sorted].sort((a, b) => (b.discount_pct || 0) - (a.discount_pct || 0))[0],
    });
  }

  const result = onlyMultiItem
    ? groups.filter((g) => g.products.length >= 2 || g.countries.length >= 2)
    : groups;

  return result.sort((a, b) => b.countries.length - a.countries.length || b.priceVariancePct - a.priceVariancePct);
}
