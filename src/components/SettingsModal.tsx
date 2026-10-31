import React from 'react';
import { X, Volume2, Sliders, ShieldCheck, Palette, Check } from 'lucide-react';
import { sound } from '../utils/audio';
import {
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
  PRESET_COLOR_SCHEMES,
} from '../engine/algSimulator';
import { CUBE_HEX_COLORS } from '../utils/cubeState';

export type ColorSchemePresetKey =
  | 'white-bottom'
  | 'yellow-bottom'
  | 'green-bottom'
  | 'blue-bottom'
  | 'red-bottom'
  | 'orange-bottom';

export const COLOR_SCHEME_OPTIONS: {
  key: ColorSchemePresetKey;
  titleVi: string;
  subtitleVi: string;
  badge: string;
}[] = [
  {
    key: 'white-bottom',
    titleVi: 'Chuẩn Quốc Tế (Đáy Trắng · Đỉnh Vàng · Trước Xanh Lá)',
    subtitleVi: 'D: White · U: Yellow · F: Green · R: Red (Mặc định WCA)',
    badge: 'DEFAULT',
  },
  {
    key: 'yellow-bottom',
    titleVi: 'Đáy Vàng · Đỉnh Trắng (Yellow Cross / Dual CN)',
    subtitleVi: 'D: Yellow · U: White · F: Green · R: Orange',
    badge: 'DUAL CN',
  },
  {
    key: 'green-bottom',
    titleVi: 'Đáy Xanh Lá · Đỉnh Xanh Dương (Green Cross)',
    subtitleVi: 'D: Green · U: Blue · F: White · R: Red',
    badge: 'FULL CN',
  },
  {
    key: 'blue-bottom',
    titleVi: 'Đáy Xanh Dương · Đỉnh Xanh Lá (Blue Cross)',
    subtitleVi: 'D: Blue · U: Green · F: Yellow · R: Red',
    badge: 'FULL CN',
  },
  {
    key: 'red-bottom',
    titleVi: 'Đáy Đỏ · Đỉnh Cam (Red Cross)',
    subtitleVi: 'D: Red · U: Orange · F: Green · R: Yellow',
    badge: 'FULL CN',
  },
  {
    key: 'orange-bottom',
    titleVi: 'Đáy Cam · Đỉnh Đỏ (Orange Cross)',
    subtitleVi: 'D: Orange · U: Red · F: Green · R: White',
    badge: 'FULL CN',
  },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  inspectionEnabled: boolean;
  onToggleInspection: () => void;
  colorSchemeKey?: ColorSchemePresetKey;
  onChangeColorSchemeKey?: (key: ColorSchemePresetKey) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  inspectionEnabled,
  onToggleInspection,
  colorSchemeKey = 'white-bottom',
  onChangeColorSchemeKey,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#EAECEF] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAECEF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] flex items-center justify-center">
              <Sliders className="w-4 h-4 text-neutral-700" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                Cube Color &amp; Orientation HUD
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                Precision HUD Settings · Color Neutral &amp; WCA Preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* 1. CUBE COLOR & ORIENTATION HUD (COLOR NEUTRAL MODE) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-neutral-700" />
                <span className="text-xs font-extrabold uppercase tracking-wider font-mono text-neutral-900">
                  Hệ Quy Chiếu Màu Khối (Color Neutral Mode)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-[#EAECEF]">
                2D SVG + 3D Cube Sync
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {COLOR_SCHEME_OPTIONS.map((opt) => {
                const scheme: ColorScheme =
                  PRESET_COLOR_SCHEMES[opt.key] || DEFAULT_COLOR_SCHEME;
                const isSelected = colorSchemeKey === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onChangeColorSchemeKey?.(opt.key);
                      sound.playTick();
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#111111] text-white border-[#111111] shadow-md'
                        : 'bg-[#F8F9FA] hover:bg-neutral-100 text-neutral-900 border-[#EAECEF]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mini 3-dot swatch showing Bottom (D), Top (U), Front (F) */}
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span
                          className="w-4 h-4 rounded-full border border-black/25 shadow-2xs"
                          style={{ backgroundColor: CUBE_HEX_COLORS[scheme.D] }}
                          title={`Đáy D: ${scheme.D}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-black/25 shadow-2xs"
                          style={{ backgroundColor: CUBE_HEX_COLORS[scheme.U] }}
                          title={`Đỉnh U: ${scheme.U}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-black/25 shadow-2xs"
                          style={{ backgroundColor: CUBE_HEX_COLORS[scheme.F] }}
                          title={`Trước F: ${scheme.F}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {opt.titleVi}
                        </div>
                        <div
                          className={`text-[10.5px] font-mono truncate ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-400'
                          }`}
                        >
                          {opt.subtitleVi}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-emerald-500 text-black'
                            : 'bg-white text-neutral-500 border border-[#EAECEF]'
                        }`}
                      >
                        {opt.badge}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. AUDIO & INSPECTION PREFERENCES */}
          <div className="space-y-2.5 pt-2 border-t border-[#EAECEF]">
            {/* Sound Synthesizer */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAECEF]">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-neutral-600" />
                <div>
                  <div className="text-xs font-bold text-neutral-900">Tactile Audio Feedback</div>
                  <div className="text-[11px] font-mono text-neutral-400">
                    Web Audio API mechanical clicks &amp; chimes
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onToggleSound();
                  sound.playTick();
                }}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  soundEnabled ? 'bg-[#111111]' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 15s Inspection */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAECEF]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-neutral-600" />
                <div>
                  <div className="text-xs font-bold text-neutral-900">WCA 15s Inspection</div>
                  <div className="text-[11px] font-mono text-neutral-400">
                    Enforce official 8s/12s callouts &amp; penalties
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleInspection}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  inspectionEnabled ? 'bg-[#111111]' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    inspectionEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Version Info */}
          <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAECEF] text-xs font-mono text-neutral-500">
            <div className="flex justify-between py-1">
              <span>App Core:</span>
              <span className="font-bold text-neutral-900">v2.4 (Gold-Standard Alg Engine)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Rendering Engine:</span>
              <span className="font-bold text-neutral-900">WebGL &amp; Dynamic Vector SVG</span>
            </div>
            <div className="flex justify-between py-1">
              <span>WCA Rule Compliance:</span>
              <span className="font-bold text-emerald-600">Article 4 &amp; 5 Verified</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#EAECEF] bg-[#F8F9FA] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111111] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
