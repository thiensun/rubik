import React from 'react';
import {
  AlertTriangle,
  Camera,
  Sparkles,
  X,
  RotateCcw,
  Check,
  Copy,
} from 'lucide-react';
import { SolveRecord } from '../../../types/cubing';

interface SolveBannerAlertsProps {
  isMissingScannedCube: boolean;
  onBackToScan: () => void;
  onLoadDemo: () => void;
  onDismissAlert: () => void;
  demoScramble: string | null;
  analyzedSolve?: SolveRecord | null;
  onResetToDemo: () => void;
  onCopyDemoScramble: (scramble: string) => void;
  copiedDemoScramble: boolean;
}

export const SolveBannerAlerts: React.FC<SolveBannerAlertsProps> = ({
  isMissingScannedCube,
  onBackToScan,
  onLoadDemo,
  onDismissAlert,
  demoScramble,
  analyzedSolve,
  onResetToDemo,
  onCopyDemoScramble,
  copiedDemoScramble,
}) => {
  return (
    <>
      {/* ALERT BANNER: NO SCANNED RUBIK FOUND */}
      {isMissingScannedCube && (
        <section className="w-full bg-amber-50 border border-amber-300 rounded-[20px] p-4 sm:p-5 shadow-[0_2px_12px_rgba(245,158,11,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in text-amber-950 font-sans">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-neutral-900">
                  Chưa phát hiện khối Rubik đã quét (Scanned Rubik Not Found)
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300">
                  CHƯA QUÉT CAMERA
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-neutral-600 mt-1 leading-relaxed">
                Khối Rubik 3D bên dưới hiện đang dùng trạng thái mẫu mặc định vì chưa nhận được dữ liệu quét 6 mặt từ camera Bước 2. Hãy quay lại quét camera để nhận diện đúng khối Rubik của bạn hoặc nạp khối mẫu xáo trộn sẵn.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={onBackToScan}
              className="px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Quay Lại Quét Camera</span>
              <kbd className="hidden sm:inline-block keycap-dark ml-0.5">Alt+S</kbd>
            </button>

            <button
              type="button"
              onClick={onLoadDemo}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-[#D0D5DD] font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Dùng khối Rubik mẫu xáo trộn sẵn để kiểm tra thử"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Dùng Khối Mẫu (Demo)</span>
            </button>

            <button
              type="button"
              onClick={onDismissAlert}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
              title="Đóng thông báo này"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* DEMO SCRAMBLE HUD CARD */}
      {demoScramble && (
        <section className="w-full bg-[#111111] text-white rounded-[20px] p-3.5 sm:px-5 sm:py-4 border border-neutral-800 shadow-md flex flex-col md:flex-row md:items-start justify-between gap-3.5 animate-fade-in font-mono">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              <span className={`w-2 h-2 rounded-full animate-ping ${analyzedSolve ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span
                className={`px-2 py-0.5 rounded text-black text-[10px] sm:text-[11px] font-black tracking-wider uppercase ${
                  analyzedSolve ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              >
                {analyzedSolve
                  ? `SOLVE #${analyzedSolve.id} (${(analyzedSolve.timeMs / 1000).toFixed(2)}s) · ${demoScramble.trim().split(/\s+/).filter(Boolean).length} BƯỚC`
                  : `DEMO SCRAMBLE · ${demoScramble.trim().split(/\s+/).filter(Boolean).length} BƯỚC`}
              </span>
            </div>
            <div className="text-xs sm:text-[13.5px] font-bold tracking-wider text-neutral-100 whitespace-normal break-words leading-relaxed select-all flex-1">
              {demoScramble}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={onResetToDemo}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 border border-white/10 shadow-2xs cursor-pointer"
              title="Khôi phục lại màu khối Rubik chuẩn từ Demo Scramble"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Màu Demo</span>
            </button>
            <button
              type="button"
              onClick={() => onCopyDemoScramble(demoScramble)}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center gap-1.5 border border-white/10 shadow-2xs cursor-pointer"
              title="Sao chép công thức xáo trộn demo"
            >
              {copiedDemoScramble ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-400 font-bold">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Sao chép Scramble</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </>
  );
};
