import React from 'react';
import { Box, Timer, BookOpen } from 'lucide-react';
import { ActiveTab } from '../Header';
import { haptic } from '../../utils/haptics';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isTimerRunning?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  isTimerRunning = false,
}) => {
  const tabs = [
    {
      id: 'solve-learn' as ActiveTab,
      label: 'Solve & Learn',
      icon: Box,
    },
    {
      id: 'scramble-timer' as ActiveTab,
      label: 'Timer',
      icon: Timer,
    },
    {
      id: 'algorithms' as ActiveTab,
      label: 'Algorithms',
      icon: BookOpen,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#EAECEF] py-2 px-6 flex justify-around items-center safe-area-bottom lg:hidden transition-all duration-200 ease-out ${
        isTimerRunning
          ? 'opacity-0 pointer-events-none translate-y-6'
          : 'opacity-100 translate-y-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]'
      }`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              haptic.tick();
              onTabChange(tab.id);
            }}
            className={`min-h-[44px] min-w-[76px] flex flex-col items-center justify-center gap-1 transition-all duration-200 ease-out active:scale-[0.98] select-none cursor-pointer group ${
              isActive ? 'text-[#111111]' : 'text-[#94A3B8] hover:text-[#111111]'
            }`}
          >
            <Icon
              strokeWidth={1.5}
              className={`w-5 h-5 transition-transform duration-200 ease-out ${
                isActive ? 'scale-105' : 'scale-100 group-hover:scale-105'
              }`}
            />
            <span
              className={`text-[11px] font-sans tracking-tight leading-none ${
                isActive ? 'font-semibold text-[#111111]' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-opacity duration-200 ${
                isActive ? 'bg-[#111111] opacity-100' : 'bg-transparent opacity-0'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
