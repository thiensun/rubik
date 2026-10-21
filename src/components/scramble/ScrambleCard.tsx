import React, { useState } from 'react';
import { RotateCw, Copy, Check, Timer as TimerIcon } from 'lucide-react';
import { CubeNet2D } from './CubeNet2D';
import { CubeNetState } from '../../utils/cubeState';

interface ScrambleCardProps {
  scramble: string;
  roundNumber?: number;
  solveNumber?: number;
  onNextScramble: () => void;
  cubeNetState: CubeNetState;
  inspectionEnabled: boolean;
  onToggleInspection: () => void;
}

export const ScrambleCard: React.FC<ScrambleCardProps> = ({
  scramble,
  roundNumber = 2,
  solveNumber = 42,
  onNextScramble,
  cubeNetState,
  inspectionEnabled,
  onToggleInspection,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scramble);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  const moveCount = scramble.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full bg-white border border-[#EAECEF] rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Metadata, Scramble Text, Actions */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F1F3F5] text-[11px] font-mono text-neutral-600 font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
              WCA Rule 4b
            </span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F1F3F5] text-[11px] font-mono text-neutral-600 font-medium tracking-wide">
              Round {roundNumber} · #{solveNumber}
            </span>

            <span className="text-[11px] font-mono text-neutral-400 font-medium tracking-wide">
              | {moveCount} Moves (HTM)
            </span>
          </div>

          {/* Monospace Scramble Display Box */}
          <div className="bg-[#F8F9FA] border border-[#EAECEF] rounded-2xl p-4 md:p-5 mb-4 select-all">
            <p className="font-mono text-[19px] md:text-[21px] font-bold text-neutral-900 tracking-wide leading-relaxed">
              {scramble}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Matte Black Next Scramble Button */}
            <button
              onClick={onNextScramble}
              className="inline-flex items-center gap-2 bg-[#111111] hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide shadow-sm transition-all active:scale-[0.98]"
              title="Next Scramble (Alt+N)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Next Scramble</span>
              <span className="keycap-dark ml-0.5">Alt+N</span>
            </button>

            {/* White Copy Button */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#F8F9FA] text-neutral-700 border border-[#EAECEF] px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide shadow-sm transition-all active:scale-[0.98]"
              title="Copy Scramble Formula"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <div className="h-4 w-[1px] bg-[#EAECEF] mx-0.5" />

            {/* 15s Inspection Toggle */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={inspectionEnabled}
                onClick={onToggleInspection}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  inspectionEnabled ? 'bg-[#111111]' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    inspectionEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>

              <div
                onClick={onToggleInspection}
                className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                <TimerIcon className="w-3.5 h-3.5 text-neutral-400" />
                <span>15s Inspection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 2D Unfolded Net Preview */}
        <div className="lg:border-l lg:border-[#EAECEF] lg:pl-8 flex flex-col items-center justify-center min-w-[210px]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              SCRAMBLE PREVIEW
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[10px] font-mono text-neutral-500 font-bold uppercase">
              2D NET
            </span>
          </div>

          <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#EAECEF]">
            <CubeNet2D state={cubeNetState} />
          </div>
        </div>
      </div>
    </div>
  );
};
