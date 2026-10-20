import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { X, ExternalLink } from 'lucide-react';
import { ThemeMode } from '../types/crypto';

export interface NewsItem {
  id: string;
  tag: 'MARKET' | 'ETF' | 'ON-CHAIN' | 'MACRO' | 'DEFI' | 'POLICY';
  title: string;
  source: string;
  time: string;
  details: string;
  impactCoins?: string[];
}

export const CRYPTO_NEWS_ITEMS: NewsItem[] = [
  {
    id: 'news-1',
    tag: 'MARKET',
    title: 'IHSG bergerak dinamis, investor asing mencatatkan akumulasi bersih pada saham perbankan big-caps',
    source: 'IDX Market',
    time: '5m ago',
    details: 'Arus dana institusi dan investor asing terpantau aktif di saham BBCA, BBRI, BMRI, dan BBNI seiring ekspektasi kinerja dividen dan stabilitas suku bunga.',
    impactCoins: ['BBCA', 'BBRI', 'BMRI']
  },
  {
    id: 'news-2',
    tag: 'POLICY',
    title: 'Bank Indonesia mempertahankan suku bunga acuan BI-Rate, likuiditas perbankan nasional terjaga kuat',
    source: 'Bank Indonesia',
    time: '18m ago',
    details: 'Keputusan ini konsisten dengan fokus kebijakan moneter yang pro-stability untuk memperkuat stabilitas nilai tukar Rupiah.',
    impactCoins: ['BMRI', 'BBNI']
  },
  {
    id: 'news-3',
    tag: 'MACRO',
    title: 'Sektor energi dan komoditas tambang catatkan peningkatan volume transaksi harian di bursa',
    source: 'Bloomberg Technoz',
    time: '32m ago',
    details: 'Penguatan harga batubara dan nikel global mendorong optimisme pada saham pertambangan dan energi terbarukan.',
    impactCoins: ['ADRO', 'PTBA', 'AMMN']
  },
  {
    id: 'news-4',
    tag: 'ETF',
    title: 'OJK catat pertumbuhan Single Investor Identification (SID) pasar modal melampaui 14 juta investor',
    source: 'OJK',
    time: '45m ago',
    details: 'Partisipasi investor ritel domestik terus menunjukkan tren peningkatan yang kokoh, didukung oleh penetrasi aplikasi sekuritas online.',
    impactCoins: ['GOTO', 'TLKM']
  },
  {
    id: 'news-5',
    tag: 'ON-CHAIN',
    title: 'Sektor infrastruktur telekomunikasi dan menara perluas jaringan fiber optik dan data center',
    source: 'Bisnis Indonesia',
    time: '58m ago',
    details: 'Ekspansi kapasitas komputasi cloud dan kebutuhan konektivitas kecerdasan buatan mendorong pendapatan berulang emiten menara.',
    impactCoins: ['TLKM', 'ISAT', 'EXCL']
  }
];

import { IhsgData } from '../services/cryptoMarketService';

interface NewsTickerProps {
  theme?: ThemeMode;
  onSelectCoinTicker?: (symbol: string) => void;
  ihsgData?: IhsgData | null;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ theme = 'dark', onSelectCoinTicker, ihsgData }) => {
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);
  const isDark = theme === 'dark';

  const isIhsgGain = (ihsgData?.changePercent ?? 0) >= 0;

  return (
    <>
      {/* Clean Financial Wire Ticker */}
      <div className={`relative w-full border-t select-none z-20 flex items-stretch h-8 overflow-hidden transition-colors ${
        isDark ? 'bg-[#0b0e14] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* IHSG Real-Time Index Indicator + News Wire Label */}
        <div className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 shrink-0 z-10 text-[11px] font-mono font-medium ${
          isDark 
            ? 'bg-[#0f121a] border-r border-white/[0.08] text-slate-300' 
            : 'bg-slate-100 border-r border-slate-200 text-slate-700'
        }`}>
          {/* IHSG Indicator */}
          {ihsgData ? (
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-1.5 h-1.5 rounded-full ${isIhsgGain ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
              <span className="tracking-tight text-slate-200 font-extrabold">IHSG</span>
              <span className="tabular-nums font-mono text-[11px]">
                {ihsgData.price.toLocaleString('id-ID')}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                isIhsgGain 
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
              }`}>
                {isIhsgGain ? '▲ +' : '▼ '}{ihsgData.changePercent.toFixed(2)}%
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>WIRE</span>
            </div>
          )}

          {ihsgData && (
            <span className="opacity-30 select-none">|</span>
          )}

          {ihsgData && (
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold hidden md:inline">
              WIRE
            </span>
          )}
        </div>

        {/* Marquee Track */}
        <div className="relative flex-1 overflow-hidden flex items-center cursor-pointer">
          <div className="animate-marquee flex items-center gap-8 pl-4 whitespace-nowrap">
            {[...CRYPTO_NEWS_ITEMS, ...CRYPTO_NEWS_ITEMS].map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => {
                  sound.playTick();
                  setActiveNews(item);
                }}
                className={`flex items-center gap-2 text-xs transition-colors py-0.5 cursor-pointer ${
                  isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <span className={`text-[10px] font-mono font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  [{item.tag}]
                </span>
                <span className="hover:underline underline-offset-2">
                  {item.title}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {item.time}
                </span>
                <span className={`select-none ${isDark ? 'text-white/20' : 'text-slate-300'}`}>·</span>
              </div>
            ))}
          </div>

          {/* Subtle fade on right */}
          <div className={`absolute right-0 top-0 bottom-0 w-8 pointer-events-none ${
            isDark 
              ? 'bg-gradient-to-l from-[#0b0e14] to-transparent' 
              : 'bg-gradient-to-l from-slate-50 to-transparent'
          }`} />
        </div>
      </div>

      {/* Clean Mac OS Modal for Reading Item Details */}
      {activeNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className={`relative w-full max-w-md rounded-xl overflow-hidden transition-all ${
            isDark ? 'macos-window bg-[#181a20] text-slate-100' : 'macos-window-light bg-white text-slate-900'
          }`}>
            <div className={`flex items-center justify-between px-3.5 py-2.5 shrink-0 ${
              isDark ? 'macos-titlebar-dark' : 'macos-titlebar-light'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveNews(null)}
                  className="group relative w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center"
                >
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#4c0000] leading-none mb-0.5">×</span>
                </button>
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block" />
              </div>

              <div className="text-xs font-semibold tracking-tight text-center">
                News Dispatch
              </div>

              <div className="w-10" />
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-mono mb-2">
                <span className="font-semibold text-emerald-500">{activeNews.tag}</span>
                <span aria-hidden="true">·</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{activeNews.source}</span>
                <span aria-hidden="true">·</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{activeNews.time}</span>
              </div>

              <h3 className="text-sm font-semibold leading-snug mb-2.5">
                {activeNews.title}
              </h3>

              <div className={`p-3 rounded-lg mb-4 text-xs leading-relaxed ${
                isDark ? 'macos-inset-dark text-slate-300' : 'macos-inset-light text-slate-700'
              }`}>
                {activeNews.details}
              </div>

              {activeNews.impactCoins && (
                <div className={`flex items-center gap-2 pt-2 border-t ${
                  isDark ? 'border-white/[0.06]' : 'border-black/[0.08]'
                }`}>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Related:</span>
                  <div className="flex items-center gap-1.5">
                    {activeNews.impactCoins.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => {
                          setActiveNews(null);
                          onSelectCoinTicker?.(sym);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                          isDark ? 'macos-btn-dark text-slate-200' : 'macos-btn-light text-slate-800'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
