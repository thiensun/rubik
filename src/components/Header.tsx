import React from 'react';
import { Box, Bluetooth, SlidersHorizontal, User } from 'lucide-react';

export type ActiveTab = 'solve-learn' | 'scramble-timer' | 'algorithms';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onOpenSettings }) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-mono-200/60 transition-all">
      <div className="max-w-[1440px] h-14 mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand Logo & Version */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-mono-950 text-white flex items-center justify-center shadow-sm">
              <Box className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <span className="font-bold tracking-tight text-[15px] text-mono-950 font-sans">
              CubeMaster<span className="hidden xs:inline"> AI</span>
            </span>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-medium tracking-tight bg-mono-100 text-mono-500 border border-mono-200/50">
            v2.4
          </span>
        </div>

        {/* Segmented Navigation Pills */}
        <nav className="flex items-center p-0.5 bg-mono-100/80 rounded-full border border-mono-200/60 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('solve-learn')}
            className={`px-2.5 sm:px-3.5 py-1 text-[12px] sm:text-[13px] rounded-full transition-all whitespace-nowrap ${
              activeTab === 'solve-learn'
                ? 'font-semibold text-mono-950 bg-white shadow-sm border border-mono-200/40'
                : 'font-medium text-mono-600 hover:text-mono-950'
            }`}
          >
            <span className="hidden md:inline">1. </span>Solve<span className="hidden sm:inline"> &amp; Learn</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('scramble-timer')}
            className={`px-2.5 sm:px-3.5 py-1 text-[12px] sm:text-[13px] rounded-full transition-all whitespace-nowrap ${
              activeTab === 'scramble-timer'
                ? 'font-semibold text-mono-950 bg-white shadow-sm border border-mono-200/40'
                : 'font-medium text-mono-600 hover:text-mono-950'
            }`}
          >
            <span className="hidden md:inline">2. </span>Scramble<span className="hidden sm:inline"> &amp; Timer</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('algorithms')}
            className={`px-2.5 sm:px-3.5 py-1 text-[12px] sm:text-[13px] rounded-full transition-all whitespace-nowrap ${
              activeTab === 'algorithms'
                ? 'font-semibold text-mono-950 bg-white shadow-sm border border-mono-200/40'
                : 'font-medium text-mono-600 hover:text-mono-950'
            }`}
          >
            Algorithms
          </button>
        </nav>

        {/* Right Controls: WCA Pill, Smart Cube Monochrome Indicator, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* 3x3x3 WCA Standard Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mono-100/70 border border-mono-200/60 text-mono-700 text-xs font-mono font-medium">
            <Box className="w-3.5 h-3.5 text-mono-500" />
            <span>3x3x3 WCA</span>
          </div>

          {/* Smart Cube Sync Badge */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-mono-200/80 hover:border-mono-300 text-mono-800 text-xs font-medium shadow-sm transition-colors group"
            title="Smart Cube Bluetooth Telemetry"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
            <span className="text-mono-600 text-[11px] font-mono">GAN UI</span>
            <Bluetooth className="w-3.5 h-3.5 text-mono-500" />
          </button>

          <div className="hidden sm:block h-4 w-px bg-mono-200 mx-0.5" />

          <button
            type="button"
            aria-label="Settings"
            onClick={onOpenSettings}
            className="w-7 h-7 rounded-full flex items-center justify-center text-mono-500 hover:text-mono-900 hover:bg-mono-100 transition-colors"
            title="Settings &amp; Preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div
            className="w-7 h-7 rounded-full bg-mono-950 text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-mono-800 transition-colors"
            title="User Profile"
          >
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
};
