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
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-[#EAECEF] py-2 px-6 flex justify-around items-center safe-area-bottom lg:hidden transition-all duration-300 ${
        isTimerRunning ? 'opacity-0 pointer-events-none translate-y-6' : 'opacity-100 translate-y-0 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]'
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
            className={`min-h-[44px] min-w-[70px] flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer group ${
              isActive ? 'text-[#111111]' : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8] group-hover:scale-105'
                }`}
              />
            </div>
            <span
              className={`text-[11px] font-sans tracking-tight leading-none ${
                isActive ? 'font-bold text-[#111111]' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
            {isActive ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
export default BottomNavBar;
