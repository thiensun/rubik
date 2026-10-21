import React from 'react';
import { Camera, Box, Check } from 'lucide-react';

interface StepWizardHeaderProps {
  currentStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
  currentFaceNumber?: number;
}

export const StepWizardHeader: React.FC<StepWizardHeaderProps> = ({
  currentStep,
  onSelectStep,
}) => {
  return (
    <section className="bg-white border border-[#EAECEF] rounded-2xl p-3 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
      {/* Left: Wizard Stage / Precision HUD Label */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          WIZARD STAGE
        </span>
        <span className="text-neutral-300">/</span>
        <span className="font-mono text-[11px] sm:text-[12px] font-bold text-neutral-900">
          PRECISION HUD ACTIVE
        </span>
      </div>

      {/* Center: 3-Step Technical HUD Progress Indicator */}
      <div className="w-full md:w-auto flex items-center justify-center gap-1.5 sm:gap-3">
        {/* Step 01: SELECT LEVEL & METHOD */}
        <button
          type="button"
          onClick={() => onSelectStep(1)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-mono transition-all ${
            currentStep === 1
              ? 'bg-[#111111] text-white shadow-xs font-bold'
              : currentStep > 1
              ? 'bg-[#F2F4F7] text-neutral-800 hover:text-neutral-950 font-semibold'
              : 'bg-[#F2F4F7] text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${
              currentStep === 1
                ? 'bg-white text-[#111111]'
                : currentStep > 1
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-300 text-neutral-700'
            }`}
          >
            {currentStep > 1 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '1'}
          </span>
          <span className="hidden sm:inline">01. SELECT LEVEL &amp; METHOD</span>
          <span className="sm:hidden">01. LEVEL</span>
        </button>

        {/* Line Connector 1 */}
        <div className="w-3 sm:w-8 h-[1.5px] bg-[#EAECEF]" />

        {/* Step 02: 6-FACE CAMERA SCAN */}
        <button
          type="button"
          onClick={() => onSelectStep(2)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-mono transition-all ${
            currentStep === 2
              ? 'bg-[#111111] text-white shadow-xs font-bold'
              : currentStep > 2
              ? 'bg-[#F2F4F7] text-neutral-800 hover:text-neutral-950 font-semibold'
              : 'bg-[#F2F4F7] text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          {currentStep > 2 ? (
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] sm:text-[10px]">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          ) : (
            <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-400" />
          )}
          <span className="hidden sm:inline">02. 6-FACE CAMERA SCAN</span>
          <span className="sm:hidden">02. SCAN</span>
        </button>

        {/* Line Connector 2 */}
        <div className="w-3 sm:w-8 h-[1.5px] bg-[#EAECEF]" />

        {/* Step 03: INTERACTIVE 3D SOLUTION */}
        <button
          type="button"
          onClick={() => onSelectStep(3)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-mono transition-all ${
            currentStep === 3
              ? 'bg-[#111111] text-white shadow-xs font-bold'
              : 'bg-[#F2F4F7] text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <Box className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">03. INTERACTIVE 3D SOLUTION</span>
          <span className="sm:hidden">03. 3D SOLVE</span>
        </button>
      </div>

      {/* Right: System Status Indicator */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-neutral-500">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>SOLVER ENGINE: IDLE</span>
      </div>
    </section>
  );
};
