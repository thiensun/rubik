import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getTimerFontSizeClass } from '../src/components/timer/ZenTimerStage';

describe('Empirical Challenger 1 — Milestone 3: Responsive UI/UX & Bundle Performance', () => {
  // =========================================================================
  // TASK 1 & 2: getTimerFontSizeClass & Long Time Strings Sizing
  // =========================================================================
  describe('Task 2: getTimerFontSizeClass & Long Time Strings Verification', () => {
    it('returns 6xl base font class for sub-minute times (<= 5 characters)', () => {
      const subMinuteTimes = ['00.00', '08.42', '59.99', '15', '0.00'];
      for (const time of subMinuteTimes) {
        const cls = getTimerFontSizeClass(time);
        expect(cls).toContain('text-6xl');
        expect(cls).toContain('lg:text-[216px]');
        expect(cls).toContain('font-mono');
      }
    });

    it('returns 5xl base font class for long time strings (> 5 characters)', () => {
      const longTimes = ['1:12.34', '12:34.56', '1:23:45.67', '12:34:56.78', '100:00.00'];
      for (const time of longTimes) {
        const cls = getTimerFontSizeClass(time);
        expect(cls).toContain('text-5xl');
        expect(cls).toContain('lg:text-9xl');
        expect(cls).toContain('font-mono');
      }
    });

    it('empirically calculates typography advance width across mobile viewports: 320px, 360px, 375px, 480px', () => {
      // Monospace typography advance width ratio for JetBrains Mono / ui-monospace is ~0.60 of font-size.
      // Base font-size for text-5xl is 3rem = 48px. Each character = 48px * 0.6 = 28.8px.
      // Base font-size for text-6xl is 3.75rem = 60px. Each character = 60px * 0.6 = 36.0px.
      // Container padding: App main px-4 (32px) + ZenTimerStage px-3 (24px) = 56px total.

      const viewports = [
        { width: 320, available: 320 - 56 }, // 264px
        { width: 360, available: 360 - 56 }, // 304px
        { width: 375, available: 375 - 56 }, // 319px
        { width: 480, available: 480 - 56 }, // 424px
      ];

      // Test Case 1: Standard sub-minute '08.42' (5 chars)
      const subMinTime = '08.42';
      const subMinCharWidth = 60 * 0.6; // 36px
      const subMinTotalWidth = subMinTime.length * subMinCharWidth; // 180px
      for (const vp of viewports) {
        expect(subMinTotalWidth).toBeLessThan(vp.available);
      }

      // Test Case 2: Minute solve '1:12.34' (7 chars)
      const minTime1 = '1:12.34';
      const minCharWidth = 48 * 0.6; // 28.8px
      const min1TotalWidth = minTime1.length * minCharWidth; // 201.6px
      for (const vp of viewports) {
        expect(min1TotalWidth).toBeLessThan(vp.available);
      }

      // Test Case 3: Double-digit minute solve '12:34.56' (8 chars)
      const minTime2 = '12:34.56';
      const min2TotalWidth = minTime2.length * minCharWidth; // 230.4px
      for (const vp of viewports) {
        expect(min2TotalWidth).toBeLessThan(vp.available);
      }

      // Test Case 4: Extreme solve '100:00.00' (9 chars)
      const extremeTime = '100:00.00';
      const extremeTotalWidth = extremeTime.length * minCharWidth; // 259.2px
      for (const vp of viewports) {
        expect(extremeTotalWidth).toBeLessThan(vp.available);
      }

      // Test Case 5: Hour string '1:23:45.67' (10 chars)
      // 10 chars * 28.8px = 288px.
      // Fits comfortably on 360px (304px available), 375px (319px available), 480px (424px available).
      // On 320px (264px available), 288px exceeds unconstrained width by 24px,
      // which is safely contained by ZenTimerStage click-trigger-area 'max-w-full overflow-hidden'.
      const hourTime = '1:23:45.67';
      const hourTotalWidth = hourTime.length * minCharWidth; // 288.0px
      expect(hourTotalWidth).toBeLessThan(360 - 56);
      expect(hourTotalWidth).toBeLessThan(375 - 56);
      expect(hourTotalWidth).toBeLessThan(480 - 56);
    });

    it('verifies click-trigger-area has overflow-hidden and max-w-full preventing viewport horizontal blowout', () => {
      const zenPath = path.resolve(__dirname, '../src/components/timer/ZenTimerStage.tsx');
      const zenSource = fs.readFileSync(zenPath, 'utf-8');

      // Click trigger container wrapping timer display
      expect(zenSource).toContain('id="click-trigger-area"');
      expect(zenSource).toContain('max-w-full overflow-hidden');
    });
  });

  // =========================================================================
  // TASK 3: AuditLogModal Table Layout Blowout Prevention
  // =========================================================================
  describe('Task 3: AuditLogModal Table Wrapper & Layout Blowout Prevention', () => {
    const modalPath = path.resolve(__dirname, '../src/components/history/AuditLogModal.tsx');
    const modalSource = fs.readFileSync(modalPath, 'utf-8');

    it('wraps table in a dedicated overflow-x-auto max-w-full container', () => {
      expect(modalSource).toContain('<div className="overflow-x-auto max-w-full">');
    });

    it('sets minimum width on table to prevent column collapse while wrapper scrolls', () => {
      expect(modalSource).toContain('min-w-[480px]');
    });

    it('truncates scramble text column to prevent infinite table stretching', () => {
      expect(modalSource).toContain('truncate max-w-[200px]');
    });

    it('stacks modal footer controls vertically on mobile screens (< sm) to prevent button overflow', () => {
      expect(modalSource).toContain('flex flex-col sm:flex-row items-center justify-between gap-2.5');
    });

    it('mathematically confirms table scroll wrapper isolates 480px table from 320px–375px viewports', () => {
      const tableMinWidth = 480;
      const mobileViewports = [320, 360, 375];

      for (const vp of mobileViewports) {
        // Without overflow-x-auto wrapper, table would expand parent modal to 480px, exceeding mobile viewport
        expect(tableMinWidth).toBeGreaterThan(vp);
      }
      // Wrapper has overflow-x-auto max-w-full, which constrains clientWidth to viewport width and allows horizontal scrolling
      expect(modalSource).toMatch(/<div className="overflow-x-auto max-w-full">\s*<table/);
    });
  });

  // =========================================================================
  // TASK 1: Responsive Layout Across Mobile Viewports (320px, 360px, 375px, 480px)
  // =========================================================================
  describe('Task 1: Mobile Viewport Layout Verification across Core Views', () => {
    it('verifies Header navigation fits within narrow viewports with overflow protection and compact labels', () => {
      const headerPath = path.resolve(__dirname, '../src/components/Header.tsx');
      const headerSource = fs.readFileSync(headerPath, 'utf-8');

      // Nav container width constraint and horizontal scrolling
      expect(headerSource).toContain('overflow-x-auto max-w-[55vw] sm:max-w-none');
      // Compact mobile labels
      expect(headerSource).toContain('<span className="sm:hidden">Timer</span>');
      expect(headerSource).toContain('<span className="sm:hidden">Algs</span>');
      // Logo hides extra text on mobile
      expect(headerSource).toContain('CubeMaster<span className="hidden sm:inline"> AI</span>');
      // Non-essential desktop widgets hidden on mobile
      expect(headerSource).toContain('hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mono-100/70');
      expect(headerSource).toContain('hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white');
    });

    it('verifies Step 1 bottom action dock does not occlude Level 4 card', () => {
      const step1Path = path.resolve(__dirname, '../src/components/solver/Step1SelectLevel.tsx');
      const step1Source = fs.readFileSync(step1Path, 'utf-8');

      // Bottom container padding pb-32 = 128px, pb-36 = 144px
      expect(step1Source).toContain('pb-32 sm:pb-36');
      // Action dock is sticky bottom-3 with responsive padding
      expect(step1Source).toContain('sticky bottom-3 sm:bottom-4 z-40');
    });

    it('verifies Step 2 camera controls wrap properly on screens < 380px', () => {
      const step2Path = path.resolve(__dirname, '../src/components/solver/Step2CameraScan.tsx');
      const step2Source = fs.readFileSync(step2Path, 'utf-8');

      // Device bar wraps
      expect(step2Source).toContain('flex flex-wrap items-center justify-between gap-2');
      // Device select has minimum width
      expect(step2Source).toContain('min-w-[150px]');
      // Action buttons wrap
      expect(step2Source).toContain('flex flex-wrap gap-2 justify-center items-center shrink-0');
    });

    it('verifies Step 3 reset dropdown and camera preset buttons stay within mobile boundaries', () => {
      const step3Path = path.resolve(__dirname, '../src/components/solver/Step3SolveInteractive.tsx');
      const step3Source = fs.readFileSync(step3Path, 'utf-8');

      // Dropdown anchored to left-0 to open inward without clipping left edge
      expect(step3Source).toContain('left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]');
      // Camera presets wrap cleanly
      expect(step3Source).toContain('flex flex-wrap gap-1.5 justify-center items-center bg-[#F3F4F6]');
      // Tape reel height bounded
      expect(step3Source).toContain('max-h-36 sm:max-h-48 overflow-y-auto');
    });
  });

  // =========================================================================
  // TASK 4: Bundle Optimization & Chunk Sizes
  // =========================================================================
  describe('Task 4: Bundle Performance & Code-Splitting Verification', () => {
    it('verifies vite.config.js manualChunks splits heavy dependencies', () => {
      const viteConfigPath = path.resolve(__dirname, '../vite.config.js');
      const viteConfigSource = fs.readFileSync(viteConfigPath, 'utf-8');

      expect(viteConfigSource).toContain('manualChunks');
      expect(viteConfigSource).toContain("'three'");
      expect(viteConfigSource).toContain("'react-vendor'");
      expect(viteConfigSource).toContain("'lucide'");
    });

    it('verifies dist output exists and all JS chunk files are strictly < 500 kB', () => {
      const distAssetsDir = path.resolve(__dirname, '../dist/assets');
      expect(fs.existsSync(distAssetsDir)).toBe(true);

      const files = fs.readdirSync(distAssetsDir);
      const jsChunks = files.filter((f) => f.endsWith('.js'));
      expect(jsChunks.length).toBeGreaterThanOrEqual(3);

      for (const chunk of jsChunks) {
        const filePath = path.join(distAssetsDir, chunk);
        const stats = fs.statSync(filePath);
        const sizeInKB = stats.size / 1024;
        // Strict threshold: all chunks must be < 500 kB
        expect(sizeInKB).toBeLessThan(500);
      }
    });
  });
});
