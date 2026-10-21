import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-mono-200/60 py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-mono-500 font-mono">
        <div className="flex items-center gap-2">
          <span>© 2025 CubeMaster AI Systems</span>
          <span className="text-mono-300">•</span>
          <span>Zen Stage &amp; Precision HUD (Variant 1)</span>
        </div>
        <div className="flex items-center gap-4 font-sans text-xs">
          <a
            href="#notation"
            onClick={(e) => {
              e.preventDefault();
              window.alert("WCA Notation Guide:\n\n• U (Up), D (Down), L (Left), R (Right), F (Front), B (Back)\n• Letter alone: 90° Clockwise\n• Letter with prime ('): 90° Counter-Clockwise\n• Letter with 2: 180° Half Turn");
            }}
            className="hover:text-mono-950 transition-colors"
          >
            Notation Guide
          </a>
          <a
            href="#wca-regulations"
            onClick={(e) => {
              e.preventDefault();
              window.alert("WCA Regulations (Rule 4b):\n\nAll scrambles are generated using random-state / official WCA filtering rules with 15-second inspection and +2 / DNF penalty support.");
            }}
            className="hover:text-mono-950 transition-colors"
          >
            WCA Regulations
          </a>
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              window.alert("CubeMaster AI Privacy Notice:\n\nAll solver algorithms, camera vision processing, and timer logs run 100% client-side in your browser. No video streams or solve history leave your local device.");
            }}
            className="hover:text-mono-950 transition-colors"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
};
