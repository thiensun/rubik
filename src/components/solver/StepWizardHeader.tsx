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
    <section className="bg-white border border-[#EAECEF] rounded-2xl p-2.5 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-center">
      <div className="w-full flex items-center justify-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar">
        {/* Step 01 */}
        <button
          type="button"
          onClick={() => onSelectStep(1)}
          className={`min-h-[44px] sm:min-h-[38px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 ease-out active:scale-[0.98] whitespace-nowrap cursor-pointer ${
            currentStep === 1
              ? 'bg-[#111111] text-white font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
              : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#111111] font-semibold'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 1
                ? 'bg-white text-[#111111]'
                : currentStep > 1
                ? 'bg-[#111111] text-white'
                : 'bg-[#EAECEF] text-[#64748B]'
            }`}
          >
            {currentStep > 1 ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : '1'}
          </span>
          <span className="hidden sm:inline">01. SELECT LEVEL</span>
          <span className="sm:hidden">01. LEVEL</span>
        </button>

        <div className="w-3 sm:w-8 h-px bg-[#EAECEF] shrink-0" />

        {/* Step 02 */}
        <button
          type="button"
          onClick={() => onSelectStep(2)}
          className={`min-h-[44px] sm:min-h-[38px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 ease-out active:scale-[0.98] whitespace-nowrap cursor-pointer ${
            currentStep === 2
              ? 'bg-[#111111] text-white font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
              : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#111111] font-semibold'
          }`}
        >
          {currentStep > 2 ? (
            <span className="w-4 h-4 rounded-full bg-[#111111] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
            </span>
          ) : (
            <Camera className="w-3.5 h-3.5 stroke-[1.75]" />
          )}
          <span className="hidden sm:inline">02. CAMERA SCAN</span>
          <span className="sm:hidden">02. SCAN</span>
        </button>

        <div className="w-3 sm:w-8 h-px bg-[#EAECEF] shrink-0" />

        {/* Step 03 */}
        <button
          type="button"
          onClick={() => onSelectStep(3)}
          className={`min-h-[44px] sm:min-h-[38px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 ease-out active:scale-[0.98] whitespace-nowrap cursor-pointer ${
            currentStep === 3
              ? 'bg-[#111111] text-white font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
              : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#111111] font-semibold'
          }`}
        >
          <Box className="w-3.5 h-3.5 stroke-[1.75]" />
          <span className="hidden sm:inline">03. 3D SOLUTION</span>
          <span className="sm:hidden">03. 3D SOLVE</span>
        </button>
      </div>
    </section>
  );
};
