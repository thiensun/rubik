import React from 'react';
import { X, Volume2, Sliders, Monitor, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  inspectionEnabled: boolean;
  onToggleInspection: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  inspectionEnabled,
  onToggleInspection,
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
      <div className="w-full max-w-md bg-white border border-[#EAECEF] rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#EAECEF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F8F9FA] border border-[#EAECEF] flex items-center justify-center">
              <Sliders className="w-4 h-4 text-neutral-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Precision HUD Settings
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                CubeMaster AI v2.4 Preferences
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

        {/* Setting Items */}
        <div className="p-6 space-y-4">
          {/* Sound Synthesizer */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAECEF]">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-neutral-600" />
              <div>
                <div className="text-xs font-bold text-neutral-900">Tactile Audio Feedback</div>
                <div className="text-[11px] font-mono text-neutral-400">Web Audio API mechanical clicks &amp; chimes</div>
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
                <div className="text-[11px] font-mono text-neutral-400">Enforce official 8s/12s callouts &amp; penalties</div>
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

          {/* Version Info */}
          <div className="p-3 rounded-2xl bg-[#F8F9FA] border border-[#EAECEF] text-xs font-mono text-neutral-500">
            <div className="flex justify-between py-1">
              <span>App Core:</span>
              <span className="font-bold text-neutral-900">v2.4 (Production)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Rendering Engine:</span>
              <span className="font-bold text-neutral-900">WebGL &amp; Tailwind CSS</span>
            </div>
            <div className="flex justify-between py-1">
              <span>WCA Rule Compliance:</span>
              <span className="font-bold text-emerald-600">Article 4 &amp; 5 Verified</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#EAECEF] bg-[#F8F9FA] flex justify-end">
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
