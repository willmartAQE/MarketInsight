/**
 * Returns the product store URL with country-specific Amazon affiliate tag automatically appended.
 * Also transforms broken legacy URL formats (such as Sears legacy /p-0... 404 links) into active search pages.
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

    const hostname = parsed.hostname.toLowerCase();

    // 1. Sears store link fix: convert legacy /p-0... 404 URLs to active Sears navigation search
    if (hostname.includes('sears.com')) {
      if (parsed.pathname.includes('/p-') || parsed.pathname.endsWith('P')) {
        const pathSegments = parsed.pathname.split('/').filter(Boolean);
        const rawTitle = pathSegments[0] || 'appliance';
        const cleanTitle = rawTitle.replace(/-/g, ' ').replace(/p\s*0[0-9]+.*$/i, '').trim();
        return `https://www.sears.com/nav/search?keyword=${encodeURIComponent(cleanTitle)}`;
      }
    }

    // 2. Best Buy store links: convert any searchpage.jsp links to direct PDPs & append intl=nosplash for international visitors
    if (hostname.includes('bestbuy.com')) {
      if (parsed.pathname.includes('/searchpage.jsp')) {
        const st = (parsed.searchParams.get('st') || '').toLowerCase();
        if (st.includes('macbook') || st.includes('m2')) {
          return 'https://www.bestbuy.com/site/apple-macbook-air-13-6-laptop-m2-chip-8gb-memory-256gb-ssd-midnight/6509650.p?skuId=6509650&intl=nosplash';
        }
        if (st.includes('playstation') || st.includes('ps5') || st.includes('sony')) {
          return 'https://www.bestbuy.com/site/sony-playstation-5-digital-edition-console-slim/6566042.p?skuId=6566042&intl=nosplash';
        }
        if (st.includes('du7200') || st.includes('samsung')) {
          return 'https://www.bestbuy.com/site/samsung-65-class-du7200-series-crystal-uhd-4k-smart-tv/6575138.p?skuId=6575138&intl=nosplash';
        }
        if (st.includes('bose') || st.includes('quietcomfort')) {
          return 'https://www.bestbuy.com/site/bose-quietcomfort-wireless-noise-cancelling-headphones-black/6553818.p?skuId=6553818&intl=nosplash';
        }
      }
      parsed.searchParams.set('intl', 'nosplash');
      return parsed.toString();
    }

    // 3. El Corte Inglés store links: convert any search query URLs to direct PDPs
    if (hostname.includes('elcorteingles.es')) {
      if (parsed.pathname.includes('/buscar/')) {
        const query = (parsed.searchParams.get('s') || '').toLowerCase();
        if (query.includes('smart tv lg') || query.includes('lg oled')) {
          return 'https://www.elcorteingles.es/electronica/A52391295-tv-oled-1397-cm-55-lg-oled55b46la-4k-hdr-smart-tv/?color=Negro';
        }
        if (query.includes('iphone 15') || query.includes('apple iphone')) {
          return 'https://www.elcorteingles.es/electronica/A49309623-apple-iphone-15-128gb-negro/';
        }
        if (query.includes('taurus') || query.includes('mycook')) {
          return 'https://www.elcorteingles.es/electrodomesticos/A46023884-8414234231215-pr-robot-de-cocina-taurus-mycook-next-con-conexion-wi-fi-integrada-blanco/';
        }
      }
      return parsed.toString();
    }

    // 4. Amazon store links: strip SiteStripe redirect params and set country affiliate tag
    if (hostname.includes('amazon.')) {
      parsed.searchParams.delete('ar_su');
      parsed.searchParams.delete('ar_srct');
      parsed.searchParams.delete('creatorsDisableRedirect');
      parsed.searchParams.delete('ar_mt');
      parsed.searchParams.delete('linkCode');

      const upperCountry = (countryCode || '').toUpperCase();
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
