import React, { useState, useRef, useEffect } from 'react';
import {
  Timeframe, SizeByMetric, ContentDisplay, Currency, RankRange, ViewMode, ThemeMode
} from '../types/crypto';
import {
  SlidersHorizontal, Camera, Search, RotateCcw,
  CircleDot, Table, ChevronDown, Check, X, Apple,
  Sun, Moon, Zap, ZapOff
} from 'lucide-react';
import { CryptoApplesLogo } from './CryptoApplesLogo';

interface HeaderProps {
  timeframe: Timeframe;
  sizeBy: SizeByMetric;
  contentDisplay: ContentDisplay;
  currency: Currency;
  categoryFilter: RankRange;
  viewMode: ViewMode;
  searchQuery: string;
  liveSimulation: boolean;
  favoriteCount: number;
  theme: ThemeMode;
  isLiveConnected?: boolean;
  isRefreshing?: boolean;
  onRefreshPrices?: () => void;
  onSelectTimeframe: (tf: Timeframe) => void;
  onSelectSizeBy: (metric: SizeByMetric) => void;
  onSelectContentDisplay: (content: ContentDisplay) => void;
  onSelectCurrency: (curr: Currency) => void;
  onSelectCategoryFilter: (filter: RankRange) => void;
  onSelectViewMode: (mode: ViewMode) => void;
  onSearchChange: (q: string) => void;
  onToggleLiveSimulation: () => void;
  onResetPhysics: () => void;
  onOpenSettings: () => void;
  onCaptureScreenshot: () => void;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeframe,
  sizeBy,
  contentDisplay,
  currency,
  categoryFilter,
  viewMode,
  searchQuery,
  liveSimulation,
  favoriteCount,
  theme,
  isLiveConnected = true,
  isRefreshing = false,

  onRefreshPrices,
  onSelectTimeframe,
  onSelectSizeBy,
  onSelectContentDisplay,
  onSelectCurrency,
  onSelectCategoryFilter,
  onSelectViewMode,
  onSearchChange,
  onToggleLiveSimulation,
  onOpenSettings,
  onCaptureScreenshot,
  onToggleTheme,
}) => {
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const rankRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Outside click handler to close open dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rankRef.current && !rankRef.current.contains(e.target as Node)) {
        setIsRankOpen(false);
      }
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeframes: { id: Timeframe; label: string }[] = [
    { id: '1h', label: '1H' },
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '1y', label: '1Y' },
  ];

  const rankRanges: { id: RankRange; label: string }[] = [
    { id: 'favorites', label: `⭐ My Favorites (${favoriteCount})` },
    { id: '1-100', label: 'Top 100' },
    { id: '101-200', label: '101 - 200' },
    { id: '201-300', label: '201 - 300' },
    { id: '301-400', label: '301 - 400' },
    { id: '401-500', label: '401 - 500' },
    { id: '501-600', label: '501 - 600' },
    { id: '601-700', label: '601 - 700' },
    { id: '701-800', label: '701 - 800' },
    { id: '801-900', label: '801 - 900' },
    { id: '901-1000', label: '901 - 1000' },
    { id: '1-1000', label: '🔥 Top 1000 (All)' },
  ];

  const activeRankLabel = rankRanges.find((r) => r.id === categoryFilter)?.label || 'Top 100';

  const sizeByLabels: Record<SizeByMetric, string> = {
    performance: 'Performance %',
    market_cap: 'Market Cap',
    volume: '24h Volume',
  };

  const contentDisplayLabels: Record<ContentDisplay, string> = {
    performance: 'Performance %',
    price: 'Price',
    market_cap: 'Market Cap',
    rank: 'Rank',
  };

  const renderOptionsDropdown = () => (
    <div
      className={`absolute right-0 mt-2 w-60 rounded-xl p-2.5 z-50 shadow-2xl space-y-2.5 text-xs transition-colors border ${isDark
          ? 'macos-window bg-[#22242e] text-slate-200 border-white/[0.14]'
          : 'macos-window-light bg-white text-slate-800 border-black/[0.1]'
        }`}
    >
      <div>
        <div className={`px-2 py-1 text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Size Metric
        </div>
        {(Object.keys(sizeByLabels) as SizeByMetric[]).map((m) => (
          <button
            key={m}
            onClick={() => onSelectSizeBy(m)}
            className={`w-full px-2.5 py-1.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${sizeBy === m
                ? isDark ? 'text-emerald-400 font-bold bg-emerald-950/50' : 'text-emerald-700 font-bold bg-emerald-50'
                : isDark ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            <span>{sizeByLabels[m]}</span>
            {sizeBy === m && <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />}
          </button>
        ))}
      </div>

      <div className={`h-[1px] ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />

      <div>
        <div className={`px-2 py-1 text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Bubble Content
        </div>
        {(Object.keys(contentDisplayLabels) as ContentDisplay[]).map((c) => (
          <button
            key={c}
            onClick={() => onSelectContentDisplay(c)}
            className={`w-full px-2.5 py-1.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${contentDisplay === c
                ? isDark ? 'text-emerald-400 font-bold bg-emerald-950/50' : 'text-emerald-700 font-bold bg-emerald-50'
                : isDark ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            <span>{contentDisplayLabels[c]}</span>
            {contentDisplay === c && <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />}
          </button>
        ))}
      </div>

      <div className={`h-[1px] ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />

      <div>
        <div className={`px-2 py-1 text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Currency
        </div>
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {(['USD', 'EUR', 'GBP', 'BTC', 'ETH'] as Currency[]).map((cur) => (
            <button
              key={cur}
              onClick={() => onSelectCurrency(cur)}
              className={`py-1.5 text-center font-mono text-xs rounded-lg transition-all ${currency === cur
                  ? isDark ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-slate-900 text-white font-bold shadow-xs'
                  : isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {cur}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <header className={`hidden md:block w-full z-30 select-none border-b transition-colors ${isDark
        ? 'macos-titlebar-dark text-slate-100 border-white/[0.14] bg-[#1c1f29]/96 backdrop-blur-md'
        : 'macos-titlebar-light text-slate-900 border-black/[0.1] bg-white/95 backdrop-blur-md'
      }`}>
      {/* Top Header Row - Responsive Mac OS Toolbar */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 w-full">
        {/* Left Section: Brand & Filter Selection (Traffic lights removed per request) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Official CryptoApples Brand Logo */}
          <div className="mr-1">
            <CryptoApplesLogo size={32} />
          </div>

          {/* Rank Range Dropdown - Substantial Mac Button */}
          <div className="relative" ref={rankRef}>
            <button
              onClick={() => {
                setIsRankOpen(!isRankOpen);
                setIsOptionsOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${isDark ? 'macos-btn-dark text-slate-200 hover:text-white' : 'macos-btn-light text-slate-800'
                }`}
            >
              <span className="max-w-[85px] sm:max-w-none truncate">{activeRankLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>

            {isRankOpen && (
              <div
                className={`absolute left-0 mt-2 w-48 rounded-xl p-1.5 z-50 max-h-72 overflow-y-auto shadow-2xl transition-colors border ${isDark
                    ? 'macos-window bg-[#22242e] text-slate-200 border-white/[0.14]'
                    : 'macos-window-light bg-white text-slate-800 border-black/[0.1]'
                  }`}
                onClick={() => setIsRankOpen(false)}
              >
                <div className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select Rank
                </div>
                {rankRanges.map((range) => (
                  <React.Fragment key={range.id}>
                    <button
                      onClick={() => onSelectCategoryFilter(range.id)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${categoryFilter === range.id
                          ? isDark ? 'text-amber-400 font-bold bg-amber-950/50' : 'text-amber-800 font-bold bg-amber-50'
                          : isDark ? 'text-slate-300 hover:bg-white/[0.08]' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      <span className={range.id === 'favorites' ? 'font-bold text-amber-400' : 'font-medium'}>{range.label}</span>
                      {categoryFilter === range.id && <Check className="w-3.5 h-3.5 text-amber-500 font-bold" />}
                    </button>
                    {range.id === 'favorites' && (
                      <div className={`my-1 h-[1px] ${isDark ? 'bg-white/[0.1]' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Dedicated "My Favorites" Filter Button - Bold & Tactile */}
          <button
            onClick={() => {
              if (categoryFilter === 'favorites') {
                onSelectCategoryFilter('1-100');
              } else {
                onSelectCategoryFilter('favorites');
              }
            }}
            title={categoryFilter === 'favorites' ? 'Showing Favorites (Click to show Top 100)' : 'Filter by My Favorites (⭐)'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${categoryFilter === 'favorites'
                ? isDark
                  ? 'macos-btn-dark ring-2 ring-amber-400/80 text-amber-300 bg-amber-950/60 shadow-xs'
                  : 'macos-btn-light ring-2 ring-amber-500/80 text-amber-950 bg-amber-100 shadow-xs'
                : isDark
                  ? 'macos-btn-dark text-slate-200 hover:text-amber-300'
                  : 'macos-btn-light text-slate-700 hover:text-amber-600'
              }`}
          >
            <span className="text-amber-400 text-sm">★</span>
            <span className="hidden sm:inline">Favorites</span>
            <span className={`font-mono text-xs px-2 py-0.5 rounded-full font-bold ${categoryFilter === 'favorites'
                ? isDark ? 'bg-amber-400/30 text-amber-300' : 'bg-amber-300 text-amber-950'
                : isDark ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-slate-700'
              }`}>
              {favoriteCount}
            </span>
          </button>

          {/* Live Status Indicator */}
          <button
            onClick={onRefreshPrices}
            title={isLiveConnected ? "Real-time feed connected. Click to refresh." : "Connecting to market feed..."}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-2xs ${isDark ? 'macos-btn-dark' : 'macos-btn-light'
              }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${isLiveConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
            <span className={isLiveConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isLiveConnected ? 'LIVE' : 'SYNC'}
            </span>
            <RotateCcw className={`w-3.5 h-3.5 opacity-60 hover:opacity-100 ml-0.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Center: Desktop Timeframe Segmented Control (Mac Inset, Thicker) */}
        <div className={`hidden md:flex items-center p-1 rounded-xl gap-0.5 border ${isDark
            ? 'macos-inset-dark border-white/[0.08]'
            : 'macos-inset-light border-black/[0.06]'
          }`}>
          {timeframes.map((tf) => {
            const active = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => onSelectTimeframe(tf.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all font-mono font-bold ${active
                    ? isDark
                      ? 'macos-btn-dark text-white shadow-xs'
                      : 'macos-btn-light text-slate-900 shadow-xs'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Right Section: Controls, Search, View Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Options Dropdown Button */}
          <div className="relative hidden md:block" ref={optionsRef}>
            <button
              onClick={() => {
                setIsOptionsOpen(!isOptionsOpen);
                setIsRankOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${isDark ? 'macos-btn-dark text-slate-200 hover:text-white' : 'macos-btn-light text-slate-800'
                }`}
            >
              <span className={`hidden lg:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Size:</span>
              <span>{sizeByLabels[sizeBy]}</span>
              <span className="font-mono text-xs text-emerald-500 font-bold">({currency})</span>
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </button>

            {isOptionsOpen && renderOptionsDropdown()}
          </div>

          {/* Search Input - Mac OS Spotlight / Finder Style Inset */}
          <div className="relative hidden lg:block">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'
              }`} />
            <input
              type="text"
              placeholder="Spotlight asset (Esc)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onSearchChange('');
              }}
              className={`w-32 xl:w-44 pl-8 pr-7 py-1.5 rounded-lg text-xs font-medium focus:outline-none transition-all border ${isDark
                  ? 'macos-inset-dark text-slate-100 placeholder:text-slate-500 border-white/[0.08] focus:border-cyan-400/50'
                  : 'macos-inset-light text-slate-900 placeholder:text-slate-400 border-black/[0.08] focus:border-cyan-500/50'
                }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                title="Clear search"
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            title="Search"
            className={`md:hidden p-2 rounded-lg transition-all ${isMobileSearchOpen || searchQuery
                ? isDark ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                : isDark ? 'macos-btn-dark text-slate-300' : 'macos-btn-light text-slate-700'
              }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* View Mode Segmented Switcher (Apples / Bubbles / Table) */}
          <div className={`flex items-center p-1 rounded-xl gap-0.5 border ${isDark
              ? 'macos-inset-dark border-white/[0.08]'
              : 'macos-inset-light border-black/[0.06]'
            }`}>
            <button
              onClick={() => onSelectViewMode('apples')}
              title="Apples View"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all font-bold ${viewMode === 'apples'
                  ? isDark ? 'macos-btn-dark text-rose-400 shadow-xs' : 'macos-btn-light text-rose-700 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Apple className="w-4 h-4" />
              <span className="hidden xl:inline">Apples</span>
            </button>

            <button
              onClick={() => onSelectViewMode('bubbles')}
              title="Bubbles View"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all font-bold ${viewMode === 'bubbles'
                  ? isDark ? 'macos-btn-dark text-emerald-400 shadow-xs' : 'macos-btn-light text-emerald-700 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CircleDot className="w-4 h-4" />
              <span className="hidden xl:inline">Bubbles</span>
            </button>

            <button
              onClick={() => onSelectViewMode('table')}
              title="Table View"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all font-bold ${viewMode === 'table'
                  ? isDark ? 'macos-btn-dark text-white shadow-xs' : 'macos-btn-light text-slate-900 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Table className="w-4 h-4" />
              <span className="hidden xl:inline">Table</span>
            </button>
          </div>



          {/* Screenshot */}
          <button
            onClick={onCaptureScreenshot}
            title="Export Screenshot"
            className={`p-2 rounded-lg transition-all shadow-2xs ${isDark ? 'macos-btn-dark text-slate-300' : 'macos-btn-light text-slate-700'
              }`}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className={`p-2 rounded-lg transition-all shadow-2xs ${isDark ? 'macos-btn-dark text-slate-300' : 'macos-btn-light text-slate-700'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>



      {/* Mobile Search Overlay Input */}
      {isMobileSearchOpen && (
        <div className={`md:hidden px-3.5 py-2.5 border-t flex items-center gap-2.5 ${isDark ? 'border-black/30 bg-[#12141a]' : 'border-black/10 bg-slate-100'
          }`}>
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Spotlight asset or ticker..."
            value={searchQuery}
            autoFocus
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onSearchChange('');
                setIsMobileSearchOpen(false);
              }
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium focus:outline-none ${isDark ? 'macos-inset-dark text-white' : 'macos-inset-light text-slate-900'
              }`}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
          >
            Cancel
          </button>
        </div>
      )}
    </header>
  );
};
