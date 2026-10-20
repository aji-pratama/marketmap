import React, { useState } from 'react';
import { CryptoCoin, Currency, Timeframe, ThemeMode } from '../types/crypto';
import { formatPrice, formatPercent, formatNumber } from '../data/cryptoData';
import { sound } from '../utils/audio';
import { Star, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { BubbleIcon } from './BubbleIcon';

interface TableViewProps {
  coins: CryptoCoin[];
  currency: Currency;
  timeframe: Timeframe;
  favorites: string[];
  theme?: ThemeMode;
  searchQuery?: string;
  onToggleFavorite: (id: string) => void;
  onSelectCoin: (coin: CryptoCoin) => void;
}

type SortField = 'rank' | 'name' | 'price' | '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'Max' | 'volume24h' | 'marketCap';
type SortOrder = 'asc' | 'desc';

export const TableView: React.FC<TableViewProps> = ({
  coins,
  currency,
  favorites,
  theme = 'dark',
  searchQuery = '',
  onToggleFavorite,
  onSelectCoin,
}) => {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const isDark = theme === 'dark';
  const q = searchQuery.toLowerCase().trim();

  const handleSort = (field: SortField) => {
    sound.playTick();
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' || field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedCoins = [...coins].sort((a, b) => {
    // If search is active, prioritize highlighted match items to the top while keeping full list
    if (q) {
      const aMatch = a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      const bMatch = b.symbol.toLowerCase().includes(q) || b.name.toLowerCase().includes(q);
      if (aMatch !== bMatch) return aMatch ? -1 : 1;
    }

    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'rank':
        aVal = a.rank;
        bVal = b.rank;
        break;
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'price':
        aVal = a.price;
        bVal = b.price;
        break;
      case '1D':
      case '5D':
      case '1M':
      case '6M':
      case 'YTD':
      case '1Y':
      case '5Y':
      case 'Max':
        aVal = a.changes[sortField] ?? (sortField === '1D' ? a.changes['24h'] : 0);
        bVal = b.changes[sortField] ?? (sortField === '1D' ? b.changes['24h'] : 0);
        break;
      case 'volume24h':
        aVal = a.volume24h;
        bVal = b.volume24h;
        break;
      case 'marketCap':
        aVal = a.marketCap;
        bVal = b.marketCap;
        break;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-emerald-500 inline-block ml-1" />
      : <ArrowDown className="w-3 h-3 text-rose-500 inline-block ml-1" />;
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-12 px-3 md:px-6">
      <div className="max-w-7xl mx-auto py-3 space-y-2">
        {/* Search Spotlight Notification Banner in Table View */}
        {q && (
          <div className={`flex items-center justify-between px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
            isDark ? 'macos-window bg-cyan-950/40 text-cyan-200 border-l-4 border-l-cyan-400' : 'macos-window-light bg-cyan-50 text-cyan-900 border-l-4 border-l-cyan-500'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                Spotlight Active: {sortedCoins.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).length} matching asset(s) highlighted below for &ldquo;{searchQuery}&rdquo;
              </span>
            </div>
          </div>
        )}

        <div className={`rounded-xl overflow-hidden transition-all ${
          isDark 
            ? 'macos-window bg-[#181a20] text-slate-100' 
            : 'macos-window-light bg-white text-slate-900'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className={`text-[10px] uppercase font-mono tracking-wider font-semibold sticky top-0 z-10 ${
                isDark ? 'macos-titlebar-dark text-slate-400' : 'macos-titlebar-light text-slate-600'
              }`}>
                <tr>
                  <th scope="col" className="px-3 py-2.5 w-8 text-center">★</th>
                  <th scope="col" className="px-3 py-2.5 cursor-pointer group" onClick={() => handleSort('rank')}>
                    <span>#</span>
                    {renderSortIndicator('rank')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 cursor-pointer group" onClick={() => handleSort('name')}>
                    <span>Emiten Saham</span>
                    {renderSortIndicator('name')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('price')}>
                    <span>Harga (Rp)</span>
                    {renderSortIndicator('price')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('1D')}>
                    <span>1D</span>
                    {renderSortIndicator('1D')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('5D')}>
                    <span>5D</span>
                    {renderSortIndicator('5D')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('1M')}>
                    <span>1M</span>
                    {renderSortIndicator('1M')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('6M')}>
                    <span>6M</span>
                    {renderSortIndicator('6M')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('YTD')}>
                    <span>YTD</span>
                    {renderSortIndicator('YTD')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('1Y')}>
                    <span>1Y</span>
                    {renderSortIndicator('1Y')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('volume24h')}>
                    <span>24h Vol</span>
                    {renderSortIndicator('volume24h')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right cursor-pointer group" onClick={() => handleSort('marketCap')}>
                    <span>Market Cap</span>
                    {renderSortIndicator('marketCap')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs divide-y divide-white/[0.04]">
                {sortedCoins.map((coin) => {
                  const isFav = favorites.some((f) => {
                    const fLow = f.toLowerCase();
                    return fLow === coin.id.toLowerCase() || fLow === coin.symbol.toLowerCase();
                  });
                  const isMatch = Boolean(q && (
                    coin.symbol.toLowerCase().includes(q) || 
                    coin.name.toLowerCase().includes(q)
                  ));
                  const change1D = coin.changes['1D'] ?? coin.changes['24h'] ?? 0;
                  const change5D = coin.changes['5D'] ?? coin.changes['7d'] ?? 0;
                  const change1M = coin.changes['1M'] ?? coin.changes['30d'] ?? 0;
                  const change6M = coin.changes['6M'] ?? 0;
                  const changeYTD = coin.changes['YTD'] ?? 0;
                  const change1Y = coin.changes['1Y'] ?? coin.changes['1y'] ?? 0;

                  return (
                    <tr
                      key={coin.id}
                      onClick={() => {
                        sound.playBubblePop(1);
                        onSelectCoin(coin);
                      }}
                      className={`transition-all cursor-pointer group ${
                        isMatch
                          ? isDark 
                            ? 'bg-cyan-950/45 text-slate-100 border-l-4 border-l-cyan-400 font-semibold ring-1 ring-cyan-500/30'
                            : 'bg-cyan-50/90 text-slate-900 border-l-4 border-l-cyan-500 font-semibold ring-1 ring-cyan-400/40'
                          : isDark 
                            ? 'hover:bg-white/[0.04] text-slate-100' 
                            : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <td 
                        className="px-3 py-2.5 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(coin.id);
                        }}
                      >
                        <button 
                          title={isFav ? "Favorite (In Favorites)" : "Add to favorites (⭐)"}
                          className="text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>
                      <td className={`px-3 py-2.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {coin.rank}
                      </td>
                      <td className="px-3 py-2.5 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <BubbleIcon 
                              symbol={coin.symbol} 
                              colorHex={coin.colorHex} 
                              size={24} 
                              className="shrink-0"
                            />
                            {isFav && (
                              <span 
                                title="Favorite!" 
                                className="absolute -top-1 -right-1 text-[8px] leading-none select-none drop-shadow-xs"
                              >
                                ⭐
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-semibold text-xs group-hover:text-emerald-400 transition-colors">
                              {coin.name}
                            </span>
                            <span className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {coin.symbol}
                            </span>
                            {isMatch && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 animate-pulse">
                                ✦ MATCH
                              </span>
                            )}
                            {isFav && (
                              <span className="text-[10px] text-amber-400 font-mono font-medium ml-1">
                                · ⭐ Fav
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold font-mono">
                        {formatPrice(coin.price, currency)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-bold font-mono ${change1D >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatPercent(change1D)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium font-mono ${change5D >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatPercent(change5D)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium font-mono ${change1M >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatPercent(change1M)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium font-mono ${change6M >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatPercent(change6M)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium font-mono ${changeYTD >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatPercent(changeYTD)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium font-mono ${change1Y >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatPercent(change1Y)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formatNumber(coin.volume24h, currency)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {formatNumber(coin.marketCap, currency)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="w-16 h-5 mx-auto">
                          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                            {(() => {
                              const pts = coin.sparkline && coin.sparkline.length >= 2 
                                ? coin.sparkline 
                                : [coin.price * 0.98, coin.price];
                              const min = Math.min(...pts);
                              const max = Math.max(...pts);
                              const rng = max - min || 1;
                              const pathD = pts.reduce((acc, val, i) => {
                                const x = (i / (pts.length - 1)) * 100;
                                const y = 26 - ((val - min) / rng) * 22;
                                return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }, '');
                              return (
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke={change1D >= 0 ? '#10b981' : '#f43f5e'}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              );
                            })()}
                          </svg>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
