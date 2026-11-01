import React from 'react';
import { Box, Bluetooth, SlidersHorizontal, User } from 'lucide-react';

export type ActiveTab = 'solve-learn' | 'scramble-timer' | 'algorithms';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  isTimerRunning?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  isTimerRunning = false,
  className = '',
}) => {
  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-white/85 backdrop-blur-md border-b border-mono-200/60 safe-area-top transition-all duration-300 ${
        isTimerRunning ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100 translate-y-0'
      } ${className}`}
    >
      <div className="max-w-[1440px] h-14 mx-auto px-3 sm:px-6 flex items-center justify-between gap-1 sm:gap-2">
        {/* Brand Logo & Version */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-6 h-6 rounded-md bg-mono-950 text-white flex items-center justify-center shadow-sm">
              <Box className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <span className="font-bold tracking-tight text-[14px] sm:text-[15px] text-mono-950 font-sans">
              CubeMaster<span className="hidden sm:inline"> AI</span>
            </span>
          </div>
          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-medium tracking-tight bg-mono-100 text-mono-500 border border-mono-200/50">
            v2.4
          </span>
        </div>

        {/* Segmented Navigation Pills - Visible on Desktop/Tablet (>= lg), cleanly replaced by Bottom Navigation Bar on Mobile (< lg) */}
        <nav className="hidden lg:flex items-center gap-1 sm:gap-2 p-0.5 bg-mono-100/80 rounded-full border border-mono-200/60 shrink-0 overflow-x-auto max-w-[55vw] sm:max-w-none">
          <button
            type="button"
            onClick={() => onTabChange('solve-learn')}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${
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
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${
              activeTab === 'scramble-timer'
                ? 'font-semibold text-mono-950 bg-white shadow-sm border border-mono-200/40'
                : 'font-medium text-mono-600 hover:text-mono-950'
            }`}
          >
            <span className="hidden md:inline">2. </span><span className="sm:hidden">Timer</span><span className="hidden sm:inline">Scramble &amp; Timer</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('algorithms')}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${
              activeTab === 'algorithms'
                ? 'font-semibold text-mono-950 bg-white shadow-sm border border-mono-200/40'
                : 'font-medium text-mono-600 hover:text-mono-950'
            }`}
          >
            <span className="sm:hidden">Algs</span><span className="hidden sm:inline">Algorithms</span>
          </button>
        </nav>

        {/* Right Controls: Smart Cube Monochrome Indicator, Settings */}
        {/* Preserves mobile hiding test: hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mono-100/70 */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

          {/* Smart Cube Sync Badge */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-mono-200/80 hover:border-mono-300 text-mono-800 text-xs font-medium shadow-sm transition-colors group cursor-pointer"
            title="Smart Cube Bluetooth Telemetry"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
            <span className="text-mono-600 text-[11px] font-mono">GAN UI</span>
            <Bluetooth className="w-3.5 h-3.5 text-mono-500" />
          </button>

          <div className="hidden sm:block h-4 w-px bg-mono-200 mx-0.5" />

          {/* Settings Gear - Prominently sized for Apple HIG 44px tap target on mobile */}
          <button
            type="button"
            aria-label="Settings"
            onClick={onOpenSettings}
            className="w-9 h-9 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-mono-600 hover:text-mono-900 hover:bg-mono-100 transition-colors cursor-pointer"
            title="Cài đặt & Tùy chọn"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* User Profile on Desktop */}
          <div
            className="hidden sm:flex w-7 h-7 rounded-full bg-mono-950 text-white items-center justify-center shadow-sm cursor-pointer hover:bg-mono-800 transition-colors"
            title="User Profile"
          >
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
};
