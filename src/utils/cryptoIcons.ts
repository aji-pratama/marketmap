import { getBubbleIconDataUrl, getStockLogoUrls } from '../components/BubbleIcon';

const iconImageCache = new Map<string, HTMLImageElement>();

/**
 * Loads an official IDX stock brand icon for HTML5 Canvas rendering.
 * Priority:
 * 1. Explicit iconUrl if provided
 * 2. High-resolution Stockbit IDX Company Logo CDN
 * 3. Crisp Vector SVG Monogram Data URL Fallback
 */
export function loadCryptoCanvasIcon(
  symbol: string, 
  colorHex: string = '#00529C',
  iconUrl?: string
): HTMLImageElement {
  const key = symbol.toUpperCase().trim();
  const cacheKey = iconUrl ? `${key}:${iconUrl}` : `${key}:${colorHex}`;
  const cached = iconImageCache.get(cacheKey);
  if (cached) return cached;

  const img = new Image();

  const candidates: string[] = [];
  if (iconUrl && iconUrl.startsWith('http')) {
    candidates.push(iconUrl);
  }
  candidates.push(...getStockLogoUrls(key));

  let attempt = 0;

  const setNextSrc = (index: number) => {
    if (index < candidates.length) {
      const nextUrl = candidates[index];
      // For cross-origin external URLs, set anonymous; for same-origin (/api/logo), omit or keep anonymous
      if (nextUrl.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      } else {
        img.crossOrigin = 'anonymous';
      }
      img.src = nextUrl;
    } else {
      img.removeAttribute('crossorigin');
      img.src = getBubbleIconDataUrl(key, colorHex);
    }
  };

  img.onerror = () => {
    attempt++;
    setNextSrc(attempt);
  };

  setNextSrc(0);
  iconImageCache.set(cacheKey, img);
  return img;
}
