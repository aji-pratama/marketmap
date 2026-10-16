import React from 'react';
import { ColorMode, PhysicsSettings, ThemeMode } from '../types/crypto';
import { RotateCcw, Check, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  physics: PhysicsSettings;
  colorMode: ColorMode;
  theme: ThemeMode;
  liveSimulation: boolean;
  onUpdatePhysics: (physics: PhysicsSettings) => void;
  onUpdateColorMode: (mode: ColorMode) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
  onToggleLiveSimulation: () => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  physics,
  colorMode,
  theme,
  liveSimulation,
  onUpdatePhysics,
  onUpdateColorMode,
  onUpdateTheme,

  onToggleLiveSimulation,
  onResetDefaults,
  onClose,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs select-none">
      <div 
        className={`relative w-full max-w-md rounded-xl overflow-hidden flex flex-col transition-all border ${
          isDark 
            ? 'macos-window bg-[#22242e] text-slate-100 border-white/[0.14]' 
            : 'macos-window-light bg-[#f8f9fb] text-slate-900 border-black/[0.1]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classic Mac OS Titlebar with Traffic Lights */}
        <div className={`flex items-center justify-between px-3.5 py-2.5 shrink-0 border-b ${
          isDark ? 'macos-titlebar-dark border-b-black/40' : 'macos-titlebar-light border-b-black/10'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              title="Close settings"
              className="group relative w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#4c0000] leading-none mb-0.5">×</span>
            </button>
            <button
              onClick={() => {
                onClose();
              }}
              title="Minimize settings"
              className="group relative w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#5c3c00] leading-none mb-0.5">−</span>
            </button>
            <button
              title="Zoom settings"
              className="group relative w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-default"
            >
              <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold text-[#0b4713] leading-none mb-0.5">+</span>
            </button>
          </div>

          <div className="text-xs font-semibold tracking-tight text-center">
            System Preferences
          </div>

          <div className="w-10" />
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Theme Selector */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider font-semibold block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                    onUpdateTheme('dark');
                }}
                className={`p-2.5 rounded-lg text-left flex items-center justify-between transition-all ${
                  isDark
                    ? 'macos-btn-dark ring-1 ring-emerald-500/50 text-white font-semibold'
                    : isDark ? 'macos-inset-dark text-slate-300' : 'macos-inset-light text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dark</span>
                </div>
                {isDark && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                onClick={() => {
                    onUpdateTheme('light');
                }}
                className={`p-2.5 rounded-lg text-left flex items-center justify-between transition-all ${
                  !isDark
                    ? 'macos-btn-light ring-1 ring-emerald-500/50 text-slate-900 font-semibold'
                    : isDark ? 'macos-inset-dark text-slate-300' : 'macos-inset-light text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </div>
                {!isDark && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider font-semibold block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Color Palette
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'classic' as ColorMode, label: 'Classic Apple', desc: 'Emerald & Ruby' },
                { id: 'colorblind' as ColorMode, label: 'Colorblind Safe', desc: 'Blue & Amber' },
                { id: 'neon' as ColorMode, label: 'Vibrant Glass', desc: 'Saturated tints' },
                { id: 'monochrome' as ColorMode, label: 'Monochrome', desc: 'Graphite scale' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                        onUpdateColorMode(opt.id);
                  }}
                  className={`p-2.5 rounded-lg text-left transition-all ${
                    colorMode === opt.id
                      ? isDark ? 'macos-btn-dark ring-1 ring-emerald-500/50 text-white font-semibold' : 'macos-btn-light ring-1 ring-emerald-500/50 font-semibold'
                      : isDark ? 'macos-inset-dark text-slate-300' : 'macos-inset-light text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs">{opt.label}</span>
                    {colorMode === opt.id && <Check className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bubble Count Slider */}
          <div className={`p-3 rounded-lg space-y-2 ${
            isDark ? 'macos-inset-dark' : 'macos-inset-light'
          }`}>
            <div className="flex justify-between items-center text-xs">
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Displayed Assets</span>
              <span className="font-mono font-semibold tabular-nums">{physics.bubbleCount} assets</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={physics.bubbleCount}
              onChange={(e) => {
                onUpdatePhysics({ ...physics, bubbleCount: parseInt(e.target.value, 10) });
              }}
              className="w-full cursor-pointer accent-emerald-500"
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>20 (Minimal)</span>
              <span>50 (Balanced)</span>
              <span>100 (Full 70-80%)</span>
            </div>
          </div>

          {/* Live Streaming Toggle */}
          <div className={`p-3 rounded-lg ${
            isDark ? 'macos-inset-dark' : 'macos-inset-light'
          }`}>
            <div className="flex items-center justify-between">

              <div>
                <div className="font-semibold text-xs">Live Streaming Feed</div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time WebSocket ticker updates</div>
              </div>
              <button
                onClick={() => {
                    onToggleLiveSimulation();
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
                  liveSimulation 
                    ? isDark ? 'macos-btn-dark text-emerald-400 font-bold' : 'macos-btn-light text-emerald-700 font-bold'
                    : isDark ? 'macos-inset-dark text-slate-500' : 'macos-inset-light text-slate-500'
                }`}
              >
                {liveSimulation ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-4 py-2.5 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'macos-titlebar-dark border-t-black/40' : 'macos-titlebar-light border-t-[#b8b8b8]'
        }`}>
          <button
            onClick={onResetDefaults}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${
              isDark ? 'macos-btn-dark text-white' : 'macos-btn-light text-slate-900'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
