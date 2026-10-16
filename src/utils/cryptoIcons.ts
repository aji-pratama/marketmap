import { getBubbleIconDataUrl } from '../components/BubbleIcon';

/**
 * High-Definition Official Crypto Brand Icon Provider
 * Sources real retina brand logos from CoinGecko icon URLs, with reliable CDN fallbacks.
 */

const iconImageCache = new Map<string, HTMLImageElement>();

export function getCryptoIconUrls(symbol: string): string[] {
  const sym = symbol.toLowerCase().trim();
  return [
    `https://assets.coincap.io/assets/icons/${sym}@2x.png`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${sym}.png`,
  ];
}

/**
 * Loads an official crypto brand icon for HTML5 Canvas rendering.
 * Priority:
 * 1. Live CoinGecko / API icon URL (most accurate & comprehensive)
 * 2. CoinCap retina 2x CDN
 * 3. SpotHQ Cryptocurrency Icons CDN
 * 4. High-quality vector SVG data URL fallback
 */
export function loadCryptoCanvasIcon(
  symbol: string, 
  colorHex: string = '#3B82F6',
  iconUrl?: string
): HTMLImageElement {
  const key = symbol.toUpperCase().trim();
  const cacheKey = iconUrl ? `${key}:${iconUrl}` : key;
  const cached = iconImageCache.get(cacheKey);
  if (cached) return cached;

  const img = new Image();
  img.crossOrigin = 'anonymous';

  const candidateUrls: string[] = [];
  if (iconUrl && iconUrl.startsWith('http')) {
    candidateUrls.push(iconUrl);
  }
  candidateUrls.push(...getCryptoIconUrls(key));

  let attempt = 0;

  img.onerror = () => {
    attempt++;
    if (attempt < candidateUrls.length) {
      img.src = candidateUrls[attempt];
    } else {
      // Final fallback to crisp vector SVG
      img.src = getBubbleIconDataUrl(key, colorHex);
    }
  };

  img.src = candidateUrls[0] || getBubbleIconDataUrl(key, colorHex);
  iconImageCache.set(cacheKey, img);
  return img;
}
