# Milestone 2 Review & Adversarial Challenge Report

**Reviewer**: Reviewer 1 (Archetype: reviewer_critic)  
**Date**: 2026-10-20  
**Milestone**: Milestone 2: 3D Rubik's Cube & Multi-View State Synchronization (R2)  
**Verdict**: **REQUEST_CHANGES**  
**Risk Assessment**: **HIGH**

---

## 1. Executive Summary & Review Verdict

**Verdict**: **REQUEST_CHANGES**

Worker M2 implemented significant core improvements for Milestone 2:
- 3D mesh rotation parity against 2D net transformations was verified across all 18 standard moves and 21-move WCA scrambles (`tests/sync.test.ts`).
- WebGL resources (geometries, materials, textures, renderer context) are disposed on component unmount in `ThreeCubeViewer.tsx`.
- Playback speed scaling (0.5x -> 380ms, 1.0x -> 180ms, 2.0x -> 110ms) is implemented.
- Route context leaks across tabs and wizard steps are addressed in `App.tsx` and `SolveAndLearnView.tsx`.
- Both repositories (`audit_and_refactor_code` and `D:\Projects\rubik`) are 100% synchronized with identical byte content.

However, an independent adversarial investigation revealed **two critical bugs** that block approval:
1. **Critical Runtime Crash (White Screen)**: In `src/components/solver/Step3SolveInteractive.tsx` line 197, `useCallback` is called to define `handleAnimationComplete`, but `useCallback` was **never imported** from `'react'`. Running `tsc -p tsconfig.json --noEmit` fails with `TS2304: Cannot find name 'useCallback'`. In production browser runtime, mounting `Step3SolveInteractive` immediately throws `Uncaught ReferenceError: useCallback is not defined`, crashing the entire Step 3 component.
2. **False Positive Solved Gate on Null Scanned State**: In `src/components/solver/Step3SolveInteractive.tsx` lines 184–194, `currentCubeState` defaults to `SOLVED_CUBE` whenever `scannedCubeState` is `null`/`undefined`. This makes `isActuallySolved === true` upon initial render or whenever the cube state is unloaded/unscanned, causing `ThreeCubeViewer` to prematurely show `SOLVED ✓` and the bouncing `100% SOLVED ✓` badge while 47 demo moves remain on screen.
3. **Algorithm Library Move Sanitization & M-slice Parity**: 13 of 46 algorithms in `ALGORITHMS_LIBRARY` contain parentheses (e.g., `(R`, `(R'`) which break `parseMoveToRotation` and `invertMove`. Additionally, `M2` in H-Perm is supported visually in 3D but is a no-op in `applyMove`, causing 2D/3D state divergence.

---

## 2. Observation

### 2.1 Verbatim Compiler Error
Running TypeScript check in PowerShell:
```powershell
npx tsc -p tsconfig.json --noEmit
```
**Output**:
```
src/components/solver/Step3SolveInteractive.tsx(197,35): error TS2304: Cannot find name 'useCallback'.
```

### 2.2 Verbatim Source Code Discrepancies
1. **Missing `useCallback` Import in `src/components/solver/Step3SolveInteractive.tsx`**:
   - Line 1:
     ```typescript
     import React, { useState, useEffect, useRef, useMemo } from 'react';
     ```
   - Line 197:
     ```typescript
     const handleAnimationComplete = useCallback(() => {
       if (isActuallySolved && currentMoveGlobalIdx >= allMoves.length && allMoves.length > 0) {
         if (!isAllCompleted) {
           setIsAllCompleted(true);
           sound.playPBChord();
           confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
         }
       }
     }, [isActuallySolved, currentMoveGlobalIdx, allMoves.length, isAllCompleted]);
     ```
   - `useCallback` is called as an unqualified global variable. In browser JavaScript, `window.useCallback` is `undefined`, throwing `ReferenceError: useCallback is not defined`.
   - In the compiled bundle `dist/assets/index-D-suv4hQ.js`, line 197 was compiled directly as a free global call:
     ```javascript
     H=useCallback(()=>{L&&k>=g.length&&g.length>0&&(B||(U(!0),oe.playPBChord(),xt({particleCount:120,spread:80,origin:{y:.6}})))},[L,k,g.length,B])
     ```
     This confirms that Vite transpilation did not bind `useCallback` to `React.useCallback`, guaranteeing a runtime crash.

2. **Premature Solved Gate when `scannedCubeState` is `null` (`Step3SolveInteractive.tsx`)**:
   - Lines 184–195:
     ```typescript
     const currentCubeState = useMemo(() => {
       if (!scannedCubeState) return SOLVED_CUBE;
       let state = cloneCube(scannedCubeState);
       const movesToApply = allMoves.slice(0, currentMoveGlobalIdx);
       for (const m of movesToApply) {
         state = applyMove(state, m.move);
       }
       return state;
     }, [scannedCubeState, allMoves, currentMoveGlobalIdx]);

     const isActuallySolved = useMemo(() => isCubeSolved(currentCubeState), [currentCubeState]);
     ```
   - When entering Step 3 without an existing scanned cube (`scannedCubeState === null`), `currentCubeState` returns `SOLVED_CUBE`.
   - `isActuallySolved` evaluates to `true`.
   - Lines 278–282:
     ```typescript
     const activeStageHint = useMemo(() => {
       if (isActuallySolved) {
         return allMoves.length === 0
           ? '🎉 Khối Rubik của bạn đã ở trạng thái hoàn thành 100%! (0 Moves)'
           : '🎉 Chúc mừng! Khối Rubik đã được giải hoàn tất 100%!';
       }
     ```
   - `ThreeCubeViewer` receives `isSolved={true}`:
     ```typescript
     {isSolved ? (
       <div className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center gap-2 animate-bounce">
         <span className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
           100% SOLVED ✓
         </span>
       </div>
     ```
   - Consequently, the UI shows `100% SOLVED ✓` and celebration hints on an unscanned/unsolved cube before the user has even started.

3. **Algorithm Parentheses & M-Slice Move Parsing**:
   - In `src/utils/algorithmsData.ts`, multiple algorithm notations contain parentheses grouping triggers, e.g. `(R U R' U')`.
   - `createMoves` in `src/utils/solutionStages.ts` line 41 splits by whitespace:
     ```typescript
     const tokens = movesStr.trim().split(/\s+/).filter(Boolean);
     ```
     Yielding tokens such as `(R`, `(R'`, `(R2`, `(r`.
   - In `ThreeCubeViewer.tsx` line 54:
     ```typescript
     const base = m[0]; // base is '('
     ```
     `parseMoveToRotation` hits `default: return null;`, making the move unparseable in 3D.
   - In `cubeState.ts`: `applyMove` has no case for `M` (middle slice), while `ThreeCubeViewer.tsx` implements `case 'M'`. For H-Perm (`M2 U M2 U2 M2 U M2`), `applyMove` ignores `M2`, leading to divergence between 2D and 3D states.

### 2.3 Independent Command Outputs
- **Worktree Test (`npm test`)**: 228 tests passed across 9 test files (duration: 6.06s).
- **Worktree Build (`npm run build`)**: Exit code 0, 0 chunk warnings >500 kB (three: 484.74 kB, react-vendor: 223.22 kB, index: 266.72 kB).
- **`D:\Projects\rubik` Test (`npm test`)**: 207 tests passed (duration: 4.90s).
- **`D:\Projects\rubik` Build (`npm run build`)**: Exit code 0, 0 chunk warnings >500 kB.
- **File Diff (`Compare-Object`)**: 100% identical across all 6 files.

---

## 3. Logic Chain

1. **Step 1 (Runtime Crash)**:
   - Observation: `Step3SolveInteractive.tsx` calls `useCallback` on line 197 without importing `useCallback` on line 1.
   - Inference: In standard ECMAScript / React execution, invoking an unimported symbol causes a runtime `ReferenceError`.
   - Deduction: Navigating to Step 3 in the application will crash with `ReferenceError: useCallback is not defined`. This invalidates the claim of a working production-ready Step 3 component.

2. **Step 2 (False Positive Solved Gate)**:
   - Observation: When `scannedCubeState` is `null`, `currentCubeState` returns `SOLVED_CUBE`, and `isActuallySolved` becomes `true`.
   - Inference: A missing or pending cube state is mathematically not equivalent to a solved cube.
   - Deduction: The visual HUD displays `SOLVED ✓` and `100% SOLVED ✓` prematurely whenever `scannedCubeState` is absent, violating Requirement R2 (Item 13: "Condition '100% SOLVED ✓' badge strictly on genuinely solved states").

3. **Step 3 (Adversarial Robustness)**:
   - Observation: Algorithms in `ALGORITHMS_LIBRARY` include parentheses like `(R` and slice moves like `M2`.
   - Inference: Neither `ThreeCubeViewer` nor `cubeState` strip parentheses from move tokens before parsing or inverting.
   - Deduction: Selecting algorithms with trigger parentheses from the Algorithm Library for "Practice in 3D" causes animation failures and unapplied rotations.

---

## 4. Quality Review Findings

### Critical Finding 1: Unimported `useCallback` Crashes Step 3 Component
- **Location**: `src/components/solver/Step3SolveInteractive.tsx:1`, `src/components/solver/Step3SolveInteractive.tsx:197`
- **Impact**: Runtime `ReferenceError: useCallback is not defined` crashes Step 3 on mount.
- **Required Fix**:
  In `src/components/solver/Step3SolveInteractive.tsx` line 1, add `useCallback` to the React import:
  ```typescript
  import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
  ```

### Critical Finding 2: False Positive `isActuallySolved` on Null Scanned Cube
- **Location**: `src/components/solver/Step3SolveInteractive.tsx:184-195`
- **Impact**: When `scannedCubeState` is `null` (e.g. before scanning or in demo mode), `isActuallySolved` evaluates to `true`, displaying `100% SOLVED ✓` and victory hints prematurely while moves are still pending.
- **Required Fix**:
  Guard `isActuallySolved` so that a `null` or uninitialized `scannedCubeState` never evaluates to solved:
  ```typescript
  const isActuallySolved = useMemo(() => {
    if (!scannedCubeState) return false;
    return isCubeSolved(currentCubeState);
  }, [scannedCubeState, currentCubeState]);
  ```

### Major Finding 3: Move Token Sanitization in Algorithm Practice
- **Location**: `src/utils/solutionStages.ts:40-42`, `src/utils/cubeState.ts:41-53`, `src/components/solver/ThreeCubeViewer.tsx:51-54`
- **Impact**: Algorithm notation with parentheses (e.g., `(R U R' U')`) fails to parse in 3D and fails to invert properly.
- **Suggested Fix**:
  Sanitize tokens in `invertMoves`, `createMoves`, and `parseMoveToRotation` by stripping parentheses: `token.replace(/[()]/g, '')`.

---

## 5. Adversarial Challenge Report

### Overall Risk Assessment: HIGH

| # | Challenge | Blast Radius | Mitigation |
|---|-----------|--------------|------------|
| 1 | Missing import `useCallback` in `Step3SolveInteractive.tsx` | Complete white screen crash on Step 3 route | Add `useCallback` to `import React, { ... } from 'react'` |
| 2 | `!scannedCubeState` returns `SOLVED_CUBE` | User sees `100% SOLVED ✓` badge on scrambled/unscanned demo cubes | Gate `isActuallySolved` to require non-null `scannedCubeState` |
| 3 | Parenthesized notation `(R` in `ALGORITHMS_LIBRARY` | Practice in 3D fails to animate moves with parentheses | Strip `(` and `)` in move parser and inverter |
| 4 | `M` slice moves unsupported in `applyMove` | H-Perm Practice in 3D desynchronizes 2D net state | Implement `M` move support in `applyMove` or decompose `M2` |

---

## 6. Caveats

- **No Caveats**: Build, test execution, chunk sizing, repository synchronization, and full source code of all modified files were independently verified in both repositories.

---

## 7. Conclusion

Milestone 2 cannot be approved in its current state due to the unimported `useCallback` runtime crash in `Step3SolveInteractive.tsx` and the false positive solved gate when `scannedCubeState` is null.

**Verdict**: **REQUEST_CHANGES**

---

## 8. Verification Method

1. **Typecheck Verification**:
   ```powershell
   npx tsc -p tsconfig.json --noEmit
   ```
   Must produce 0 errors in `src/components/solver/Step3SolveInteractive.tsx`.
2. **Automated Test Suite**:
   ```powershell
   npm test
   ```
   All test suites must pass cleanly.
3. **Chunk Size & Production Build**:
   ```powershell
   npm run build
   ```
   Must succeed with exit code 0 and 0 chunk warnings (>500 kB).
4. **Repository Parity**:
   Verify byte equality between `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code` and `D:\Projects\rubik`.
