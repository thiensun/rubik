# Project: CubeMaster AI v2.4 Production-Ready Upgrade

## Architecture
- **Cube State & Mechanics Core** (`src/utils/cubeState.ts`): `CubeNetState` (54 stickers on U, D, F, B, L, R faces), `applyMove`, `applyScramble`, `invertMoves`, `isCubeSolved`.
- **State Validation & Parity Engine** (`src/utils/cubeValidator.ts`): Physical piece extraction (12 edges, 8 corners, 6 centers), parity checks (edge orientation sum % 2 = 0, corner orientation sum % 3 = 0, permutation parity sgn(EP) = sgn(CP)), localized Vietnamese diagnostic errors.
- **Mathematical Solver Engine** (`src/utils/cubeSolver.ts` & `src/utils/solutionStages.ts`): Authentic two-phase Kociemba / IDA* solver for arbitrary 54-sticker states; authentic CFOP and LBL stages solving Cross, F2L, OLL, PLL with real intermediate states.
- **3D Visualization & Parity** (`src/components/solver/ThreeCubeViewer.tsx`): Three.js cubelet meshes, WCA move rotations, 1:1 mathematical parity with `CubeNetState`, WebGL lifecycle resource cleanup.
- **Multi-View State Management** (`src/App.tsx`, `src/components/solver/Step2CameraScan.tsx`, `Step3SolveInteractive.tsx`, `ZenTimerStage.tsx`, `AlgorithmsView.tsx`): Live state tracking at move $k$, proper setup state for custom algorithms, seamless camera scan transition, clean route switching without context leaks.
- **Build & Bundle Architecture** (`vite.config.js`, `package.json`): Code-splitting with `manualChunks` (three, react-vendor, lucide, index), Vitest test runner integration.
- **Workspace Synchronization**: Bidirectional sync between `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code` and `D:\Projects\rubik`.

---

## Feature Inventory

Every feature discovered during Survey has an assigned milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Workspace Baseline Sync | Synchronize `audit_and_refactor_code` from `D:\Projects\rubik` (10 updated source files, `DESIGN_GUIDELINES.md`, tailwind config, package-lock). | M0 | Survey 3 |
| 2 | Vite Code-Splitting Config | Add `manualChunks` in `vite.config.js` to split `three` (485 kB), `react-vendor` (223 kB), `lucide` (26 kB), and `index` (246 kB) to eliminate >500 kB chunk warning. | M0 | Survey 3 |
| 3 | Automated Test Infrastructure Setup | Configure `package.json` with `"test": "vitest run"` and install Vitest / test runner. | M0 | Survey 3 |
| 4 | Opaque-Box E2E Test Suite | Design and implement 4-tier test suite covering mechanics, validation, solvers, 3D parity, multi-view flows; generate `TEST_READY.md`. | E2E-Track | Survey 1, 2, 3 |
| 5 | Physical Cube Piece Modeling | Extract 12 edge pairs and 8 corner triplets from `CubeNetState` with chirality and standard color matching. | M1 | Survey 1 |
| 6 | 54-Sticker Color Count & Center Validation | Check exact 9 count for 6 colors, verify 6 unique fixed centers matching standard WCA scheme. | M1 | Survey 1 |
| 7 | Rubik's Cube Parity Verification | Check Edge Orientation Parity (sum EO % 2 == 0), Corner Orientation Parity (sum CO % 3 == 0), Permutation Parity (sgn(EP) == sgn(CP)). | M1 | Survey 1 |
| 8 | Localized Vietnamese Diagnostics | Clear diagnostic feedback identifying which faces, stickers, or impossible piece states (flipped edge, twisted corner, duplicate piece, swapped edges) need correction. | M1 | Survey 1 |
| 9 | Arbitrary 54-Sticker Mathematical Solver | Real solver engine capable of solving any valid 54-sticker state to `SOLVED_CUBE` without relying on scramble string inversion. | M1 | Survey 1 |
| 10 | Authentic CFOP & LBL Stage Decomposition | Replace scramble-slicing pseudo-solver with genuine stage solutions where Cross, F2L, OLL, and PLL physically solve intermediate cube states. | M1 | Survey 1 |
| 11 | Camera Scan Step 2 Validation Banner | Prevent transition to Step 3 if cube state is invalid or unverified; display live green badge when valid. | M1 | Survey 1, 2 |
| 12 | Step 3 Live Cube State Tracking | Track `currentCubeState` at move index $k$ in `Step3SolveInteractive.tsx` and evaluate `isCubeSolved(currentCubeState)`. | M2 | Survey 2 |
| 13 | True "100% SOLVED ✓" Gate | Condition "100% SOLVED ✓" badge, confetti, and victory audio strictly on `isCubeSolved(currentCubeState) === true`. | M2 | Survey 1, 2 |
| 14 | Camera Scanner to Step 3 Direct Solving | Feed `scannedCubeState` directly to solver engine; clear stale `demoScramble`. | M2 | Survey 1, 2 |
| 15 | Algorithm Library "Practice in 3D" Setup Fix | Set initial cube to algorithm inverse setup state `applyScramble(invertMoves(alg.notation))` so executing the algorithm reaches `SOLVED_CUBE`. | M2 | Survey 2 |
| 16 | Solved Cube Reset Handling | When user resets to "Khối Đã Giải", handle 0-move solved state cleanly without executing 47 CFOP moves. | M2 | Survey 2 |
| 17 | Animation & Celebration Synchronization | Delay celebration / confetti until 3D move rotation finishes. Map playback speed (0.5x, 1.0x, 2.0x) to rotation durations (380ms, 180ms, 110ms). | M2 | Survey 2 |
| 18 | Route State Leak Prevention | Provide clean exit / reset for `selectedSolveForAnalysis` and `customAlgorithm` when switching solver levels or top navbar tabs. | M2 | Survey 2 |
| 19 | WebGL Context & Memory Leak Disposal | Dispose Three.js geometries, materials, textures, and canvas on component unmount in `ThreeCubeViewer.tsx`. | M2 | Survey 2 |
| 20 | Header Navigation Responsive Polish | Prevent pill clipping / horizontal crowding on mobile viewports <= 375px. | M3 | Survey 3 |
| 21 | ZenTimerStage Digital Font Sizing | Scale timer font size dynamically so minute times (e.g. `1:12.34`) do not overflow narrow screens (320px–360px). | M3 | Survey 3 |
| 22 | AuditLogModal Table Horizontal Overflow | Add `overflow-x-auto` to audit log modal table to prevent modal blowout on mobile viewports. | M3 | Survey 3 |
| 23 | Step 1 Bottom Dock Overlap Fix | Increase bottom padding on Step 1 container to prevent bottom level card from being obscured by fixed dock. | M3 | Survey 3 |
| 24 | Step 2 Camera Bar Button Wrapping | Allow camera selection and buttons to wrap gracefully on screens < 380px. | M3 | Survey 3 |
| 25 | Step 3 Reset Menu Dropdown Positioning | Fix dropdown anchor to prevent clipping off the right edge of mobile screens. | M3 | Survey 3 |
| 26 | Step 3 Camera Preset Buttons Bar Wrap | Optimize camera angle button labels and container for responsive mobile rendering. | M3 | Survey 3 |
| 27 | Step 3 Execution Tape Reel Responsive Height | Constrain tape reel container height and wrap behavior to preserve 3D canvas viewport space. | M3 | Survey 3 |
| 28 | 100% E2E Test Suite Execution | Execute and pass 100% of E2E tests (Tiers 1-4) including 50+ random WCA scrambles solving, parity validation, and 3D parity. | Final-M | Survey 1, 2, 3 |
| 29 | Tier 5 Adversarial Coverage Hardening | Run Challenger adversarial test generation and harden edge cases across all modules. | Final-M | Survey 1, 2, 3 |
| 30 | Full Workspace Synchronization to D:\Projects\rubik | Ensure all source, tests, configs, and assets are 100% identical between worktree and `D:\Projects\rubik`. | Final-M | Survey 3 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent opaque-box test runner and 4-tier test suite. Publishes `TEST_READY.md`. | none | PLANNED |
| M0 | Workspace Baseline & Build/Test Infra | Sync from `D:\Projects\rubik`, configure `manualChunks` in `vite.config.js`, setup test script. | none | DONE |
| M1 | 54-Sticker Validation & Real Solving (R1) | `cubeValidator.ts` (parity checks, Vietnamese diagnostics), `cubeSolver.ts` (arbitrary 54-sticker solver), update `solutionStages.ts`, Step 2 validation banner. | M0 | DONE |
| M2 | 3D Synchronization & Multi-View Flows (R2) | Step 3 live state tracking, true "100% SOLVED ✓" gate, camera scan integration, algorithm setup fix, solved reset fix, animation timing, WebGL disposal. | M1 | DONE |
| M3 | Responsive UI/UX Polish & Bundle Check (R3) | Header nav, ZenTimerStage digital timer, AuditLogModal table, Step 1 dock, Step 2/3 responsive fixes, verify 0 chunk warnings. | M0 | DONE |
| Final | 100% E2E Test Pass & Adversarial Hardening (R4) | Phase 1: Pass 100% E2E tests (Tiers 1-4). Phase 2: Tier 5 Adversarial Hardening. Final sync to `D:\Projects\rubik`. | M1, M2, M3, E2E | PLANNED |

---

## Interface Contracts

### `src/utils/cubeValidator.ts` ↔ UI Components (`Step2CameraScan.tsx`)
```typescript
export interface CubeValidationResult {
  isValid: boolean;
  errors: string[]; // Localized Vietnamese diagnostic error messages
  details: {
    colorCountsValid: boolean;
    colorCounts: Record<CubeColor, number>;
    centersValid: boolean;
    edgesValid: boolean;
    cornersValid: boolean;
    edgeOrientationParity: boolean;
    cornerOrientationParity: boolean;
    permutationParity: boolean;
  };
}

export function validateCubeState(cube: CubeNetState): CubeValidationResult;
```

### `src/utils/cubeSolver.ts` ↔ `src/utils/solutionStages.ts` & `Step3SolveInteractive.tsx`
```typescript
export interface MoveStep {
  move: string;
  explanation: string;
  stageName: string;
}

export interface SolveResult {
  success: boolean;
  moves: string[]; // Sequence of WCA move tokens (e.g. ["R", "U", "R'", "U'"])
  stages: SolutionStage[];
  errorMessage?: string;
}

export function solveCube(cube: CubeNetState, level: SolverLevelId): SolveResult;
```

### `Step3SolveInteractive.tsx` ↔ `ThreeCubeViewer.tsx`
```typescript
interface ThreeCubeViewerProps {
  initialCubeState: CubeNetState;
  currentMoveIndex: number;
  allMoves: Array<{ move: string; explanation?: string }>;
  isSolved: boolean; // Computed via isCubeSolved(currentCubeState)
  playbackSpeed: number; // 0.5, 1.0, 2.0
  onAnimationComplete?: () => void;
}
```

---

## Code Layout
- `src/utils/cubeState.ts`: Fundamental types and mechanics (`applyMove`, `applyScramble`, `isCubeSolved`).
- `src/utils/cubeValidator.ts`: 54-sticker validation and parity checks (NEW).
- `src/utils/cubeSolver.ts`: Real mathematical solver engine (NEW).
- `src/utils/solutionStages.ts`: Stage decomposition for 5 solver levels.
- `src/components/solver/Step1SelectLevel.tsx`: Solver level selection wizard.
- `src/components/solver/Step2CameraScan.tsx`: Camera scanner & 2D net review.
- `src/components/solver/Step3SolveInteractive.tsx`: 3D interactive solve wizard.
- `src/components/solver/ThreeCubeViewer.tsx`: Three.js 3D Rubik's Cube component.
- `src/components/timer/ZenTimerStage.tsx`: Speedcubing timer.
- `src/components/history/SessionHistoryCard.tsx` & `AuditLogModal.tsx`: Session history and solve analytics.
- `src/components/views/AlgorithmsView.tsx`: Algorithm library with 3D practice.
- `tests/`: Automated unit, integration, and E2E test suites (NEW).
- `vite.config.js`: Bundler configuration with `manualChunks`.
