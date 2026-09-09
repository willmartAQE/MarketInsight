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

export function groupCrossCountryProducts(products: Product[]): ProductGroup[] {
  if (!products || products.length === 0) return [];

  const cleanKey = (name: string): string => {
    let s = (name || "").toLowerCase();
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    s = s.replace(/[^a-z0-9\s]/g, " ");

    if (s.includes("delonghi") && (s.includes("ecodecalk") || s.includes("dlsc500") || s.includes("descaler"))) return "delonghi_ecodecalk";
    if (s.includes("delonghi") && s.includes("dlsc002")) return "delonghi_dlsc002";
    if (s.includes("duracell") && s.includes("2032")) return "duracell_2032";
    if (s.includes("duracell") && s.includes("aaa")) return "duracell_aaa";
    if (s.includes("pritt") && (s.includes("glue") || s.includes("colla") || s.includes("stick"))) return "pritt_glue_stick";
    if (s.includes("fischer") && s.includes("duopower")) return "fischer_duopower";
    if (s.includes("wago") && s.includes("compact")) return "wago_compact";
    if (s.includes("pokemon") || s.includes("pkm")) return "pokemon_tin";
    if (s.includes("brita") && (s.includes("maxtra") || s.includes("pure"))) return "brita_maxtra";
    if (s.includes("siemens") && s.includes("tz80002a")) return "siemens_descaling";
    if (s.includes("lego") && (s.includes("botanicals") || s.includes("10349"))) return "lego_botanicals";
    if (s.includes("skyjo")) return "skyjo_card_game";
    if (s.includes("hangers") || s.includes("perchas")) return "velvet_hangers";
    if (s.includes("scale") || s.includes("balanza")) return "digital_scale";

    const words = s.split(/\s+/).filter(w => w.length > 2 && !["the", "and", "for", "with", "pack", "piece", "original"].includes(w));
    return words.slice(0, 3).join("_");
  };

  const map = new Map<string, Product[]>();

  for (const p of products) {
    const k = cleanKey(p.name);
    if (!k || k.length < 3) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(p);
  }

  const groups: ProductGroup[] = [];

  for (const [key, items] of map.entries()) {
    const countrySet = new Set(items.map((i) => i.country));
    if (items.length >= 2) {
      const sorted = [...items].sort((a, b) => a.price - b.price);
      const minPrice = sorted[0].price;
      const maxPrice = sorted[sorted.length - 1].price;
      const variancePct = minPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 100) : 0;

      // Find canonical title (longest/most descriptive title)
      const canonicalTitle = items.reduce((prev, curr) => (curr.name.length > prev.name.length ? curr : prev)).name;

      groups.push({
        id: key,
        name: canonicalTitle,
        category: items[0].category || "General",
        countries: Array.from(countrySet),
        products: sorted,
        minPrice,
        maxPrice,
        priceVariancePct: variancePct,
        cheapestProduct: sorted[0],
        highestDiscountProduct: [...items].sort((a, b) => (b.discount_pct || 0) - (a.discount_pct || 0))[0],
      });
    }
  }

  return groups.sort((a, b) => b.countries.length - a.countries.length || b.priceVariancePct - a.priceVariancePct);
}
