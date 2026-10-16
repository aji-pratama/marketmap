import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CryptoCoin, Currency, ThemeMode, Timeframe } from '../types/crypto';
import { formatPrice, formatPercent, formatNumber } from '../data/cryptoData';
import { 
  Star, ExternalLink, TrendingUp, TrendingDown,
  LineChart
} from 'lucide-react';
import { BubbleIcon } from './BubbleIcon';

interface CoinModalProps {
  coin: CryptoCoin;
  currency: Currency;
  isFavorite: boolean;
  theme?: ThemeMode;
  timeframe?: Timeframe;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
}

export const CoinModal: React.FC<CoinModalProps> = ({
  coin,
  currency,
  isFavorite,
  theme = 'dark',
  timeframe = '24h',
  onToggleFavorite,
  onClose,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; price: number } | null>(null);

  // Draggable window state: initialize immediately to exact screen center
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window === 'undefined') return null;
    const modalWidth = Math.min(448, window.innerWidth - 32);
    const modalHeight = Math.min(620, window.innerHeight - 40);
    const centerX = Math.max(16, (window.innerWidth - modalWidth) / 2);
    const centerY = Math.max(20, (window.innerHeight - modalHeight) / 2);
    return { x: Math.round(centerX), y: Math.round(centerY) };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);

  const isDark = theme === 'dark';
  
  // Active timeframe calculations
  const activeTfChange = coin.changes[timeframe] ?? (coin.changes['24h'] || 0);
  const isActiveTfGain = activeTfChange >= 0;

  // 24h Low/High progress
  const low = coin.low24h;
  const high = coin.high24h;
  const range = high - low || 1;
  const currentPos = Math.max(0, Math.min(100, ((coin.price - low) / range) * 100));

  const timeframes: { label: string; key: Timeframe; val: number }[] = [
    { label: '1H', key: '1h', val: coin.changes['1h'] ?? 0 },
    { label: '24H', key: '24h', val: coin.changes['24h'] ?? 0 },
    { label: '7D', key: '7d', val: coin.changes['7d'] ?? 0 },
    { label: '30D', key: '30d', val: coin.changes['30d'] ?? 0 },
    { label: '1Y', key: '1y', val: coin.changes['1y'] ?? 0 },
  ];

  const tfTitleMap: Record<Timeframe, string> = {
    '1h': '1-Hour Price Trend',
    '24h': '24-Hour Price Trend',
    '7d': '7-Day Price Trend',
    '30d': '30-Day Price Trend',
    '1y': '1-Year Price Trend',
  };

  // Dynamic sparkline data adapted to the active timeframe
  const chartPoints = useMemo(() => {
    const rawSpark = coin.sparkline && coin.sparkline.length >= 8 ? coin.sparkline : [coin.price * 0.98, coin.price];
    const tfChange = coin.changes[timeframe] ?? 0;
    const startPrice = Math.max(0.000001, coin.price / (1 + tfChange / 100));
    const endPrice = coin.price;

    if (timeframe === '24h') {
      return rawSpark;
    }

    if (timeframe === '1h') {
      const slice = rawSpark.slice(-8);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const span = max - min || 1;
      return slice.map((val, idx) => {
        const progress = idx / (slice.length - 1);
        const baseline = startPrice + (endPrice - startPrice) * progress;
        const wiggle = ((val - min) / span - 0.5) * (Math.abs(endPrice - startPrice) * 0.4 || endPrice * 0.003);
        return Math.max(0.000001, baseline + wiggle);
      });
    }

    // 7d, 30d, 1y: shape sparkline baseline around the timeframe trajectory
    const count = rawSpark.length;
    const min = Math.min(...rawSpark);
    const max = Math.max(...rawSpark);
    const span = max - min || 1;
    return rawSpark.map((val, idx) => {
      const progress = idx / (count - 1);
      const baseline = startPrice + (endPrice - startPrice) * Math.pow(progress, 0.95);
      const variance = ((val - min) / span - 0.5) * (Math.abs(endPrice - startPrice) * 0.35 || endPrice * 0.02);
      return Math.max(0.000001, baseline + variance);
    });
  }, [coin, timeframe]);

  // Direct Exchange & Chart CTAs with authentic official logos
  const exchangeLinks = [
    {
      name: 'TradingView',
      shortLabel: 'TV Chart',
      url: `https://www.tradingview.com/chart/?symbol=BINANCE:${coin.symbol}USDT`,
      accent: '#2962ff',
      renderLogo: () => (
        <svg className="w-4 h-4 shrink-0 rounded-xs" viewBox="0 0 36 28" fill="none">
          <rect width="36" height="28" rx="4" fill="#131722" />
          <path d="M13.5 21H7.5V7h6v14zm8-10.5h-6V7h6v3.5zm0 10.5h-6v-8.5h6v8.5zm8-15h-6V7h6v0zm0 15h-6V6h6v15z" fill="#2962FF"/>
        </svg>
      ),
    },
    {
      name: 'Binance',
      shortLabel: 'Binance',
      url: `https://www.binance.com/en/trade/${coin.symbol}_USDT?type=spot`,
      accent: '#f0b90b',
      renderLogo: () => (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#F0B90B">
          <path d="M12 2.5l3.2 3.2-3.2 3.2-3.2-3.2L12 2.5zm-5.7 5.7l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm11.4 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zM12 8.9l3.2 3.2-3.2 3.2-3.2-3.2L12 8.9zm-5.7 5.7l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm11.4 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zM12 15.3l3.2 3.2-3.2 3.2-3.2-3.2L12 15.3z"/>
        </svg>
      ),
    },
    {
      name: 'Bybit',
      shortLabel: 'Bybit',
      url: `https://www.bybit.com/en/trade/spot/${coin.symbol}/USDT`,
      accent: '#f7a600',
      renderLogo: () => (
        <svg className="w-4 h-4 shrink-0 rounded-xs" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#17181E"/>
          <path d="M5.5 5h6.2a4.2 4.2 0 013 7.1A4.5 4.5 0 019 19H5.5V5z" fill="#F7A600"/>
          <path d="M9 8.2h2.8a1.6 1.6 0 010 3.2H9V8.2zm0 4.8h3.2a1.8 1.8 0 010 3.6H9V13z" fill="#17181E"/>
        </svg>
      ),
    },
    {
      name: 'Bitget',
      shortLabel: 'Bitget',
      url: `https://www.bitget.com/spot/${coin.symbol}USDT`,
      accent: '#00f0ff',
      renderLogo: () => (
        <svg className="w-4 h-4 shrink-0 rounded-xs" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#0E1726"/>
          <path d="M7 15l5-6 5 6" stroke="#00F0FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 10l5-4 5 4" stroke="#00F0FF" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  // Initialize position on mount: exact center of screen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const modalWidth = Math.min(448, window.innerWidth - 32);
    const modalHeight = Math.min(620, window.innerHeight - 40);
    const centerX = Math.max(16, (window.innerWidth - modalWidth) / 2);
    const centerY = Math.max(20, (window.innerHeight - modalHeight) / 2);
    setPosition({ x: Math.round(centerX), y: Math.round(centerY) });
  }, []);

  // Keyboard Escape listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Window dragging movement logic
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const winW = windowRef.current?.offsetWidth || 400;
      const winH = windowRef.current?.offsetHeight || 500;
      
      const maxX = Math.max(16, window.innerWidth - winW - 12);
      const maxY = Math.max(16, window.innerHeight - winH - 12);

      const newX = Math.max(8, Math.min(maxX, dragStartRef.current.startX + dx));
      const newY = Math.max(8, Math.min(maxY, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      const winW = windowRef.current?.offsetWidth || 400;
      const winH = windowRef.current?.offsetHeight || 500;

      const maxX = Math.max(16, window.innerWidth - winW - 12);
      const maxY = Math.max(16, window.innerHeight - winH - 12);

      const newX = Math.max(8, Math.min(maxX, dragStartRef.current.startX + dx));
      const newY = Math.max(8, Math.min(maxY, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const startDrag = (clientX: number, clientY: number) => {
    if (!position) return;
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: position.x,
      startY: position.y,
    };
    setIsDragging(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop: clicking outside closes the modal automatically */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150" 
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      {/* Classic Mac OS Draggable Floating Inspector Window */}
      <div 
        ref={windowRef}
        style={
          position
            ? {
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                margin: 0,
                zIndex: 51,
              }
            : undefined
        }
        className={`w-[calc(100vw-32px)] max-w-sm sm:max-w-md rounded-xl flex flex-col max-h-[88vh] overflow-hidden shadow-2xl transition-shadow ${
          isDragging ? 'shadow-3xl ring-2 ring-emerald-500/50 select-none' : ''
        } ${
          isDark 
            ? 'macos-window bg-[#22242e] text-slate-100 border border-white/[0.14]' 
            : 'macos-window-light bg-[#f8f9fb] text-slate-900 border border-black/[0.1]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classic Mac OS Window Titlebar - DRAG HANDLE */}
        <div 
          className={`flex items-center justify-between px-3.5 py-2.5 shrink-0 select-none cursor-grab active:cursor-grabbing border-b transition-colors ${
            isDark 
              ? 'macos-titlebar-dark border-white/[0.12]' 
              : 'macos-titlebar-light border-black/[0.08]'
          }`}
          onMouseDown={(e) => {
            if (e.button === 0 && !(e.target as HTMLElement).closest('button, a')) {
              startDrag(e.clientX, e.clientY);
            }
          }}
          onTouchStart={(e) => {
            if (e.touches.length > 0 && !(e.target as HTMLElement).closest('button, a')) {
              startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          title="Drag to move window"
        >
          {/* Traffic Light Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              title="Close window (Esc)"
              className="group relative w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#4c0000] leading-none mb-0.5">
                ×
              </span>
            </button>
            <button
              onClick={onClose}
              title="Minimize window"
              className="group relative w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#5c3c00] leading-none mb-0.5">
                −
              </span>
            </button>
            <button
              title="Zoom window"
              className="group relative w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-default"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold text-[#0b4713] leading-none mb-0.5">
                +
              </span>
            </button>
          </div>

          {/* Centered Document / Asset Title & Subtle Mac Drag Grip */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-[200px] sm:max-w-xs pointer-events-none">
            <BubbleIcon 
              symbol={coin.symbol} 
              colorHex={coin.colorHex} 
              size={15} 
              className="shrink-0" 
            />
            <span className="text-xs font-semibold tracking-tight truncate">
              {coin.name} ({coin.symbol})
            </span>
            <span className={`text-[9px] font-mono opacity-40 ml-1 hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              ⋮⋮
            </span>
          </div>

          {/* Favorite Toggle Button */}
          <button
            onClick={() => onToggleFavorite(coin.id)}
            title={isFavorite ? 'Favorite (In Favorites)' : 'Add to favorites (⭐)'}
            className={`p-1 rounded transition-colors ${
              isFavorite 
                ? 'text-amber-400 hover:text-amber-300' 
                : isDark 
                  ? 'text-slate-400 hover:text-slate-200' 
                  : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Content Body with Generous Typography & Mac OS Insets */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4.5 text-sm">
          {/* Header Summary Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <BubbleIcon 
                  symbol={coin.symbol} 
                  colorHex={coin.colorHex} 
                  size={42} 
                  className={`p-1 shrink-0 rounded-xl shadow-sm ${isDark ? 'bg-black/40' : 'bg-slate-200/70'}`} 
                />
                {isFavorite && (
                  <span 
                    title="Favorite!" 
                    className="absolute -top-1 -right-1 text-xs leading-none select-none drop-shadow-xs"
                  >
                    ⭐
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 truncate">
                  <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight">
                    {coin.symbol}
                  </span>
                  <span className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {coin.name}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-mono mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <span className="font-semibold">Rank #{coin.rank}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{coin.category}</span>
                  {isFavorite && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                        ⭐ Favorite
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Active Timeframe Change Badge */}
            <div className="text-right shrink-0">
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums">
                {formatPrice(coin.price, currency)}
              </div>
              <div className={`inline-flex items-center gap-1 text-sm font-bold font-mono ${
                isActiveTfGain ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {isActiveTfGain ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{formatPercent(activeTfChange)}</span>
                <span className="text-[11px] opacity-75 font-semibold">({timeframe.toUpperCase()})</span>
              </div>
            </div>
          </div>

          {/* 24h Range Bar - Mac OS Style Meter */}
          <div>
            <div className={`flex justify-between text-xs font-mono font-medium mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <span>24h L: <span className={isDark ? 'text-slate-200 font-semibold' : 'text-slate-700 font-semibold'}>{formatPrice(low, currency)}</span></span>
              <span>24h H: <span className={isDark ? 'text-slate-200 font-semibold' : 'text-slate-700 font-semibold'}>{formatPrice(high, currency)}</span></span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-white/[0.08]' : 'bg-slate-200'
            }`}>
              <div 
                className="h-full bg-linear-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full" 
                style={{ width: `${currentPos}%` }} 
              />
            </div>
          </div>

          {/* Dynamic Timeframe Sparkline Chart */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <LineChart className={`w-3.5 h-3.5 ${isActiveTfGain ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span>{tfTitleMap[timeframe] || `${timeframe.toUpperCase()} Price Trend`}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  isActiveTfGain 
                    ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                }`}>
                  {formatPercent(activeTfChange)}
                </span>
              </div>
              {hoveredPoint && (
                <span className={`font-mono text-xs font-bold tabular-nums ${
                  isActiveTfGain ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatPrice(hoveredPoint.price, currency)}
                </span>
              )}
            </div>

            <div className={`w-full h-28 rounded-lg p-2.5 relative flex items-center justify-center ${
              isDark ? 'macos-inset-dark' : 'macos-inset-light'
            }`}>
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`grad-${coin.id}-${timeframe}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isActiveTfGain ? '#22c55e' : '#f43f5e'} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={isActiveTfGain ? '#22c55e' : '#f43f5e'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {(() => {
                  const pts = chartPoints.map((val, idx) => ({
                    x: (idx / (chartPoints.length - 1)) * 300,
                    price: val,
                  }));
                  const minP = Math.min(...chartPoints);
                  const maxP = Math.max(...chartPoints);
                  const pRange = maxP - minP || 1;

                  const mapped = pts.map((p) => ({
                    x: p.x,
                    y: 70 - ((p.price - minP) / pRange) * 60,
                    price: p.price,
                  }));

                  const dPath = mapped.reduce(
                    (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), 
                    ''
                  );
                  const areaPath = `${dPath} L 300 80 L 0 80 Z`;

                  return (
                    <>
                      <path d={areaPath} fill={`url(#grad-${coin.id}-${timeframe})`} />
                      <path 
                        d={dPath} 
                        fill="none" 
                        stroke={isActiveTfGain ? '#22c55e' : '#f43f5e'} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      {mapped.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint?.index === i ? 4.5 : 1.8}
                          className={`cursor-pointer transition-all ${
                            isDark ? 'fill-white stroke-slate-900' : 'fill-slate-900 stroke-white'
                          } stroke-1`}
                          onMouseEnter={() => setHoveredPoint({ index: i, price: pt.price })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Performance Breakdown - Unified Segmented Bar */}
          <div>
            <div className={`text-xs uppercase tracking-wider font-semibold mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Performance by Timeframe
            </div>
            <div className={`grid grid-cols-5 rounded-lg overflow-hidden divide-x ${
              isDark 
                ? 'macos-inset-dark divide-white/[0.06]' 
                : 'macos-inset-light divide-black/[0.08]'
            }`}>
              {timeframes.map(({ label, key, val }) => {
                const gain = val >= 0;
                const isSelected = key === timeframe;
                return (
                  <div 
                    key={label} 
                    className={`py-2 px-1 text-center transition-colors ${
                      isSelected 
                        ? isDark ? 'bg-white/[0.08] ring-1 ring-inset ring-white/20' : 'bg-black/[0.05] ring-1 ring-inset ring-black/10'
                        : ''
                    }`}
                  >
                    <span className={`text-xs block mb-0.5 font-bold ${
                      isSelected 
                        ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                        : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {label} {isSelected && '•'}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${gain ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatPercent(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Fundamentals Sheet */}
          <div>
            <div className={`text-xs uppercase tracking-wider font-semibold mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Market Fundamentals
            </div>
            <div className={`p-3.5 rounded-lg grid grid-cols-2 gap-x-4 gap-y-3 ${
              isDark ? 'macos-inset-dark' : 'macos-inset-light'
            }`}>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Market Cap
                </span>
                <span className="text-sm font-bold font-mono tabular-nums">
                  {formatNumber(coin.marketCap, currency)}
                </span>
              </div>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  24h Volume
                </span>
                <span className="text-sm font-bold font-mono tabular-nums">
                  {formatNumber(coin.volume24h, currency)}
                </span>
              </div>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Circulating Supply
                </span>
                <span className="text-sm font-bold font-mono tabular-nums truncate block">
                  {formatNumber(coin.circulatingSupply, 'USD', true).slice(1)} {coin.symbol}
                </span>
              </div>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  All-Time High
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold font-mono tabular-nums">
                    {formatPrice(coin.ath, currency)}
                  </span>
                  <span className="text-xs font-bold font-mono tabular-nums text-rose-500">
                    {coin.athChangePercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Requested Trade & Chart CTAs with OFFICIAL LOGOS */}
          <div className="pt-1 space-y-1.5">
            <div className={`text-xs uppercase tracking-wider font-semibold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Trade & Live Charts
            </div>
            <div className="grid grid-cols-2 gap-2">
              {exchangeLinks.map((ex) => (
                <a
                  key={ex.name}
                  href={ex.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium inline-flex items-center justify-between transition-all group ${
                    isDark 
                      ? 'macos-btn-dark text-slate-100 hover:text-white hover:border-slate-500' 
                      : 'macos-btn-light text-slate-800 hover:text-slate-900 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {ex.renderLogo()}
                    <span className="truncate font-semibold">{ex.name}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 shrink-0 ml-1 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
