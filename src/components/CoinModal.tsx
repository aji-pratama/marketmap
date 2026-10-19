import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CryptoCoin, Currency, ThemeMode, Timeframe } from '../types/crypto';
import { formatPrice, formatPercent, formatNumber } from '../data/cryptoData';
import { 
  Star, ExternalLink, LineChart, Loader2
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
  onSelectTimeframe?: (tf: Timeframe) => void;
  onUpdateCoinChanges?: (symbol: string, changes: Partial<Record<Timeframe, number>>) => void;
}

export const CoinModal: React.FC<CoinModalProps> = ({
  coin,
  currency,
  isFavorite,
  theme = 'dark',
  timeframe: initialTimeframe = '1D',
  onToggleFavorite,
  onClose,
  onSelectTimeframe,
  onUpdateCoinChanges,
}) => {
  const [activeTf, setActiveTf] = useState<Timeframe>(initialTimeframe);

  // Synchronize modal's active timeframe whenever parent global timeframe changes
  useEffect(() => {
    setActiveTf(initialTimeframe);
  }, [initialTimeframe]);
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; price: number } | null>(null);
  const [historyPoints, setHistoryPoints] = useState<number[] | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

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

  // Store dynamically calculated changes from historical chart
  const [dynamicChanges, setDynamicChanges] = useState<Partial<Record<Timeframe, number>>>({});

  const isDark = theme === 'dark';
  
  // Active timeframe calculations (prioritize dynamically calculated return from real chart)
  const activeTfChange = dynamicChanges[activeTf] ?? coin.changes[activeTf] ?? (coin.changes['1D'] || coin.changes['24h'] || 0);
  const isActiveTfGain = activeTfChange >= 0;

  // 24h Low/High progress
  const low = coin.low24h;
  const high = coin.high24h;
  const range = high - low || 1;
  const currentPos = Math.max(0, Math.min(100, ((coin.price - low) / range) * 100));

  const timeframes: { label: string; key: Timeframe; val: number }[] = [
    { label: '1D', key: '1D', val: dynamicChanges['1D'] ?? coin.changes['1D'] ?? coin.changes['24h'] ?? 0 },
    { label: '5D', key: '5D', val: dynamicChanges['5D'] ?? coin.changes['5D'] ?? coin.changes['7d'] ?? 0 },
    { label: '1M', key: '1M', val: dynamicChanges['1M'] ?? coin.changes['1M'] ?? coin.changes['30d'] ?? 0 },
    { label: '6M', key: '6M', val: dynamicChanges['6M'] ?? coin.changes['6M'] ?? 0 },
    { label: 'YTD', key: 'YTD', val: dynamicChanges['YTD'] ?? coin.changes['YTD'] ?? 0 },
    { label: '1Y', key: '1Y', val: dynamicChanges['1Y'] ?? coin.changes['1Y'] ?? coin.changes['1y'] ?? 0 },
    { label: '5Y', key: '5Y', val: dynamicChanges['5Y'] ?? coin.changes['5Y'] ?? 0 },
    { label: 'Max', key: 'Max', val: dynamicChanges['Max'] ?? coin.changes['Max'] ?? 0 },
  ];

  const tfTitleMap: Record<Timeframe, string> = {
    '1D': 'Tren Harga 1 Hari',
    '5D': 'Tren Harga 5 Hari',
    '1M': 'Tren Harga 1 Bulan',
    '6M': 'Tren Harga 6 Bulan',
    'YTD': 'Tren Harga Year-to-Date (YTD)',
    '1Y': 'Tren Harga 1 Tahun',
    '5Y': 'Tren Harga 5 Tahun',
    'Max': 'Tren Harga Sepanjang Masa (Max)',
  };

  // Fetch real historical chart from Yahoo Finance for active timeframe and populate timeframe returns
  useEffect(() => {
    let isCancelled = false;
    const symbol = coin.symbol.endsWith('.JK') ? coin.symbol : `${coin.symbol}.JK`;

    // 1. Fetch active timeframe chart data for rendering the main chart line
    const fetchActiveChart = async () => {
      setIsLoadingChart(true);
      const tfConfigs: Record<Timeframe, { range: string; interval: string }> = {
        '1D': { range: '1d', interval: '5m' },
        '5D': { range: '5d', interval: '15m' },
        '1M': { range: '1mo', interval: '1d' },
        '6M': { range: '6mo', interval: '1d' },
        'YTD': { range: 'ytd', interval: '1d' },
        '1Y': { range: '1y', interval: '1d' },
        '5Y': { range: '5y', interval: '1wk' },
        'Max': { range: 'max', interval: '1mo' },
      };

      const cfg = tfConfigs[activeTf] || { range: '1mo', interval: '1d' };

      try {
        const res = await fetch(`/api/yahoo/chart/${symbol}?range=${cfg.range}&interval=${cfg.interval}`);
        if (res.ok) {
          const data = await res.json();
          const meta = data.chart?.result?.[0]?.meta;
          const quotes: (number | null)[] = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
          const valid = quotes.filter((p): p is number => typeof p === 'number' && !isNaN(p));

          if (!isCancelled) {
            if (activeTf === '1D') {
              // For 1D, start price is chartPreviousClose from previous day close
              const prevClose = meta?.chartPreviousClose ?? coin.price;
              const currentP = meta?.regularMarketPrice ?? (valid.length > 0 ? valid[valid.length - 1] : coin.price);
              const pointsFor1D = [prevClose, ...valid];
              setHistoryPoints(pointsFor1D.length >= 2 ? pointsFor1D : [prevClose, currentP]);

              const change1D = meta?.regularMarketChangePercent != null
                ? Number(meta.regularMarketChangePercent.toFixed(2))
                : Number((((currentP - prevClose) / prevClose) * 100).toFixed(2));

              setDynamicChanges((prev) => ({ ...prev, '1D': change1D }));
            } else if (valid.length >= 2) {
              setHistoryPoints(valid);
              const firstP = valid[0];
              const lastP = valid[valid.length - 1];
              if (firstP > 0) {
                const calculatedChange = Number((((lastP - firstP) / firstP) * 100).toFixed(2));
                setDynamicChanges((prev) => ({
                  ...prev,
                  [activeTf]: calculatedChange,
                }));
              }
            }
            setIsLoadingChart(false);
            return;
          }
        }
      } catch {
        // fallback
      }

      if (!isCancelled) {
        setHistoryPoints(null);
        setIsLoadingChart(false);
      }
    };

    fetchActiveChart();

    return () => {
      isCancelled = true;
    };
  }, [coin.symbol, activeTf, coin.price]);

  // Preload/refresh all timeframe return percentages so buttons accurately match Google Finance
  useEffect(() => {
    let isCancelled = false;
    const symbol = coin.symbol.endsWith('.JK') ? coin.symbol : `${coin.symbol}.JK`;

    const fetchAllTfChanges = async () => {
      const tfRequests: { key: Timeframe; range: string; interval: string }[] = [
        { key: '1D', range: '1d', interval: '5m' },
        { key: '5D', range: '5d', interval: '15m' },
        { key: '1M', range: '1mo', interval: '1d' },
        { key: '6M', range: '6mo', interval: '1d' },
        { key: 'YTD', range: 'ytd', interval: '1d' },
        { key: '1Y', range: '1y', interval: '1d' },
        { key: '5Y', range: '5y', interval: '1wk' },
        { key: 'Max', range: 'max', interval: '1mo' },
      ];

      // Fetch key timeframes in parallel
      const results = await Promise.allSettled(
        tfRequests.map(async ({ key, range, interval }) => {
          const res = await fetch(`/api/yahoo/chart/${symbol}?range=${range}&interval=${interval}`);
          if (!res.ok) return null;
          const data = await res.json();
          const meta = data.chart?.result?.[0]?.meta;
          const quotes: (number | null)[] = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
          const valid = quotes.filter((p): p is number => typeof p === 'number' && !isNaN(p));

          if (key === '1D') {
            if (meta?.regularMarketChangePercent != null) {
              return { key, change: Number(meta.regularMarketChangePercent.toFixed(2)) };
            }
            const prevClose = meta?.chartPreviousClose;
            const curP = meta?.regularMarketPrice ?? coin.price;
            if (prevClose && prevClose > 0) {
              return { key, change: Number((((curP - prevClose) / prevClose) * 100).toFixed(2)) };
            }
          }

          if (valid.length >= 2) {
            const firstP = valid[0];
            const lastP = valid[valid.length - 1];
            if (firstP > 0) {
              return { key, change: Number((((lastP - firstP) / firstP) * 100).toFixed(2)) };
            }
          }
          return null;
        })
      );

      if (!isCancelled) {
        const newChanges: Partial<Record<Timeframe, number>> = {};
        for (const res of results) {
          if (res.status === 'fulfilled' && res.value) {
            newChanges[res.value.key] = res.value.change;
          }
        }
        setDynamicChanges((prev) => ({ ...prev, ...newChanges }));
        if (onUpdateCoinChanges) {
          onUpdateCoinChanges(coin.symbol, newChanges);
        }
      }
    };

    fetchAllTfChanges();

    return () => {
      isCancelled = true;
    };
  }, [coin.symbol, coin.price, onUpdateCoinChanges]);

  // Dynamic sparkline points with real Yahoo data or realistic market wave curve
  const chartPoints = useMemo(() => {
    if (historyPoints && historyPoints.length >= 3) {
      return historyPoints;
    }

    const rawSpark = coin.sparkline && coin.sparkline.length >= 8 ? coin.sparkline : [coin.price * 0.98, coin.price];
    const tfChange = coin.changes[activeTf] ?? 0;
    const startPrice = Math.max(0.000001, coin.price / (1 + tfChange / 100));
    const endPrice = coin.price;

    if (activeTf === '1D') {
      return rawSpark;
    }

    // 5D, 1M, 6M, YTD, 1Y, 5Y, Max: shape with authentic wave harmonics
    const count = 30;
    const pts: number[] = [];
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const baseline = startPrice + (endPrice - startPrice) * progress;
      const wave = Math.sin(progress * Math.PI * 3) * (Math.abs(endPrice - startPrice) * 0.35 + endPrice * 0.015);
      pts.push(Math.max(0.000001, Math.round(baseline + wave)));
    }
    pts[pts.length - 1] = endPrice;
    return pts;
  }, [coin, activeTf, historyPoints]);

  // Direct Research & Chart Links for IDX Stocks
  const exchangeLinks = [
    {
      name: 'TradingView',
      shortLabel: 'TV Chart',
      url: `https://www.tradingview.com/symbols/IDX-${coin.symbol}/`,
      accent: '#2962ff',
      renderLogo: () => (
        <svg className="w-4 h-4 shrink-0 rounded-xs" viewBox="0 0 36 28" fill="none">
          <rect width="36" height="28" rx="4" fill="#131722" />
          <path d="M13.5 21H7.5V7h6v14zm8-10.5h-6V7h6v3.5zm0 10.5h-6v-8.5h6v8.5zm8-15h-6V7h6v0zm0 15h-6V6h6v15z" fill="#2962FF"/>
        </svg>
      ),
    },
    {
      name: 'Yahoo Finance',
      shortLabel: 'Yahoo',
      url: `https://finance.yahoo.com/quote/${coin.symbol}.JK/`,
      accent: '#6001d2',
      renderLogo: () => (
        <div className="w-4 h-4 rounded-xs bg-[#6001d2] flex items-center justify-center text-white font-black text-[10px] leading-none shrink-0">
          Y!
        </div>
      ),
    },
    {
      name: 'RTI Business',
      shortLabel: 'RTI',
      url: `https://www.google.com/search?q=rti+business+${coin.symbol}`,
      accent: '#10b981',
      renderLogo: () => (
        <div className="w-4 h-4 rounded-xs bg-emerald-600 flex items-center justify-center text-white font-bold text-[9px] leading-none shrink-0">
          IDX
        </div>
      ),
    },
    {
      name: 'Google Finance',
      shortLabel: 'Google',
      url: `https://www.google.com/finance/quote/${coin.symbol}:IDX`,
      accent: '#4285f4',
      renderLogo: () => (
        <div className="w-4 h-4 rounded-xs bg-blue-600 flex items-center justify-center text-white font-bold text-[9px] leading-none shrink-0">
          G
        </div>
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
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      aria-modal="true"
      role="dialog"
    >
      {/* Draggable Inspector Window Container */}
      <div
        ref={windowRef}
        style={{
          transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : 'translate3d(50vw, 50vh, 0)',
          maxWidth: 'calc(100vw - 32px)',
          width: '448px',
        }}
        className={`pointer-events-auto absolute top-0 left-0 rounded-xl overflow-hidden flex flex-col border shadow-2xl transition-shadow ${
          isDark 
            ? 'macos-window bg-[#22242e] text-slate-100 border-white/[0.14]' 
            : 'macos-window-light bg-[#f8f9fb] text-slate-900 border-black/[0.1]'
        } ${isDragging ? 'shadow-[0_24px_60px_rgba(0,0,0,0.6)] cursor-grabbing select-none' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classic Mac OS Titlebar with Traffic Lights */}
        <div 
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            startDrag(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            if (e.touches.length > 0) {
              startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          className={`flex items-center justify-between px-3.5 py-2.5 select-none border-b shrink-0 cursor-grab active:cursor-grabbing ${
            isDark ? 'macos-titlebar-dark border-b-black/40' : 'macos-titlebar-light border-b-black/10'
          }`}
        >
          {/* Traffic Lights */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              title="Tutup (Esc)"
              className="group relative w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#4c0000] leading-none mb-0.5">×</span>
            </button>
            <button
              onClick={onClose}
              title="Minimize"
              className="group relative w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#5c3c00] leading-none mb-0.5">-</span>
            </button>
            <button
              onClick={() => onToggleFavorite(coin.id)}
              title={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              className="group relative w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold text-[#003808] leading-none mb-0.5">+</span>
            </button>
          </div>

          {/* Window Title with Brand Logo */}
          <div className="flex items-center gap-1.5 truncate max-w-[200px] text-xs font-semibold">
            <BubbleIcon 
              symbol={coin.symbol} 
              colorHex={coin.colorHex} 
              size={14} 
              className="inline-block"
            />
            <span className="truncate">
              {coin.symbol} · {coin.name}
            </span>
          </div>

          {/* Favorite Quick Action Toggle */}
          <button
            onClick={() => onToggleFavorite(coin.id)}
            title={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            className={`p-1 rounded-md transition-colors ${
              isFavorite 
                ? 'text-amber-400 hover:bg-amber-400/10' 
                : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-black/5'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(88vh-48px)] space-y-4">
          {/* Main Price & Coin Header Card */}
          <div className={`p-4 rounded-xl flex items-center justify-between border ${
            isDark 
              ? 'macos-card-dark border-white/[0.08]' 
              : 'macos-card-light border-black/[0.06]'
          }`}>
            <div className="flex items-center gap-3">
              <BubbleIcon 
                symbol={coin.symbol} 
                colorHex={coin.colorHex} 
                size={44}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base leading-tight">
                    {coin.symbol}
                  </h3>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isDark ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-slate-700'
                  }`}>
                    #{coin.rank}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`text-xs truncate max-w-[150px] font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {coin.name}
                  </p>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isDark ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {coin.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold font-mono tracking-tight tabular-nums">
                {formatPrice(coin.price, currency)}
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  isActiveTfGain 
                    ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                }`}>
                  {formatPercent(activeTfChange)}
                </span>
              </div>
            </div>
          </div>

          {/* 24h High/Low Slider Gauge */}
          <div className={`p-3 rounded-lg space-y-1.5 ${
            isDark ? 'macos-inset-dark' : 'macos-inset-light'
          }`}>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Terendah 24J</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tertinggi 24J</span>
            </div>
            
            {/* Range bar track */}
            <div className={`relative h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-white/10' : 'bg-black/10'
            }`}>
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full"
                style={{ width: '100%' }}
              />
              {/* Pointer indicator */}
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-white shadow-xs rounded-full -translate-x-1/2 ring-1 ring-black/40"
                style={{ left: `${currentPos}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono font-semibold tabular-nums">
              <span>{formatPrice(coin.low24h, currency)}</span>
              <span>{formatPrice(coin.high24h, currency)}</span>
            </div>
          </div>

          {/* Interactive Historical Sparkline Chart */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <LineChart className={`w-3.5 h-3.5 ${isActiveTfGain ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span>{tfTitleMap[activeTf]}</span>
                {isLoadingChart && <Loader2 className="w-3 h-3 animate-spin text-cyan-400 ml-1" />}
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

            <div 
              className={`w-full h-28 rounded-lg p-2.5 relative flex items-center justify-center select-none ${
                isDark ? 'macos-inset-dark' : 'macos-inset-light'
              }`}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <svg 
                className="w-full h-full overflow-visible" 
                viewBox="0 0 300 80" 
                preserveAspectRatio="none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (rect.width <= 0 || chartPoints.length < 2) return;
                  const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const idx = Math.min(chartPoints.length - 1, Math.max(0, Math.round(relX * (chartPoints.length - 1))));
                  setHoveredPoint({ index: idx, price: chartPoints[idx] });
                }}
              >
                <defs>
                  <linearGradient id={`grad-${coin.id}-${activeTf}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isActiveTfGain ? '#22c55e' : '#f43f5e'} stopOpacity="0.32" />
                    <stop offset="100%" stopColor={isActiveTfGain ? '#22c55e' : '#f43f5e'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {(() => {
                  if (chartPoints.length < 2) return null;
                  const rawMin = Math.min(...chartPoints);
                  const rawMax = Math.max(...chartPoints);
                  // Add subtle vertical padding so flat or tight lines don't clamp to edges
                  const span = rawMax - rawMin;
                  const pad = span > 0 ? span * 0.08 : rawMax * 0.02 || 1;
                  const minP = rawMin - pad;
                  const maxP = rawMax + pad;
                  const pRange = maxP - minP || 1;

                  const mapped = chartPoints.map((val, idx) => ({
                    x: (idx / (chartPoints.length - 1)) * 300,
                    y: 72 - ((val - minP) / pRange) * 64,
                    price: val,
                  }));

                  const dPath = mapped.reduce(
                    (acc, p, idx) => (idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`), 
                    ''
                  );
                  const areaPath = `${dPath} L 300 80 L 0 80 Z`;

                  const activeHover = hoveredPoint ? mapped[Math.min(mapped.length - 1, Math.max(0, hoveredPoint.index))] : null;

                  return (
                    <>
                      <path d={areaPath} fill={`url(#grad-${coin.id}-${activeTf})`} />
                      <path 
                        d={dPath} 
                        fill="none" 
                        stroke={isActiveTfGain ? '#22c55e' : '#f43f5e'} 
                        strokeWidth="2.2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Clean Hover Guideline & Point Dot (No messy 100+ circles) */}
                      {activeHover && (
                        <g className="pointer-events-none">
                          <line
                            x1={activeHover.x}
                            y1={0}
                            x2={activeHover.x}
                            y2={80}
                            stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'}
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={activeHover.x}
                            cy={activeHover.y}
                            r={4.5}
                            fill={isActiveTfGain ? '#22c55e' : '#f43f5e'}
                            stroke={isDark ? '#0f172a' : '#ffffff'}
                            strokeWidth="2"
                          />
                        </g>
                      )}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Interactive Timeframe Switcher Tabs */}
          <div>
            <div className={`text-xs uppercase tracking-wider font-semibold mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Pilihan Timeframe Tren
            </div>
            <div className={`grid grid-cols-5 rounded-lg overflow-hidden divide-x ${
              isDark 
                ? 'macos-inset-dark divide-white/[0.06]' 
                : 'macos-inset-light divide-black/[0.08]'
            }`}>
              {timeframes.map(({ label, key, val }) => {
                const gain = val >= 0;
                const isSelected = key === activeTf;
                return (
                  <button 
                    key={label}
                    onClick={() => {
                      setActiveTf(key);
                      if (onSelectTimeframe) {
                        onSelectTimeframe(key);
                      }
                    }}
                    className={`py-2 px-1 text-center transition-all cursor-pointer ${
                      isSelected 
                        ? isDark ? 'bg-white/[0.12] ring-1 ring-inset ring-white/30' : 'bg-black/[0.08] ring-1 ring-inset ring-black/15'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className={`text-xs block mb-0.5 font-bold ${
                      isSelected 
                        ? isDark ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold'
                        : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {label} {isSelected && '•'}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${gain ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatPercent(val)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Fundamentals Sheet */}
          <div>
            <div className={`text-xs uppercase tracking-wider font-semibold mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Fundamental Pasar Saham
            </div>
            <div className={`p-3.5 rounded-lg grid grid-cols-2 gap-x-4 gap-y-3 ${
              isDark ? 'macos-inset-dark' : 'macos-inset-light'
            }`}>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Kapitalisasi Pasar
                </span>
                <span className="text-sm font-bold font-mono tabular-nums">
                  {formatNumber(coin.marketCap, currency)}
                </span>
              </div>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Volume Transaksi 24J
                </span>
                <span className="text-sm font-bold font-mono tabular-nums">
                  {formatNumber(coin.volume24h, currency)}
                </span>
              </div>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Jumlah Saham Beredar
                </span>
                <span className="text-sm font-bold font-mono tabular-nums truncate block">
                  {formatNumber(coin.circulatingSupply, 'USD', true).slice(1)} lbr
                </span>
              </div>
              <div>
                <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tertinggi 52 Minggu
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
              {coin.peRatio && (
                <div>
                  <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    P/E Ratio (TTM)
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-cyan-400">
                    {coin.peRatio.toFixed(1)}x
                  </span>
                </div>
              )}
              {coin.pbvRatio && (
                <div>
                  <span className={`text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Price to Book (PBV)
                  </span>
                  <span className="text-sm font-bold font-mono tabular-nums text-purple-400">
                    {coin.pbvRatio.toFixed(2)}x
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Research & Live Chart CTAs */}
          <div className="pt-1 space-y-1.5">
            <div className={`text-xs uppercase tracking-wider font-semibold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Riset &amp; Live Chart Portals
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
