import React from 'react';

export interface BubbleIconProps {
  /** The IDX stock ticker (e.g. BBCA, BBRI, BMRI, TLKM, etc.) */
  symbol: string;
  /** Optional custom color for background / accents */
  colorHex?: string;
  /** Dimension size in pixels or CSS units (default: 24) */
  size?: number | string;
  /** Optional CSS classes */
  className?: string;
  /** Optional custom image URL to override the SVG */
  customIconUrl?: string;
}

/**
 * Returns candidate logo URLs for Indonesian Stock Exchange (IDX) companies
 * Prioritizes Stockbit high-res company logo CDN, with graceful fallbacks.
 */
export function getStockLogoUrls(symbol: string): string[] {
  const sym = symbol.toUpperCase().trim();
  return [
    `https://assets.stockbit.com/logos/companies/${sym}.png`,
  ];
}

/**
 * High-definition crisp vector SVG monogram badge generator for IDX stocks.
 * Renders bold ticker typography on a brand-colored disc.
 */
export function getDefaultMonogramSvg(sym: string, colorHex: string): string {
  const displaySym = sym.slice(0, 4);
  const fontSize = displaySym.length > 3 ? '10' : '12';
  return `
    <circle cx="16" cy="16" r="15" fill="${colorHex || '#00529C'}"/>
    <text x="16" y="21" font-family="-apple-system, system-ui, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="${fontSize}" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">${displaySym}</text>
  `;
}

/**
 * Returns a high-resolution SVG Data URL for any stock symbol.
 * Used as reliable fallback when image logos fail to load.
 */
export function getBubbleIconDataUrl(symbol: string, colorHex: string = '#00529C'): string {
  const sym = symbol.toUpperCase().trim();
  const innerSvg = getDefaultMonogramSvg(sym, colorHex);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${encodeURIComponent(innerSvg.trim())}</svg>`;
}

export const getCryptoIconSvg = getBubbleIconDataUrl;

/**
 * React Component for rendering stock logos with seamless fallback to monograms.
 */
export const BubbleIcon: React.FC<BubbleIconProps> = ({
  symbol,
  colorHex = '#00529C',
  size = 24,
  className = '',
  customIconUrl,
}) => {
  const sym = symbol.toUpperCase().trim();
  const primaryLogoUrl = customIconUrl || getStockLogoUrls(sym)[0];
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [sym, customIconUrl]);

  if (!hasError) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`rounded-full overflow-hidden bg-white/95 flex items-center justify-center shrink-0 shadow-xs border border-white/20 p-0.5 ${className}`}
      >
        <img
          src={primaryLogoUrl}
          alt={sym}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain rounded-full"
          loading="lazy"
        />
      </div>
    );
  }

  const displaySym = sym.slice(0, 4);
  const fontSize = displaySym.length > 3 ? 'text-[9px]' : 'text-[11px]';

  return (
    <div
      style={{ width: size, height: size, backgroundColor: colorHex }}
      className={`rounded-full flex items-center justify-center text-white font-extrabold tracking-tight shrink-0 shadow-xs select-none ${fontSize} ${className}`}
    >
      {displaySym}
    </div>
  );
};

export const CryptoIcon = BubbleIcon;
