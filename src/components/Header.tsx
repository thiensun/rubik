import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { CubeSize } from '../core/types';

export type ActiveTab = 'solve-learn' | 'scramble-timer' | 'algorithms';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  cubeSize?: CubeSize;
  onCubeSizeChange?: (size: CubeSize) => void;
  isTimerRunning?: boolean;
  className?: string;
}

const CUBE_SIZES: { size: CubeSize; label: string }[] = [
  { size: 2, label: '2x2' },
  { size: 3, label: '3x3' },
  { size: 4, label: '4x4' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  cubeSize = 3,
  onCubeSizeChange,
  isTimerRunning = false,
  className = '',
}) => {
  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-[#F8F9FA]/85 backdrop-blur-md border-b border-[#EAECEF] safe-area-top transition-all duration-200 ease-out ${
        isTimerRunning ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100 translate-y-0'
      } ${className}`}
    >
      <div className="max-w-[1440px] h-14 mx-auto px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand Logo + Segmented Cube Size Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8 lg:w-9 lg:h-9 shrink-0">
              <rect width="100" height="100" rx="24" fill="#111111" />
              <rect x="16" y="16" width="20" height="20" rx="5" fill="#F59E0B" />
              <rect x="40" y="16" width="20" height="20" rx="5" fill="#10B981" />
              <rect x="64" y="16" width="20" height="20" rx="5" fill="#FFFFFF" />
              <rect x="16" y="40" width="20" height="20" rx="5" fill="#EF4444" />
              <rect x="40" y="40" width="20" height="20" rx="5" fill="#3B82F6" />
              <rect x="64" y="40" width="20" height="20" rx="5" fill="#FBBF24" />
              <rect x="16" y="64" width="20" height="20" rx="5" fill="#F59E0B" />
              <rect x="40" y="64" width="20" height="20" rx="5" fill="#FFFFFF" />
              <rect x="64" y="64" width="20" height="20" rx="5" fill="#10B981" />
            </svg>
            <span className="font-bold tracking-tight text-[15px] text-[#111111] font-sans">
              CubeMaster<span className="hidden sm:inline"> AI</span>
            </span>
          </div>

          {/* Monochrome Segmented Cube Size Switcher: [ 2x2 | 3x3 | 4x4 ] */}
          <div
            role="group"
            aria-label="Cube Size Switcher"
            className="bg-[#F1F5F9] p-1 rounded-xl border border-[#EAECEF] flex items-center gap-0.5 ml-0.5 sm:ml-1"
          >
            {CUBE_SIZES.map((item) => {
              const isActive = cubeSize === item.size;
              return (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => onCubeSizeChange?.(item.size)}
                  className={`font-mono text-xs px-2 sm:px-2.5 py-1 rounded-lg transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#111111] text-white font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                      : 'text-[#64748B] hover:text-[#111111] font-medium'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Segmented Navigation Pills */}
        <nav className="hidden lg:flex items-center gap-1 sm:gap-2 p-1 bg-[#F1F5F9] rounded-2xl border border-[#EAECEF] shrink-0 overflow-x-auto max-w-[55vw] sm:max-w-none">
          <button
            type="button"
            onClick={() => onTabChange('solve-learn')}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-xl transition-all duration-200 ease-out active:scale-[0.98] whitespace-nowrap cursor-pointer ${
              activeTab === 'solve-learn'
                ? 'font-semibold text-white bg-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                : 'font-medium text-[#64748B] hover:text-[#111111]'
            }`}
          >
            <span className="hidden md:inline">1. </span>Solve<span className="hidden sm:inline"> &amp; Learn</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('scramble-timer')}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-xl transition-all duration-200 ease-out active:scale-[0.98] whitespace-nowrap cursor-pointer ${
              activeTab === 'scramble-timer'
                ? 'font-semibold text-white bg-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                : 'font-medium text-[#64748B] hover:text-[#111111]'
            }`}
          >
            <span className="hidden md:inline">2. </span><span className="sm:hidden">Timer</span><span className="hidden sm:inline">Scramble &amp; Timer</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('algorithms')}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-xl transition-all duration-200 ease-out active:scale-[0.98] whitespace-nowrap cursor-pointer ${
              activeTab === 'algorithms'
                ? 'font-semibold text-white bg-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                : 'font-medium text-[#64748B] hover:text-[#111111]'
            }`}
          >
            <span className="sm:hidden">Algs</span><span className="hidden sm:inline">Algorithms</span>
          </button>
        </nav>

        {/* Right Controls: Minimal Settings Trigger (desktop avatar removed for strict minimalism; ref token: hidden sm:flex w-7 h-7 rounded-full bg-mono-950) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            aria-label="Settings"
            onClick={onOpenSettings}
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#111111] hover:bg-[#F1F5F9] transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer"
            title="Cài đặt & Tùy chọn"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </header>
  );
};
