import React, { useState } from 'react';
import { 
  Timeframe, SizeByMetric, Currency, RankRange, ViewMode, ThemeMode 
} from '../types/crypto';
import { 
  Apple, CircleDot, Table, Star, Clock, 
  ChevronDown, Check, X, Search, SlidersHorizontal
} from 'lucide-react';

interface MobileBottomNavProps {
  viewMode: ViewMode;
  timeframe: Timeframe;
  categoryFilter: RankRange;
  favoriteCount: number;
  sizeBy: SizeByMetric;
  currency: Currency;
  theme: ThemeMode;
  searchQuery: string;
  isLiveConnected?: boolean;
  onSelectViewMode: (mode: ViewMode) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
  onSelectCategoryFilter: (filter: RankRange) => void;
  onSelectSizeBy: (metric: SizeByMetric) => void;
  onSelectCurrency: (curr: Currency) => void;
  onSearchChange: (q: string) => void;
  onToggleTheme?: (theme: ThemeMode) => void;
  onOpenSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  timeframe,
  categoryFilter,
  favoriteCount,
  theme,
  searchQuery,
  onSelectViewMode,
  onSelectTimeframe,
  onSelectCategoryFilter,
  onSearchChange,
  onOpenSettings,
}) => {
  const [activeWindow, setActiveWindow] = useState<'display' | 'timeframe' | 'rank' | 'search' | null>(null);

  const isDark = theme === 'dark';

  const viewModes: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'apples', label: 'Apples View', icon: <Apple className="w-4 h-4 text-rose-500" /> },
    { id: 'bubbles', label: 'Bubbles View', icon: <CircleDot className="w-4 h-4 text-emerald-400" /> },
    { id: 'table', label: 'Table View', icon: <Table className="w-4 h-4 text-cyan-400" /> },
  ];

  const timeframes: { id: Timeframe; label: string; desc: string }[] = [
    { id: '1h', label: '1H', desc: '1 Hour Momentum' },
    { id: '24h', label: '24H', desc: '24 Hours Daily' },
    { id: '7d', label: '7D', desc: '7 Days Weekly' },
    { id: '30d', label: '30D', desc: '30 Days Monthly' },
    { id: '1y', label: '1Y', desc: '1 Year Annual' },
  ];

  const rankRanges: { id: RankRange; label: string }[] = [
    { id: 'favorites', label: `⭐ My Favorites (${favoriteCount})` },
    { id: '1-100', label: 'Top 100 Coins' },
    { id: '1-1000', label: '🔥 All 1000 Coins' },
    { id: '101-200', label: 'Rank 101 - 200' },
    { id: '201-300', label: 'Rank 201 - 300' },
    { id: '301-400', label: 'Rank 301 - 400' },
    { id: '401-500', label: 'Rank 401 - 500' },
    { id: '501-600', label: 'Rank 501 - 600' },
    { id: '601-700', label: 'Rank 601 - 700' },
    { id: '701-800', label: 'Rank 701 - 800' },
    { id: '801-900', label: 'Rank 801 - 900' },
    { id: '901-1000', label: 'Rank 901 - 1000' },
  ];

  const closeWindow = () => setActiveWindow(null);

  return (
    <>
      {/* Dim Backdrop for Mac Inspector Windows */}
      {activeWindow && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150 md:hidden"
          onClick={closeWindow}
        />
      )}

      {/* Classic Mac OS Inspector Window: Display Mode Dropdown */}
      {activeWindow === 'display' && (
        <div className={`fixed bottom-16 left-3 right-3 max-w-sm mx-auto z-50 rounded-xl overflow-hidden shadow-2xl border transition-all animate-in slide-in-from-bottom-3 duration-150 md:hidden ${
          isDark 
            ? 'macos-window bg-[#22242e] text-slate-100 border-white/[0.14]' 
            : 'macos-window-light bg-white text-slate-900 border-black/[0.1]'
        }`}>
          {/* Titlebar */}
          <div className={`flex items-center justify-between px-3 py-1.5 select-none border-b ${
            isDark ? 'macos-titlebar-dark border-white/[0.08]' : 'macos-titlebar-light border-black/[0.08]'
          }`}>
            <div className="flex items-center gap-1.5">
              <button onClick={closeWindow} className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center">
                <span className="text-[6px] text-[#4c0000] font-bold leading-none mb-0.5">×</span>
              </button>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <span className="text-xs font-semibold">Display Style</span>
            <div className="w-8" />
          </div>

          <div className="p-1.5 space-y-1">
            {viewModes.map((vm) => (
              <button
                key={vm.id}
                onClick={() => {
                  onSelectViewMode(vm.id);
                  closeWindow();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === vm.id
                    ? isDark 
                      ? 'macos-btn-dark text-white font-bold border-emerald-500/40 shadow-xs' 
                      : 'macos-btn-light text-slate-900 font-bold border-emerald-600/40 shadow-xs'
                    : isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {vm.icon}
                  <span>{vm.label}</span>
                </div>
                {viewMode === vm.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Classic Mac OS Inspector Window: Timeframe */}
      {activeWindow === 'timeframe' && (
        <div className={`fixed bottom-16 left-3 right-3 max-w-sm mx-auto z-50 rounded-xl overflow-hidden shadow-2xl border transition-all animate-in slide-in-from-bottom-3 duration-150 md:hidden ${
          isDark 
            ? 'macos-window bg-[#22242e] text-slate-100 border-white/[0.14]' 
            : 'macos-window-light bg-white text-slate-900 border-black/[0.1]'
        }`}>
          {/* Titlebar */}
          <div className={`flex items-center justify-between px-3 py-1.5 select-none border-b ${
            isDark ? 'macos-titlebar-dark border-white/[0.08]' : 'macos-titlebar-light border-black/[0.08]'
          }`}>
            <div className="flex items-center gap-1.5">
              <button onClick={closeWindow} className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center">
                <span className="text-[6px] text-[#4c0000] font-bold leading-none mb-0.5">×</span>
              </button>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <span className="text-xs font-semibold">Timeframe</span>
            <div className="w-8" />
          </div>

          <div className="p-1.5 space-y-1">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => {
                  onSelectTimeframe(tf.id);
                  closeWindow();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                  timeframe === tf.id
                    ? isDark 
                      ? 'macos-btn-dark text-emerald-400 font-bold border-emerald-500/40 shadow-xs' 
                      : 'macos-btn-light text-emerald-800 font-bold border-emerald-600/40 shadow-xs'
                    : isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs w-7">{tf.label}</span>
                  <span className={`text-[11px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tf.desc}</span>
                </div>
                {timeframe === tf.id && <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Classic Mac OS Inspector Window: Rank Range & Favorites */}
      {activeWindow === 'rank' && (
        <div className={`fixed bottom-16 left-3 right-3 max-w-sm mx-auto z-50 rounded-xl max-h-[60vh] flex flex-col overflow-hidden shadow-2xl border transition-all animate-in slide-in-from-bottom-3 duration-150 md:hidden ${
          isDark 
            ? 'macos-window bg-[#22242e] text-slate-100 border-white/[0.14]' 
            : 'macos-window-light bg-white text-slate-900 border-black/[0.1]'
        }`}>
          {/* Titlebar */}
          <div className={`flex items-center justify-between px-3 py-1.5 select-none border-b shrink-0 ${
            isDark ? 'macos-titlebar-dark border-white/[0.08]' : 'macos-titlebar-light border-black/[0.08]'
          }`}>
            <div className="flex items-center gap-1.5">
              <button onClick={closeWindow} className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center">
                <span className="text-[6px] text-[#4c0000] font-bold leading-none mb-0.5">×</span>
              </button>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <span className="text-xs font-semibold">Filter & Favorites</span>
            <div className="w-8" />
          </div>

          <div className="p-1.5 overflow-y-auto space-y-1 flex-1">
            {rankRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => {
                  onSelectCategoryFilter(range.id);
                  closeWindow();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${
                  categoryFilter === range.id
                    ? isDark 
                      ? 'macos-btn-dark text-amber-300 font-bold border-amber-500/40 shadow-xs' 
                      : 'macos-btn-light text-amber-950 font-bold border-amber-500/40 shadow-xs'
                    : isDark ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={range.id === 'favorites' ? 'font-bold text-amber-400' : 'font-medium'}>{range.label}</span>
                {categoryFilter === range.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Classic Mac OS Inspector Window: Spotlight Search */}
      {activeWindow === 'search' && (
        <div className={`fixed bottom-16 left-3 right-3 max-w-sm mx-auto z-50 rounded-xl overflow-hidden shadow-2xl border transition-all animate-in slide-in-from-bottom-3 duration-150 md:hidden ${
          isDark 
            ? 'macos-window bg-[#22242e] text-slate-100 border-white/[0.14]' 
            : 'macos-window-light bg-white text-slate-900 border-black/[0.1]'
        }`}>
          <div className="p-2 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Spotlight asset (e.g. BTC, ETH)..."
              value={searchQuery}
              autoFocus
              onChange={(e) => onSearchChange(e.target.value)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium focus:outline-none ${
                isDark ? 'macos-inset-dark text-white placeholder:text-slate-500' : 'macos-inset-light text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="p-0.5 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={closeWindow}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                isDark ? 'macos-btn-dark text-slate-200' : 'macos-btn-light text-slate-800'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Full-Width Classic Mac OS Bottom Bar (Mentok Screen Edge-to-Edge) */}
      <nav 
        aria-label="Mac Mobile Dock"
        className={`fixed bottom-0 left-0 right-0 z-40 w-full md:hidden select-none border-t transition-colors ${
          isDark 
            ? 'macos-titlebar-dark bg-[#1c1f29]/96 backdrop-blur-2xl border-white/[0.14] text-slate-100 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]' 
            : 'macos-titlebar-light bg-[#f2f4f8]/96 backdrop-blur-2xl border-black/[0.12] text-slate-900 shadow-[0_-6px_24px_rgba(0,0,0,0.08)]'
        }`}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2 w-full max-w-md mx-auto">
          {/* 1. Style Display Dropdown Button */}
          <button
            onClick={() => setActiveWindow(activeWindow === 'display' ? null : 'display')}
            title="Display Style"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              activeWindow === 'display'
                ? isDark ? 'macos-btn-dark ring-2 ring-rose-400/80 text-rose-400' : 'macos-btn-light ring-2 ring-rose-500/80 text-rose-700'
                : isDark ? 'macos-btn-dark text-slate-200' : 'macos-btn-light text-slate-800'
            }`}
          >
            {viewMode === 'apples' && <Apple className="w-4 h-4 text-rose-500 shrink-0" />}
            {viewMode === 'bubbles' && <CircleDot className="w-4 h-4 text-emerald-400 shrink-0" />}
            {viewMode === 'table' && <Table className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span className="capitalize">{viewMode}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* 2. Timeframe Dropdown Button */}
          <button
            onClick={() => setActiveWindow(activeWindow === 'timeframe' ? null : 'timeframe')}
            title="Timeframe"
            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
              activeWindow === 'timeframe'
                ? isDark ? 'macos-btn-dark ring-2 ring-emerald-400/80 text-emerald-400' : 'macos-btn-light ring-2 ring-emerald-600/80 text-emerald-700'
                : isDark ? 'macos-btn-dark text-slate-200' : 'macos-btn-light text-slate-800'
            }`}
          >
            <span>{timeframe.toUpperCase()}</span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* 3. Filter / Rank Dropdown Button (Favorites is inside here!) */}
          <button
            onClick={() => setActiveWindow(activeWindow === 'rank' ? null : 'rank')}
            title="Rank and Favorites Filter"
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeWindow === 'rank' || categoryFilter === 'favorites'
                ? isDark ? 'macos-btn-dark ring-2 ring-amber-400/80 text-amber-300' : 'macos-btn-light ring-2 ring-amber-500/80 text-amber-900'
                : isDark ? 'macos-btn-dark text-slate-200' : 'macos-btn-light text-slate-800'
            }`}
          >
            <span className="truncate">
              {categoryFilter === 'favorites' ? `★ Favs (${favoriteCount})` : categoryFilter}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* 4. Spotlight Search Button */}
          <button
            onClick={() => setActiveWindow(activeWindow === 'search' ? null : 'search')}
            title="Search Asset"
            className={`p-2 rounded-lg transition-all ${
              searchQuery || activeWindow === 'search'
                ? isDark ? 'macos-btn-dark ring-2 ring-cyan-400/80 text-cyan-400' : 'macos-btn-light ring-2 ring-cyan-500/80 text-cyan-700'
                : isDark ? 'macos-btn-dark text-slate-300' : 'macos-btn-light text-slate-700'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 5. Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className={`p-2 rounded-lg transition-all ${
              isDark ? 'macos-btn-dark text-slate-300' : 'macos-btn-light text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </>
  );
};
