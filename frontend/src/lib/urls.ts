/**
 * Returns the product store URL with country-specific Amazon affiliate tag automatically appended.
 * Also strips Amazon Creator SiteStripe redirect parameters (ar_su, creatorsDisableRedirect, etc.)
 * that previously forced cross-country redirects.
 *
 * Mappings:
 * - UK: tag=ukbestdeal02-21
 * - IT: tag=srzone00-21
 * - US: tag=dealscoutus02-20
 * - DE: tag=dealscoutde-21
 * - FR: tag=dealscoutus02-20
 * - ES: tag=dealscoutus02-20
 * - CA: tag=dealscoutus02-20
 */
export function getAutoEnglishUrl(rawUrl?: string | null, countryCode?: string): string {
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

    // Strip Amazon SiteStripe/Creator redirect parameters that cause forced cross-country redirects
    parsed.searchParams.delete('ar_su');
    parsed.searchParams.delete('ar_srct');
    parsed.searchParams.delete('creatorsDisableRedirect');
    parsed.searchParams.delete('ar_mt');
    parsed.searchParams.delete('linkCode');

    const hostname = parsed.hostname.toLowerCase();
    const upperCountry = (countryCode || '').toUpperCase();

    // Append Amazon Affiliate Tag based on domain / country code
    if (hostname.includes('amazon.')) {
      let affiliateTag = 'dealscoutus02-20'; // default fallback

      if (hostname.endsWith('.co.uk') || hostname.endsWith('.uk') || upperCountry === 'UK' || upperCountry === 'GB') {
        affiliateTag = 'ukbestdeal02-21';
      } else if (hostname.endsWith('.it') || upperCountry === 'IT') {
        affiliateTag = 'srzone00-21';
      } else if (hostname.endsWith('.de') || upperCountry === 'DE') {
        affiliateTag = 'dealscoutde-21';
      } else if (hostname.endsWith('.fr') || upperCountry === 'FR') {
        affiliateTag = 'dealscoutus02-20';
      } else if (hostname.endsWith('.es') || upperCountry === 'ES') {
        affiliateTag = 'dealscoutus02-20';
      } else if (hostname.endsWith('.ca') || upperCountry === 'CA') {
        affiliateTag = 'dealscoutus02-20';
      } else if (hostname.endsWith('.com') || upperCountry === 'US') {
        affiliateTag = 'dealscoutus02-20';
      }

      parsed.searchParams.set('tag', affiliateTag);
      return parsed.toString();
    }

    return url;
  } catch (err) {
    return url;
  }
}
