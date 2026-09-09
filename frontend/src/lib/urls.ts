const AMAZON_AFFILIATE_TAGS: Record<string, string> = {
  'amazon.co.uk': 'ukbestdeal02-21',
  'amazon.it': 'srzone00-21',
  'amazon.com': 'dealscoutus02-20',
  'amazon.de': 'dealscoutde-21',
  'amazon.fr': 'dealscoutus02-20',
  'amazon.es': 'dealscoutus02-20',
  'amazon.ca': 'dealscoutus02-20',
};

/**
 * Returns the product store URL with country-specific Amazon affiliate tag automatically appended.
 * - UK: tag=ukbestdeal02-21
 * - IT: tag=srzone00-21
 * - US: tag=dealscoutus02-20
 * - DE: tag=dealscoutde-21
 * - FR: tag=dealscoutus02-20
 * - ES: tag=dealscoutus02-20
 * - CA: tag=dealscoutus02-20
 */
export function getAutoEnglishUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  let url = rawUrl.trim();
  if (!url || url === '#') return '#';

  try {
    let parsed = new URL(url);
    
    // Unwrap Google Translate proxy if present
    if (parsed.hostname.includes('translate.google.') && parsed.searchParams.has('u')) {
      url = decodeURIComponent(parsed.searchParams.get('u') || url);
      parsed = new URL(url);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Append Amazon Affiliate Tag based on domain
    if (hostname.includes('amazon.')) {
      let affiliateTag = 'dealscoutus02-20'; // default fallback

      for (const [domain, tag] of Object.entries(AMAZON_AFFILIATE_TAGS)) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          affiliateTag = tag;
          break;
        }
      }

      parsed.searchParams.set('tag', affiliateTag);
      return parsed.toString();
    }

    return url;
  } catch (err) {
    return url;
  }
}
