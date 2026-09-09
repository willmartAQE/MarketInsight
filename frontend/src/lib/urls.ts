/**
 * Automatically transforms store product URLs so non-English pages open translated into English.
 * - Native English sites (Amazon US/UK, Walmart, HomeDepot, BestBuy, Target, eBay US/UK) remain unchanged.
 * - Foreign Amazon sites (Amazon DE/FR/IT/ES/NL/PL/JP/CA/BR/MX/etc.) receive native query param `language=en_GB`.
 * - Other foreign store sites (El Corte Inglés, Cdiscount, Allegro, Otto, Bol, foreign eBay, etc.)
 *   are wrapped in Google Translate web proxy (auto-detect source -> English).
 */
export function getAutoEnglishUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  const url = rawUrl.trim();
  if (!url || url === '#') return '#';

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Already a Google Translate link
    if (hostname.includes('translate.google.')) {
      return url;
    }

    // Native English domains (no translation needed)
    const nativeEnglishHosts = [
      'amazon.com',
      'amazon.co.uk',
      'walmart.com',
      'homedepot.com',
      'bestbuy.com',
      'target.com',
      'ebay.com',
      'ebay.co.uk',
      'ebay.ca',
      'ebay.com.au'
    ];

    if (nativeEnglishHosts.some(host => hostname === host || hostname.endsWith('.' + host))) {
      return url;
    }

    // Amazon foreign sites - Amazon natively supports `language=en_GB`
    if (hostname.includes('amazon.')) {
      parsed.searchParams.set('language', 'en_GB');
      return parsed.toString();
    }

    // All other foreign stores (El Corte Inglés, Cdiscount, Allegro, Otto, Bol.com, eBay DE/FR/IT/ES, etc.)
    return `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(url)}`;
  } catch (err) {
    return url;
  }
}
