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
  img.crossOrigin = 'anonymous';

  const candidates: string[] = [];
  if (iconUrl && iconUrl.startsWith('http')) {
    candidates.push(iconUrl);
  }
  candidates.push(...getStockLogoUrls(key));

  let attempt = 0;

  img.onerror = () => {
    attempt++;
    if (attempt < candidates.length) {
      img.src = candidates[attempt];
    } else {
      img.src = getBubbleIconDataUrl(key, colorHex);
    }
  };

  img.src = candidates[0] || getBubbleIconDataUrl(key, colorHex);
  iconImageCache.set(cacheKey, img);
  return img;
}
