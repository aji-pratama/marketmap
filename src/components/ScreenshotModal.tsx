import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { Download, Copy, Check } from 'lucide-react';

interface ScreenshotModalProps {
  imageSrc: string;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  imageSrc,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    sound.playTick();
    const link = document.createElement('a');
    link.download = `MarketMap-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = imageSrc;
    link.click();
  };

  const handleCopy = async () => {
    try {
      sound.playTick();
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none">
      <div
        className="relative w-full max-w-2xl macos-window bg-[#181a20] rounded-xl overflow-hidden flex flex-col text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classic Mac OS Titlebar with Traffic Lights */}
        <div className="flex items-center justify-between px-3.5 py-2.5 shrink-0 macos-titlebar-dark">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTick();
                onClose();
              }}
              title="Close window"
              className="group relative w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#4c0000] leading-none mb-0.5">×</span>
            </button>
            <button
              onClick={() => {
                sound.playTick();
                onClose();
              }}
              title="Minimize"
              className="group relative w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#5c3c00] leading-none mb-0.5">−</span>
            </button>
            <button
              title="Zoom"
              className="group relative w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-default"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold text-[#0b4713] leading-none mb-0.5">+</span>
            </button>
          </div>

          <div className="text-xs font-semibold tracking-tight text-center">
            Market Snapshot Preview
          </div>

          <div className="w-10" />
        </div>

        <div className="p-5 flex flex-col items-center">
          <div className="w-full max-h-[55vh] overflow-hidden rounded-lg macos-inset-dark flex items-center justify-center p-1">
            <img
              src={imageSrc}
              alt="CryptoBubbles Snapshot"
              className="max-h-[53vh] w-auto object-contain rounded"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2.5 text-center">
            High-resolution PNG export with current live market pricing.
          </p>
        </div>

        <div className="px-4 py-2.5 border-t border-t-black/40 macos-titlebar-dark flex items-center justify-end gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-200 text-xs macos-btn-dark transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg macos-btn-dark text-white font-semibold text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save to Disk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
