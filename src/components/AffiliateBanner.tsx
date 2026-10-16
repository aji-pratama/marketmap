import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { ArrowUpRight, X } from 'lucide-react';

export const AffiliateBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
      <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-[#1c1c1e]/90 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] pointer-events-auto">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <p className="text-xs text-white/80 truncate font-normal">
            <span className="font-semibold text-white mr-1.5">Exchange Benefits:</span>
            <span className="text-white/60 hidden sm:inline">20% fee discount & up to $30,000 bonus on Binance & Bybit</span>
            <span className="text-white/60 sm:hidden">20% fee discount on Binance</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://accounts.binance.com/register?ref=BUBBLE20"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all shadow-sm"
          >
            <span>Claim</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
          <button
            onClick={() => {
              sound.playTick();
              setIsDismissed(true);
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors hover:bg-white/10"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
