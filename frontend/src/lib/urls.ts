/**
 * Returns the original clean product store URL.
 * If a URL was previously wrapped in Google Translate, unwraps it back to the original URL.
 */
export function getAutoEnglishUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  const url = rawUrl.trim();
  if (!url || url === '#') return '#';

  try {
    const parsed = new URL(url);
    
    // Unwrap Google Translate proxy if present
    if (parsed.hostname.includes('translate.google.') && parsed.searchParams.has('u')) {
      return decodeURIComponent(parsed.searchParams.get('u') || url);
    }

    return url;
  } catch (err) {
    return url;
  }
}
