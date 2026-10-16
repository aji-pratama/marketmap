import React from 'react';

interface CryptoApplesLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const CryptoApplesLogo: React.FC<CryptoApplesLogoProps> = ({
  size = 28,
  className = '',
  showText = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Clean Crisp Vector Apple with Candlestick Stem (No shine, no shadow) */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Candlestick Stem */}
          <line x1="50" y1="4" x2="50" y2="12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <rect x="46" y="12" width="8" height="14" rx="2" fill="#10b981" />
          <line x1="50" y1="26" x2="50" y2="32" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

          {/* Leaf: Sleek upward leaf */}
          <path
            d="M 54 22 C 65 11 78 13 85 20 C 85 29 74 35 55 27 Z"
            fill="#10b981"
          />

          {/* Apple Main Body - Pure Clean Silhouette */}
          <path
            d="M 50 34
               C 42 26, 24 26, 15 38
               C 4 52, 6 74, 24 88
               C 34 96, 44 94, 50 90
               C 56 94, 66 96, 76 88
               C 94 74, 96 52, 85 38
               C 76 26, 58 26, 50 34 Z"
            fill="#10b981"
          />
        </svg>
      </div>

      {/* Brand Wordmark Typography - Apple San Francisco Typeface */}
      {showText && (
        <div 
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="flex items-center text-sm sm:text-base font-semibold tracking-[-0.03em] leading-none select-none"
        >
          <span className="text-white">Map</span>
          <span className="text-emerald-400 font-bold ml-0.5">
            Saham
          </span>
        </div>
      )}
    </div>
  );
};
