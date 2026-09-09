export type CurrencyMode = "local" | "usd";

export const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.08,
  GBP: 1.30,
  PLN: 0.25,
  CAD: 0.74,
  USD: 1.00,
};

export function getCurrencyInfo(country?: string, mode: CurrencyMode = "local") {
  const c = (country || "").toUpperCase();
  let code = "USD";
  let symbol = "$";

  if (c === "UK" || c === "GB") {
    code = "GBP";
    symbol = "£";
  } else if (c === "PL") {
    code = "PLN";
    symbol = "zł";
  } else if (c === "CA" || c === "CANADA") {
    code = "CAD";
    symbol = "C$";
  } else if (c === "USA" || c === "US") {
    code = "USD";
    symbol = "$";
  } else {
    code = "EUR";
    symbol = "€";
  }


  if (mode === "usd") {
    return {
      symbol: "$",
      rate: EXCHANGE_RATES[code] || 1.0,
      code: "USD",
      isSuffix: false,
    };
  }

  return {
    symbol,
    rate: 1.0,
    code,
    isSuffix: code === "PLN",
  };
}

export function formatPrice(price: number, country?: string, mode: CurrencyMode = "local"): string {
  if (price === null || price === undefined || isNaN(price)) return "-";
  const info = getCurrencyInfo(country, mode);
  const converted = price * info.rate;
  const formatted = converted.toFixed(2);
  return info.isSuffix ? `${formatted} ${info.symbol}` : `${info.symbol}${formatted}`;
}
