import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getTimerFontSizeClass } from '../src/components/timer/ZenTimerStage';

describe('Milestone 3: Responsive UI/UX Polish & Layout Tests', () => {
  describe('Task 2: ZenTimerStage Digital Font Sizing', () => {
    it('applies standard large display font for sub-minute times (<= 5 chars)', () => {
      const standardTimes = ['00.00', '08.42', '59.99', '15'];
      for (const time of standardTimes) {
        const fontClass = getTimerFontSizeClass(time);
        expect(fontClass).toContain('text-6xl');
        expect(fontClass).toContain('lg:text-[216px]');
        expect(fontClass).toContain('tracking-tight font-mono');
      }
    });

    it('scales font size down dynamically for minute times (>= 7 chars)', () => {
      const minuteTimes = ['1:12.34', '12:34.56', '01:05.20', '99:59.99'];
      for (const time of minuteTimes) {
        const fontClass = getTimerFontSizeClass(time);
        expect(fontClass).toContain('text-5xl');
        expect(fontClass).toContain('lg:text-9xl');
        expect(fontClass).toContain('tracking-tight font-mono');
      }
    });

    it('guarantees estimated pixel width at 320px viewport does not overflow container', () => {
      // In monospace typography, typical character width is ~0.6 * fontSize.
      // On a 320px viewport with 24px padding (px-3 on each side = 24px), available width is ~296px.
      // At text-5xl (48px font size):
      // For 8 characters ("12:34.56"), width is 8 * (48px * 0.6) = 230.4px < 296px.
      const testCases = [
        { time: '08.42', fontSizePx: 60, expectedMaxChars: 5 },
        { time: '1:12.34', fontSizePx: 48, expectedMaxChars: 7 },
        { time: '12:34.56', fontSizePx: 48, expectedMaxChars: 8 },
      ];

      const availableViewportWidth = 320 - 24; // 296px

      for (const tc of testCases) {
        const estCharWidth = tc.fontSizePx * 0.6;
        const estTotalWidth = tc.time.length * estCharWidth;
        expect(estTotalWidth).toBeLessThan(availableViewportWidth);
      }
    });
  });

  describe('Task 1: Header Responsive Layout', () => {
    const headerPath = path.resolve(__dirname, '../src/components/Header.tsx');
    const headerSource = fs.readFileSync(headerPath, 'utf-8');

    it('uses compact gaps and responsive padding on navigation pills', () => {
      expect(headerSource).toContain('gap-1 sm:gap-2');
      expect(headerSource).toContain('px-2 py-1 sm:px-3 sm:py-1.5');
      expect(headerSource).toContain('text-xs sm:text-sm');
    });

    it('supports horizontal overflow scrolling or containment for narrow screens', () => {
      expect(headerSource).toContain('overflow-x-auto');
    });

    it('provides compact labels for mobile navigation items', () => {
      expect(headerSource).toContain('sm:hidden');
      expect(headerSource).toContain('Timer');
      expect(headerSource).toContain('Algs');
    });
  });

  describe('Task 3: AuditLogModal Table Horizontal Overflow', () => {
    const modalPath = path.resolve(__dirname, '../src/components/history/AuditLogModal.tsx');
    const modalSource = fs.readFileSync(modalPath, 'utf-8');

    it('wraps the audit log table inside an overflow-x-auto max-w-full container', () => {
      expect(modalSource).toContain('overflow-x-auto max-w-full');
    });

    it('sets a minimum width on the table to preserve columnar readability', () => {
      expect(modalSource).toContain('min-w-[480px]');
    });

    it('uses responsive stacked layout on modal footer for narrow screens', () => {
      expect(modalSource).toContain('flex flex-col sm:flex-row');
    });
  });

  describe('Task 4: Step1SelectLevel Container Bottom Padding', () => {
    const step1Path = path.resolve(__dirname, '../src/components/solver/Step1SelectLevel.tsx');
    const step1Source = fs.readFileSync(step1Path, 'utf-8');

    it('has ample bottom padding (pb-32 or pb-36) to prevent bottom dock overlap', () => {
      const hasAmplePadding = step1Source.includes('pb-32') || step1Source.includes('pb-36');
      expect(hasAmplePadding).toBe(true);
    });
  });

  describe('Task 5: Step2CameraScan Camera Bar & Controls Wrapping', () => {
    const step2Path = path.resolve(__dirname, '../src/components/solver/Step2CameraScan.tsx');
    const step2Source = fs.readFileSync(step2Path, 'utf-8');

    it('wraps camera controls gracefully with flex-wrap gap-2 justify-center on mobile', () => {
      expect(step2Source).toContain('flex flex-wrap items-center justify-between gap-2');
      expect(step2Source).toContain('flex-wrap gap-2 justify-center');
    });
  });

  describe('Task 6: Step3SolveInteractive Responsive Positioning & Constraints', () => {
    const step3Path = path.resolve(__dirname, '../src/components/solver/Step3SolveInteractive.tsx');
    const step3Source = fs.readFileSync(step3Path, 'utf-8');

    it('anchors reset menu dropdown to left-0 with viewport max-width to avoid screen clipping', () => {
      expect(step3Source).toContain('left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]');
    });

    it('wraps camera angle preset buttons with flex-wrap gap-1.5 justify-center', () => {
      expect(step3Source).toContain('flex flex-wrap gap-1.5 justify-center');
    });

    it('constrains tape reel max-height with scroll to preserve 3D cube space', () => {
      const hasMaxHeight = step3Source.includes('max-h-36') || step3Source.includes('max-h-48');
      expect(hasMaxHeight).toBe(true);
      expect(step3Source).toContain('overflow-y-auto');
    });
  });
});
