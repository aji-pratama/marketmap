import React from 'react';

export interface BubbleIconProps {
  /** The cryptocurrency symbol / ticker (e.g. BTC, ETH, SOL, INJ, etc.) */
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
 * ----------------------------------------------------------------------------
 * CUSTOMIZABLE BUBBLE ICONS REGISTRY
 * ----------------------------------------------------------------------------
 * In case you want to change, replace, or add new bubble icons,
 * you can easily edit or add an entry in this dictionary!
 * 
 * Each key is the uppercase ticker (e.g. 'BTC', 'ETH', 'INJ', 'SOL').
 * The function returns inner SVG markup rendered inside a 32x32 viewBox.
 */
export const COIN_ICON_SVGS: Record<string, (colorHex: string) => string> = {
  BTC: () => `
    <circle cx="16" cy="16" r="15" fill="#F7931A"/>
    <path fill="#FFFFFF" d="M20.5 13.2c.4-2.5-1.5-3.8-4.1-4.7l.8-3.4-2.1-.5-.8 3.3c-.5-.1-1.1-.3-1.7-.4l.8-3.3-2.1-.5-.8 3.4c-.5-.1-1-.2-1.5-.3l-2.9-.7-.6 2.3s1.6.4 1.5.4c.9.2 1 .8.9 1.4l-.9 3.8c.1 0 .1 0 .2.1l-.2-.1-1.3 5.3c-.1.3-.4.7-1 .5 0 0-1.5-.4-1.5-.4l-1 2.5 2.7.7c.5.1 1 .3 1.5.4l-.8 3.5 2.1.5.8-3.4c.6.2 1.1.3 1.7.4l-.8 3.4 2.1.5.8-3.4c3.5.7 6.1.4 7.2-2.8.9-2.5 0-3.9-1.8-4.9 1.3-.3 2.3-1.2 2.6-3zm-4.6 7.4c-.6 2.6-5 1.2-6.4.8l1.1-4.6c1.4.3 5.9 1 5.3 3.8zm.7-7.4c-.6 2.4-4.2 1.2-5.4.9l1-4.2c1.2.3 5 .9 4.4 3.3z"/>
  `,

  ETH: () => `
    <circle cx="16" cy="16" r="15" fill="#627EEA"/>
    <path fill="#FFFFFF" fill-opacity="0.6" d="M16 4v8.9l7.5 3.3L16 4z"/>
    <path fill="#FFFFFF" d="M16 4L8.5 16.2l7.5-3.3V4z"/>
    <path fill="#FFFFFF" fill-opacity="0.6" d="M16 21.7v6.3l7.5-10.4L16 21.7z"/>
    <path fill="#FFFFFF" d="M16 28v-6.3L8.5 17.6 16 28z"/>
    <path fill="#FFFFFF" fill-opacity="0.2" d="M16 20.3l7.5-4.1L16 12.9v7.4z"/>
    <path fill="#FFFFFF" fill-opacity="0.6" d="M8.5 16.2l7.5 4.1v-7.4l-7.5 3.3z"/>
  `,

  SOL: () => `
    <circle cx="16" cy="16" r="15" fill="#000000"/>
    <path fill="url(#solGrad)" d="M8.5 19.8l12-3.2c.4-.1.7.2.7.6v.5c0 .3-.2.5-.5.6l-12 3.2c-.4.1-.7-.2-.7-.6v-.5c0-.3.2-.5.5-.6zm0-5.8l12-3.2c.4-.1.7.2.7.6v.5c0 .3-.2.5-.5.6l-12 3.2c-.4.1-.7-.2-.7-.6v-.5c0-.3.2-.5.5-.6zm12-4.6l-12 3.2c-.4.1-.7-.2-.7-.6v-.5c0-.3.2-.5.5-.6l12-3.2c.4-.1.7.2.7.6v.5c0 .3-.2.5-.5.6z"/>
    <defs>
      <linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00FFA3"/>
        <stop offset="100%" stopColor="#DC1FFF"/>
      </linearGradient>
    </defs>
  `,

  INJ: () => `
    <circle cx="16" cy="16" r="15" fill="#00182E"/>
    <path fill="#00D2FF" d="M16 7c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm4.2 13.8c-2.3 2.3-6.1 2.3-8.4 0-1.2-1.2-1.7-2.7-1.7-4.2h3c0 .8.3 1.5.9 2.1 1.2 1.2 3.1 1.2 4.3 0s1.2-3.1 0-4.3l-2.1-2.1 2.1-2.1c1.2 1.2 1.2 3.1 0 4.3 1.2 1.8 1.9 4.1 1.9 6.3z"/>
  `,

  BTW: () => `
    <circle cx="16" cy="16" r="15" fill="#052E16"/>
    <rect x="7" y="11" width="18" height="10" rx="4" fill="none" stroke="#22C55E" stroke-width="2.5"/>
    <circle cx="11.5" cy="16" r="2.5" fill="#22C55E"/>
    <circle cx="20.5" cy="16" r="2.5" fill="#22C55E"/>
  `,

  AKE: () => `
    <circle cx="16" cy="16" r="15" fill="#1E1035"/>
    <polygon points="16,6 26,24 6,24" fill="none" stroke="#A855F7" stroke-width="2.5"/>
    <circle cx="16" cy="18" r="2" fill="#A855F7"/>
  `,

  NIGHT: () => `
    <circle cx="16" cy="16" r="15" fill="#1C1917"/>
    <circle cx="16" cy="16" r="9" fill="none" stroke="#E7E5E4" stroke-width="2"/>
    <line x1="16" y1="16" x2="16" y2="10" stroke="#E7E5E4" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="16" x2="20" y2="16" stroke="#E7E5E4" stroke-width="2" stroke-linecap="round"/>
  `,

  PYTH: () => `
    <circle cx="16" cy="16" r="15" fill="#260F3F"/>
    <path fill="#A855F7" d="M16 6a10 10 0 1 0 10 10A10 10 0 0 0 16 6zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6zm0-9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z"/>
  `,

  NEAR: () => `
    <circle cx="16" cy="16" r="15" fill="#000000"/>
    <path fill="#00E676" d="M9.5 22.5V9.5h3.4l6.6 9.8V9.5h3v13h-3.4l-6.6-9.8v9.8H9.5z"/>
  `,

  APT: () => `
    <circle cx="16" cy="16" r="15" fill="#000000"/>
    <path fill="#22C55E" d="M16 6l-9 16h4.5l2-3.8h5l2 3.8H25L16 6zm0 8.5l1.6 3h-3.2l1.6-3z"/>
  `,

  FIL: () => `
    <circle cx="16" cy="16" r="15" fill="#0090FF"/>
    <path fill="#FFFFFF" d="M19.5 8H12v16h3.5v-6h3.5v-3.5h-3.5v-3h4V8z"/>
    <line x1="9" y1="14" x2="23" y2="14" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  `,

  ARB: () => `
    <circle cx="16" cy="16" r="15" fill="#1B4ADD"/>
    <path fill="#FFFFFF" d="M16 7l-7 14h3.5l1.8-3.6h3.4l1.8 3.6H23L16 7zm0 6.8l1.2 2.4h-2.4l1.2-2.4z"/>
  `,

  KAS: () => `
    <circle cx="16" cy="16" r="15" fill="#70C7BA"/>
    <path fill="#052E2B" d="M11 9h3v14h-3V9zm4 7l5-7h3.8l-5.6 7.2L24 23h-4l-5-7z"/>
  `,

  QNT: () => `
    <circle cx="16" cy="16" r="15" fill="#1C1C1E"/>
    <polygon points="16,6 25,11 25,21 16,26 7,21 7,11" fill="none" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="16" cy="16" r="3" fill="#FFFFFF"/>
  `,

  M: () => `
    <circle cx="16" cy="16" r="15" fill="#4A044E"/>
    <path fill="#C084FC" d="M8 22V10h3.5l4.5 6 4.5-6H24v12h-3v-7.5l-4.2 5.5h-1.6L11 14.5V22H8z"/>
  `,

  TAO: () => `
    <circle cx="16" cy="16" r="15" fill="#000000"/>
    <path fill="#FFFFFF" d="M9 10h14v3.5h-5.2v9h-3.6v-9H9V10z"/>
  `,

  AAVE: () => `
    <circle cx="16" cy="16" r="15" fill="#B6509E"/>
    <path fill="#FFFFFF" d="M16 8l-6 16h3.2l1.3-3.6h5l1.3 3.6H22L16 8zm0 8.2l1.4-4 1.4 4h-2.8z"/>
  `,

  PEPE: () => `
    <circle cx="16" cy="16" r="15" fill="#4C8A3E"/>
    <circle cx="12" cy="13" r="3.5" fill="#FFFFFF"/>
    <circle cx="20" cy="13" r="3.5" fill="#FFFFFF"/>
    <circle cx="12" cy="13" r="1.5" fill="#000000"/>
    <circle cx="20" cy="13" r="1.5" fill="#000000"/>
    <path fill="#FFFFFF" d="M10 20c2 2 10 2 12 0" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
  `,

  DOGE: () => `
    <circle cx="16" cy="16" r="15" fill="#C2A633"/>
    <path fill="#FFFFFF" d="M12 9h4.5c3.6 0 6 2.7 6 7s-2.4 7-6 7H12V9zm4 10.5c1.8 0 3-1.5 3-3.5s-1.2-3.5-3-3.5h-1.5v7H16zm-5-3.5h3.5v-1.5H11V16z"/>
  `,

  SHIB: () => `
    <circle cx="16" cy="16" r="15" fill="#FFA409"/>
    <polygon points="16,8 24,14 21,24 11,24 8,14" fill="#FFFFFF"/>
    <circle cx="13" cy="15" r="1.5" fill="#000000"/>
    <circle cx="19" cy="15" r="1.5" fill="#000000"/>
    <polygon points="16,18 18,20 14,20" fill="#000000"/>
  `,

  XRP: () => `
    <circle cx="16" cy="16" r="15" fill="#23292F"/>
    <path fill="#FFFFFF" d="M22.5 8.5h2l-5.6 5.5c-1.6 1.6-4.2 1.6-5.8 0L7.5 8.5h2l4.6 4.5c.8.8 2.1.8 3 0l5.4-4.5zm0 15h2l-5.6-5.5c-1.6-1.6-4.2-1.6-5.8 0l-5.6 5.5h2l4.6-4.5c.8-.8 2.1-.8 3 0l5.4 4.5z"/>
  `,

  SUI: () => `
    <circle cx="16" cy="16" r="15" fill="#4DA2FF"/>
    <path fill="#FFFFFF" d="M16 6.5c-3.2 4.4-6.5 9-6.5 12.5 0 3.6 2.9 6.5 6.5 6.5s6.5-2.9 6.5-6.5c0-3.5-3.3-8.1-6.5-12.5zm0 17.5c-2.5 0-4.5-2-4.5-4.5 0-2.4 2.2-5.8 4.5-8.8 2.3 3 4.5 6.4 4.5 8.8 0 2.5-2 4.5-4.5 4.5z"/>
  `,

  BNB: () => `
    <circle cx="16" cy="16" r="15" fill="#F3BA2F"/>
    <path fill="#FFFFFF" d="M16 7.5l3.2 3.2-1.5 1.5-1.7-1.7-1.7 1.7-1.5-1.5L16 7.5zm5.9 5.9l1.5-1.5 1.7 1.7-1.7 1.7-1.5-1.5 1.7-1.7.2 1.3zm-11.8 0l1.7-1.7 1.7 1.7-1.5 1.5-1.9-1.5zm5.9 1.8l2.3 2.3-2.3 2.3-2.3-2.3 2.3-2.3zm-4.7 4.7l1.5-1.5 1.7 1.7-1.7 1.7-1.5-1.9zm9.4 0l1.7 1.9-1.5 1.5-1.7-1.7 1.5-1.7zm-4.7 1.4l1.7 1.7-1.7 1.7-1.7-1.7 1.7-1.7z"/>
  `,

  PUMP: () => `
    <circle cx="16" cy="16" r="15" fill="#047857"/>
    <rect x="9" y="11" width="14" height="10" rx="5" fill="#FFFFFF"/>
    <rect x="9" y="11" width="7" height="10" rx="5" fill="#10B981"/>
  `,

  ADA: () => `
    <circle cx="16" cy="16" r="15" fill="#0033AD"/>
    <circle cx="16" cy="16" r="3.2" fill="#FFFFFF"/>
    <circle cx="16" cy="8" r="1.4" fill="#FFFFFF"/>
    <circle cx="16" cy="24" r="1.4" fill="#FFFFFF"/>
    <circle cx="8" cy="16" r="1.4" fill="#FFFFFF"/>
    <circle cx="24" cy="16" r="1.4" fill="#FFFFFF"/>
    <circle cx="10.3" cy="10.3" r="1.2" fill="#FFFFFF"/>
    <circle cx="21.7" cy="10.3" r="1.2" fill="#FFFFFF"/>
    <circle cx="10.3" cy="21.7" r="1.2" fill="#FFFFFF"/>
    <circle cx="21.7" cy="21.7" r="1.2" fill="#FFFFFF"/>
  `,

  AVAX: () => `
    <circle cx="16" cy="16" r="15" fill="#E84142"/>
    <path fill="#FFFFFF" d="M14.6 7.8c.6-1.1 2.2-1.1 2.8 0l7.8 14.5c.6 1.1-.2 2.5-1.4 2.5h-3.8c-.8 0-1.5-.4-1.9-1.1l-3.5-6.6-2 3.8h2.8l-1.4 2.6H8.2c-1.2 0-2-1.4-1.4-2.5l7.8-13.2z"/>
  `,

  LINK: () => `
    <circle cx="16" cy="16" r="15" fill="#375BD2"/>
    <path fill="#FFFFFF" d="M16 7.5l7.4 4.2v8.6L16 24.5l-7.4-4.2v-8.6L16 7.5zm4.8 11.2v-5.4l-4.8-2.7-4.8 2.7v5.4l4.8 2.7 4.8-2.7z"/>
  `,

  DOT: () => `
    <circle cx="16" cy="16" r="15" fill="#E6007A"/>
    <circle cx="16" cy="16" r="5" fill="#FFFFFF"/>
    <circle cx="16" cy="6" r="2.2" fill="#FFFFFF"/>
    <circle cx="16" cy="26" r="2.2" fill="#FFFFFF"/>
  `,

  UNI: () => `
    <circle cx="16" cy="16" r="15" fill="#FF007A"/>
    <path fill="#FFFFFF" d="M18.5 7.5c-1 3-4 6-7.5 7.5 3 0 6 2 7 5 1-2.5 3-4.5 6-5-3-1-5-4-5.5-7.5z"/>
  `,

  LTC: () => `
    <circle cx="16" cy="16" r="15" fill="#345D9D"/>
    <path fill="#FFFFFF" d="M12.5 8h3v10h5.5v2.8h-8.5V8zm-1.8 6.5l7-2.3.8 2.2-7 2.3-.8-2.2z"/>
  `,
};

function getDefaultMonogramSvg(sym: string, colorHex: string): string {
  const displaySym = sym.slice(0, 4);
  const fontSize = displaySym.length > 3 ? '10' : '12';
  return `
    <circle cx="16" cy="16" r="15" fill="${colorHex || '#3B82F6'}"/>
    <text x="16" y="21" font-family="-apple-system, system-ui, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="${fontSize}" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">${displaySym}</text>
  `;
}

/**
 * Returns a high-resolution SVG Data URL for any coin symbol.
 * This function is used by the Canvas Physics Engine so bubbles render
 * the exact same icons defined in this component!
 */
export function getBubbleIconDataUrl(symbol: string, colorHex: string = '#3B82F6'): string {
  const sym = symbol.toUpperCase();
  const customGenerator = COIN_ICON_SVGS[sym];
  const innerSvg = customGenerator ? customGenerator(colorHex) : getDefaultMonogramSvg(sym, colorHex);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${encodeURIComponent(innerSvg.trim())}</svg>`;
}

/**
 * Re-export getCryptoIconSvg for backwards compatibility
 */
export const getCryptoIconSvg = getBubbleIconDataUrl;

/**
 * React Component for rendering bubble icons anywhere in the UI.
 * 
 * Usage:
 * ```tsx
 * <BubbleIcon symbol="BTC" size={32} />
 * <BubbleIcon symbol={coin.symbol} colorHex={coin.colorHex} size={24} />
 * ```
 */
export const BubbleIcon: React.FC<BubbleIconProps> = ({
  symbol,
  colorHex = '#3B82F6',
  size = 24,
  className = '',
  customIconUrl,
}) => {
  const sym = symbol.toLowerCase().trim();
  const cdnUrl1 = `https://assets.coincap.io/assets/icons/${sym}@2x.png`;
  const cdnUrl2 = `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${sym}.png`;
  const fallbackSvg = getBubbleIconDataUrl(symbol, colorHex);

  const [src, setSrc] = React.useState<string>(customIconUrl || cdnUrl1);
  const [attempt, setAttempt] = React.useState<number>(0);

  React.useEffect(() => {
    setSrc(customIconUrl || cdnUrl1);
    setAttempt(0);
  }, [symbol, customIconUrl]);

  const handleError = () => {
    if (attempt === 0) {
      setAttempt(1);
      setSrc(cdnUrl2);
    } else if (attempt === 1) {
      setAttempt(2);
      setSrc(fallbackSvg);
    }
  };

  return (
    <img
      src={src}
      alt={symbol}
      onError={handleError}
      style={{ width: size, height: size }}
      className={`rounded-full object-contain shrink-0 ${className}`}
      loading="lazy"
    />
  );
};

export const CryptoIcon = BubbleIcon;
