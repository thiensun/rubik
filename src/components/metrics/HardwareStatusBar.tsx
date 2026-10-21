import React from 'react';
import { Bluetooth, Sliders } from 'lucide-react';

interface HardwareStatusBarProps {
  onSimulateSolve: () => void;
  onOpenSettings?: () => void;
}

export const HardwareStatusBar: React.FC<HardwareStatusBarProps> = ({
  onSimulateSolve,
  onOpenSettings,
}) => {
  return (
    <div className="bg-white rounded-xl border border-mono-200/70 p-3 shadow-apple flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-mono-100 text-mono-800 flex items-center justify-center">
          <Bluetooth className="w-[18px] h-[18px]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-mono-900 leading-tight">GAN 12 UI MagLev</p>
          <p className="text-[11px] font-mono text-mono-500">100% Battery · 12ms gyro latency</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="space-trigger-btn"
          onClick={onSimulateSolve}
          className="px-2.5 py-1 rounded-lg bg-mono-100 hover:bg-mono-200/80 text-mono-700 text-xs font-medium transition-colors"
        >
          Simulate Space
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-mono-400 hover:text-mono-900 transition-colors"
          title="Device settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
