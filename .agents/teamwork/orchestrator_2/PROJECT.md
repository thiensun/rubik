# Project: CubeMaster AI v2.4 Production-Ready Upgrade (Orchestrator Gen 2)

## Architecture
- **Cube State & Mechanics Core** (`src/utils/cubeState.ts`): `CubeNetState` (54 stickers on U, D, F, B, L, R faces), `applyMove`, `applyScramble`, `invertMoves`, `isCubeSolved`. Full support for WCA outer moves (`U, D, L, R, F, B`), slice moves (`M, E, S`), wide moves (`r, l, u, d, f, b`), rotations (`x, y, z`), modifiers (`'`, `2`), and stripping of trigger brackets `()` and extra whitespace.
- **State Validation & Parity Engine** (`src/utils/cubeValidator.ts`): Physical piece extraction (12 edges, 8 corners, 6 centers), parity checks (edge orientation sum % 2 = 0, corner orientation sum % 3 = 0, permutation parity sgn(EP) = sgn(CP)), localized Vietnamese diagnostic errors.
- **Mathematical Solver Engine** (`src/utils/cubeSolver.ts` & `src/utils/solutionStages.ts`): Authentic two-phase Kociemba / IDA* solver for arbitrary 54-sticker states; authentic CFOP and LBL stages solving Cross, F2L, OLL, PLL with real intermediate states.
- **3D Visualization & Parity** (`src/components/solver/ThreeCubeViewer.tsx`): Three.js cubelet meshes, WCA move rotations, 1:1 mathematical parity with `CubeNetState`, WebGL lifecycle resource cleanup, full slice/wide/rotation animation support.
- **Multi-View State Management** (`src/App.tsx`, `src/components/solver/Step2CameraScan.tsx`, `Step3SolveInteractive.tsx`, `ZenTimerStage.tsx`, `AlgorithmsView.tsx`): Live state tracking at move $k$, proper setup state for custom algorithms, seamless camera scan transition, clean route switching without context leaks. Step 3 Reset Color dropdown anchored at `left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]`.
- **Build & Bundle Architecture** (`vite.config.js`, `package.json`): Code-splitting with `manualChunks` (three, react-vendor, lucide, index), Vitest test runner integration.
- **Workspace Synchronization**: Bidirectional sync between `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code` and `D:\Projects\rubik`.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Workspace Baseline Sync | Synchronize `audit_and_refactor_code` from `D:\Projects\rubik`. | M0 | Survey |
| 2 | Vite Code-Splitting Config | Add `manualChunks` in `vite.config.js` to split `three`, `react-vendor`, `lucide`, `index`. | M0 | Survey |
| 3 | Automated Test Infrastructure Setup | Configure `package.json` with `"test": "vitest run"`. | M0 | Survey |
| 4 | Opaque-Box E2E Test Suite | Design and implement test suites covering mechanics, validation, solvers, 3D parity. | E2E | Survey |
| 5 | Physical Cube Piece Modeling | Extract 12 edges and 8 corners with standard color matching. | M1 | Survey |
| 6 | 54-Sticker Color Count & Center Validation | Check exact 9 count for 6 colors, verify 6 unique fixed centers. | M1 | Survey |
| 7 | Rubik's Cube Parity Verification | Check EO, CO, and Permutation parity. | M1 | Survey |
| 8 | Localized Vietnamese Diagnostics | Clear diagnostic feedback identifying impossible piece states. | M1 | Survey |
| 9 | Arbitrary 54-Sticker Mathematical Solver | Real solver engine solving any valid 54-sticker state to `SOLVED_CUBE`. | M1 | Survey |
| 10 | Authentic CFOP & LBL Stage Decomposition | Genuine stage solutions solving intermediate cube states. | M1 | Survey |
| 11 | Camera Scan Step 2 Validation Banner | Prevent transition to Step 3 if cube state is invalid. | M1 | Survey |
| 12 | Step 3 Live Cube State Tracking | Track live cube state at move index $k$. | M2 | Survey |
| 13 | True "100% SOLVED ✓" Gate | Condition victory badge, confetti, audio on `isCubeSolved`. | M2 | Survey |
| 14 | Camera Scanner to Step 3 Direct Solving | Feed `scannedCubeState` directly to solver. | M2 | Survey |
| 15 | Algorithm Library "Practice in 3D" Setup Fix | Set initial cube to algorithm inverse setup state. | M2 | Survey |
| 16 | Solved Cube Reset Handling | Handle 0-move solved state cleanly. | M2 | Survey |
| 17 | Animation & Celebration Synchronization | Delay celebration until 3D animation finishes. | M2 | Survey |
| 18 | Route State Leak Prevention | Clean exit / reset when switching levels or tabs. | M2 | Survey |
| 19 | WebGL Context & Memory Leak Disposal | Dispose Three.js geometries, materials, textures on unmount. | M2 | Survey |
| 20 | Header Navigation Responsive Polish | Prevent pill clipping on mobile viewports <= 375px. | M3 | Survey |
| 21 | ZenTimerStage Digital Font Sizing | Dynamic font size for digital timer. | M3 | Survey |
| 22 | AuditLogModal Table Horizontal Overflow | Add `overflow-x-auto` to audit log modal. | M3 | Survey |
| 23 | Step 1 Bottom Dock Overlap Fix | Increase bottom padding to prevent dock overlap. | M3 | Survey |
| 24 | Step 2 Camera Bar Button Wrapping | Allow camera buttons to wrap gracefully. | M3 | Survey |
| 25 | Step 3 Reset Menu Dropdown Positioning | Keep dropdown anchored at `left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]`. | M3 | Survey |
| 26 | Step 3 Camera Preset Buttons Bar Wrap | Responsive camera angle buttons. | M3 | Survey |
| 27 | Step 3 Execution Tape Reel Height | Constrain tape reel container height and wrap. | M3 | Survey |
| 28 | Full WCA Wide/Slice/Rotation Move Support | Support `M, E, S, r, l, u, d, f, b, x, y, z` (+ `'`, `2`) and bracket stripping in `cubeState.ts` and `ThreeCubeViewer.tsx` so all 46/46 library algorithms animate, invert, and solve 100% in 3D Practice. | Final-M | Sentinel |
| 29 | 100% E2E Test Suite Execution | Execute and pass 100% of E2E tests (`npm test` exit code 0). | Final-M | Sentinel |
| 30 | Production Build & Zero Chunk Warnings | `npm run build` succeeds with 0 warnings. | Final-M | Sentinel |
| 31 | Full Bidirectional Workspace Synchronization | Synchronize all changes between `audit_and_refactor_code` and `D:\Projects\rubik`. | Final-M | Sentinel |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Workspace Baseline & Build/Test Infra | Vite manualChunks, Vitest setup, workspace sync. | none | DONE |
| M1 | 54-Sticker Validation & Real Solving (R1) | `cubeValidator.ts`, `cubeSolver.ts`, `solutionStages.ts`, Step 2 validation banner. | M0 | DONE |
| M2 | 3D Synchronization & Multi-View Flows (R2) | Step 3 live state tracking, true solved gate, camera scan integration, algorithm setup fix, solved reset, WebGL disposal. | M1 | DONE |
| M3 | Responsive UI/UX Polish & Bundle Check (R3) | Mobile responsive layout, dynamic timer font, table overflow, dropdown positioning. | M0 | DONE |
| Final | 100% E2E Test Pass, WCA Move Support & Adversarial Hardening (R4) | Support full WCA moves in `cubeState.ts` & `ThreeCubeViewer.tsx` for all 46 algs in 3D practice, pass all tests, build 0 warnings, sync repos, victory audit. | M1, M2, M3 | **DONE** |
