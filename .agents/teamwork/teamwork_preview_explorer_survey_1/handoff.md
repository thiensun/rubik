# Handoff Report — Explorer 1: Cube Mechanics & Real Solver Specialist

**Date**: 2026-10-20T16:15:00Z  
**Agent**: `teamwork_preview_explorer_survey_1` (Explorer 1)  
**Parent**: `2be97e99-f565-4b30-a410-d3f1ad8551d3`  
**Working Directory**: `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\teamwork_preview_explorer_survey_1`  
**Mission**: Read-only exploration of Requirement R1 (Arbitrary 54-Sticker Cube State Validation & Real Solving) and core cube mechanics.

---

## 1. Observation

Direct code inspections, tool outputs, and filesystem findings:

### 1.1 Core Cube State Types and Mechanics (`src/utils/cubeState.ts`)
- **Type Definitions** (lines 3–20):
  ```typescript
  export type FaceKey = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
  export type CubeColor = 'white' | 'yellow' | 'green' | 'blue' | 'orange' | 'red';
  export type CubeFaceState = [CubeColor, CubeColor, CubeColor, CubeColor, CubeColor, CubeColor, CubeColor, CubeColor, CubeColor];
  export interface CubeNetState {
    U: CubeFaceState; D: CubeFaceState; F: CubeFaceState;
    B: CubeFaceState; L: CubeFaceState; R: CubeFaceState;
  }
  ```
- **Solved State & Standard Color Scheme** (lines 31–38):
  - `U` (Up, +Y): Yellow (center: `U[4]`)
  - `D` (Down, -Y): White (center: `D[4]`)
  - `F` (Front, +Z): Green (center: `F[4]`)
  - `B` (Back, -Z): Blue (center: `B[4]`)
  - `L` (Left, -X): Orange (center: `L[4]`)
  - `R` (Right, +X): Red (center: `R[4]`)
- **Move Mechanics** (`applyMove`, lines 75–148):
  - Face rotation uses `rotateFaceClockwise`: `[6, 3, 0, 7, 4, 1, 8, 5, 2]`.
  - Handles modifiers `'2'` (double application) and `"'"` (triple application).
  - Strip cyclic permutations:
    - `U`: Front receives Right, Right receives Back, Back receives Left, Left receives Front.
    - `D`: Front receives Left, Left receives Back, Back receives Right, Right receives Front.
    - `F`: Top row of U[6..8], col 2 of L, top row of D[0..2], col 0 of R.
    - `B`: Top row of U[0..2], col 2 of R, row 2 of D[6..8], col 0 of L.
    - `R`: Col 2 of U[2,5,8], col 2 of F[2,5,8], col 2 of D[2,5,8], col 0 of B[0,3,6].
    - `L`: Col 0 of U[0,3,6], col 2 of B[2,5,8], col 0 of D[0,3,6], col 0 of F[0,3,6].
- **Solved Check** (`isCubeSolved`, lines 159–165):
  ```typescript
  export function isCubeSolved(cube: CubeNetState): boolean {
    const faces: FaceKey[] = ['U', 'D', 'F', 'B', 'L', 'R'];
    return faces.every((f) => {
      const center = cube[f][4];
      return cube[f].every((st) => st === center);
    });
  }
  ```

### 1.2 Pseudo-Solver & Fake Stages (`src/utils/solutionStages.ts`)
- `getSolutionForLevel(level, scrambleStr)` (lines 773–788):
  ```typescript
  export function getSolutionForLevel(level: SolverLevelId, scrambleStr?: string) {
    const isExactLevelDemo = !scrambleStr || scrambleStr === DEMO_SCRAMBLES[level];
    if (isExactLevelDemo) {
      return getStaticSolutionForLevel(level);
    }
    return generateDynamicSolution(level, scrambleStr);
  }
  ```
- `generateDynamicSolution(level, scrambleStr)` (lines 490–537, 615–633):
  ```typescript
  const invStr = invertMoves(scrambleStr);
  const movesTokens = invStr.trim().split(/\s+/).filter(Boolean);
  if (movesTokens.length === 0) {
    return getStaticSolutionForLevel(level);
  }
  // For level-1 (LBL): slices inverted scramble moves by arbitrary fractions:
  const splits = [0.15, 0.30, 0.45, 0.60, 0.75, 0.88];
  // For CFOP (level-2, level-3, level-4):
  const p1 = Math.max(1, Math.round(N * 0.25));
  const p2 = Math.max(p1 + 1, Math.round(N * 0.55));
  const p3 = Math.max(p2 + 1, Math.round(N * 0.80));
  ```
- **Finding**: The system DOES NOT implement any real solver algorithm. It merely inverts the scramble string `invertMoves(scrambleStr)` and cuts the string into arbitrary percentage slices. If `scrambleStr` is absent (custom or scanned 54-sticker state), it returns hardcoded demo moves for a static demo scramble!

### 1.3 State Disconnect in Camera Scanner & Interactive Solver (`Step2CameraScan.tsx` & `Step3SolveInteractive.tsx`)
- In `src/components/solver/Step2CameraScan.tsx` (lines 401–414, 533–546):
  `handleCaptureFace` and `handleProceedToStep3` pass `cubeNetData` to `onUpdateScannedCube`.
  However, `onSetDemoScramble` is NOT set for scanned cubes (remains `null`).
- In `src/components/solver/Step3SolveInteractive.tsx` (lines 116–148):
  ```typescript
  const solutionData = useMemo(() => {
    if (customAlgorithm) { ... }
    return getSolutionForLevel(activeLevel, demoScramble || undefined);
  }, [activeLevel, customAlgorithm, demoScramble]);
  ```
  `scannedCubeState` is completely ignored by `getSolutionForLevel`!
  Because `demoScramble` is `null` or undefined, `getSolutionForLevel` falls back to `getStaticSolutionForLevel(activeLevel)` — executing the hardcoded demo moves on the user's custom cube!
- In `src/components/solver/Step3SolveInteractive.tsx` (lines 293–320):
  When `moveIndex >= allMoves.length`, `setIsAllCompleted(true)` triggers confetti and displays:
  `🎉 Chúc mừng! Khối Rubik đã được giải hoàn tất 100%!`, even though the cube is in an unsolved, scrambled state!

### 1.4 State Validation & Parity Deficiencies (`Step2CameraScan.tsx`)
- In `Step2CameraScan.tsx` (lines 364–390, 1172–1239):
  Validation is limited to:
  - Color swatches counting `colorCounts[color] / 9`.
  - Verification count checking `${verifiedCount} / 54 Verified`.
  - Allowing progression to Step 3 if `Object.values(verifiedFaces).some(Boolean)`.
- **Finding**: There is zero checking for:
  - Exactly 9 of each color.
  - 6 distinct center pieces matching standard orientation (U=Yellow, D=White, F=Green, B=Blue, L=Orange, R=Red).
  - 12 valid edge pieces without non-opposite illegal combinations or duplicate edges.
  - 8 valid corner pieces without illegal combinations or duplicate corners.
  - Edge orientation parity (`sum(EO) % 2 === 0`).
  - Corner orientation parity (`sum(CO) % 3 === 0`).
  - Permutation parity (`sgn(EP) === sgn(CP)`).
  - No Vietnamese diagnostic messages or guidance on which pieces/faces to correct.

### 1.5 3D Viewer Parity Mapping (`ThreeCubeViewer.tsx`)
- In `ThreeCubeViewer.tsx` (lines 99–140):
  Coordinate system: X (-1 to +1: L to R), Y (-1 to +1: D to U), Z (-1 to +1: B to F).
  Facelet index mappings:
  - `U`: `(z + 1) * 3 + (x + 1)`
  - `D`: `(1 - z) * 3 + (x + 1)`
  - `F`: `(1 - y) * 3 + (x + 1)`
  - `B`: `(1 - y) * 3 + (1 - x)`
  - `L`: `(1 - y) * 3 + (z + 1)`
  - `R`: `(1 - y) * 3 + (1 - z)`
- Rotation axes and angles in `parseMoveToRotation` (lines 35–97) match standard WCA conventions, but require formal programmatic unit test verification across all 18 move tokens.

### 1.6 Build, Bundle Size & Testing
- `npm run build`: Succeeds (exit 0) but produces an unsplit bundle warning:
  `dist/assets/index-DXofq1SR.js 981.09 kB │ gzip: 257.34 kB`
  `(!) Some chunks are larger than 500 kB after minification.`
  Violation of Acceptance Criteria ("zero chunk-size warnings / unsplit chunks exceeding 500 kB").
- `package.json`: No test scripts (`npm test` does not exist), no testing libraries installed (Vitest/Jest missing).

---

## 2. Logic Chain

1. **Premise 1**: Requirement R1 explicitly mandates:
   *"The solver must validate and solve any valid 54-sticker Rubik's Cube state (`CubeNetState`) obtained from the 6-face camera scanner or manual color editor, without relying solely on a pre-recorded scramble string."*
2. **Premise 2**: Observation 1.2 proves that `solutionStages.ts` calculates solutions solely by calling `invertMoves(scrambleStr)`.
3. **Premise 3**: Observation 1.3 proves that when a 54-sticker state is scanned or painted in Step 2, `demoScramble` is `null` or undefined. `Step3SolveInteractive.tsx` calls `getSolutionForLevel(activeLevel, undefined)` which returns static moves for a demo scramble.
4. **Deduction 1**: For ANY user-scanned or custom-painted cube, the application is fundamentally unable to generate a valid solution. Instead, it plays arbitrary moves that further scramble the user's cube.
5. **Premise 4**: Physical 3x3 Rubik's Cubes operate under strict group theory laws:
   - Conservation of edge orientation (sum of flips mod 2 = 0).
   - Conservation of corner orientation (sum of twists mod 3 = 0).
   - Conservation of permutation parity (edge permutation parity = corner permutation parity).
   - Piece uniqueness (12 unique edges, 8 unique corners, 6 unique fixed centers).
6. **Premise 5**: Observation 1.4 proves that zero parity or piece validation exists in the codebase.
7. **Deduction 2**: Scanned cubes with lighting artifacts or manually edited cubes with impossible physical states (single flipped edge, single twisted corner, swapped 2 edges) are blindly accepted without validation or diagnostic errors.
8. **Deduction 3**: To achieve Requirement R1 and pass all acceptance criteria, the system requires:
   - A robust Rubik's Cube state validator (`src/utils/cubeValidator.ts`) with parity checks and localized Vietnamese diagnostics.
   - A real mathematical solver engine (`src/utils/cubeSolver.ts`) capable of solving an arbitrary 54-sticker `CubeNetState` directly.
   - Genuine stage solvers for CFOP and LBL where intermediate stages physically solve the White Cross, F2L, OLL, and PLL in sequence.

---

## 3. Caveats

- **Algorithmic Complexity of Human Solvers**:
  An optimal two-phase solver (Kociemba) solves any state in ≤ 22 moves. A human-style CFOP/LBL solver requires authentic sub-solvers:
  - Cross Solver: BFS/IDA* depth ≤ 7 to find an optimal/sub-optimal cross solution on D.
  - F2L Solver: Slot-by-slot corner-edge pairing and insertion or BFS search preserving Cross.
  - OLL Solver: Direct state-to-case pattern matching against the 57 standard OLL algorithms in `algorithmsData.ts`.
  - PLL Solver: Direct state-to-case pattern matching against the 21 standard PLL algorithms in `algorithmsData.ts`.
- **Kociemba Table Generation vs Pure JS Solver**:
  Full Kociemba two-phase lookup tables can take 1–3MB of memory or initialization time. A lightweight Two-Phase solver or optimized IDA* solver must be chosen so bundle size stays well under the 500 kB chunk threshold.

---

## 4. Conclusion & Strategic Recommendation

### 4.1 Identified Bugs & Deficiencies

| ID | Location | Issue Description | Severity |
|---|---|---|---|
| **BUG-01** | `src/utils/solutionStages.ts:490` | Pseudo-solver: `generateDynamicSolution` only inverts `scrambleStr`. No mathematical solving capability exists. | **CRITICAL** |
| **BUG-02** | `src/components/solver/Step3SolveInteractive.tsx:147` | Ignores `scannedCubeState` when generating solution. Plays static demo moves on custom cubes, leaving them unsolved. | **CRITICAL** |
| **BUG-03** | `src/components/solver/Step2CameraScan.tsx:1172` | Missing validation: No checks for color counts (9 each), center identity, edge/corner validity, edge flip parity, corner twist parity, or permutation parity. | **HIGH** |
| **BUG-04** | `src/components/solver/Step3SolveInteractive.tsx:307` | False positive solve completion: triggers confetti and "100% SOLVED" based on move counter rather than `isCubeSolved`. | **HIGH** |
| **BUG-05** | `vite.config.js` | Production build produces unsplit vendor bundle `dist/assets/index-DXofq1SR.js` (981 kB > 500 kB limit). | **MEDIUM** |
| **BUG-06** | `package.json` | Missing `npm test` script and test runner (Vitest) for automated verification. | **HIGH** |

### 4.2 Architecture Recommendation & Step-by-Step Fix Strategy

#### Phase 1: Physical Piece Modeling & State Validation Module (`src/utils/cubeValidator.ts`)
1. Create `validateCubeState(cube: CubeNetState): ValidationResult`:
   - **Color Count**: Check exact 9 count for all 6 colors.
   - **Center Verification**: Validate that centers `U[4], D[4], F[4], B[4], L[4], R[4]` are unique and match standard WCA colors (Yellow, White, Green, Blue, Orange, Red).
   - **Edge Pieces (12 edges)**: Extract all 12 edge sticker pairs. Verify each pair matches one of the 12 valid non-opposite color combinations. Verify no duplicate edges.
   - **Corner Pieces (8 corners)**: Extract all 8 corner sticker triplets. Verify each matches one of the 8 valid corner types and verify chirality. Verify no duplicate corners.
   - **Edge Orientation Parity**: Compute orientation of each edge (relative to U/D or F/B). Check `sum(EO) % 2 === 0`. If odd, report single flipped edge error.
   - **Corner Orientation Parity**: Compute twist of each corner relative to U/D (0, 1, 2). Check `sum(CO) % 3 === 0`. If non-zero, report single twisted corner error.
   - **Permutation Parity**: Compute sign of edge permutation `sgn(EP)` and corner permutation `sgn(CP)`. Check `sgn(EP) === sgn(CP)`. If unequal, report swap parity error (2 swapped pieces).
2. Format localized, actionable Vietnamese diagnostic messages with exact piece and face locations.

#### Phase 2: Real Solver Engines (`src/utils/cubeSolver.ts`)
1. **Auto-Solve (Optimal Two-Phase / Kociemba)**:
   - Implement or integrate a lightweight pure-JS Two-Phase solver that converts `CubeNetState` into a 54-facelet representation (`UUUUUUUUURRRRRRRRR...`), executes Kociemba search, and returns move sequence.
   - Fallback solver: IDA* / BFS solver guaranteeing solution under all conditions.
2. **Authentic Human Solvers (CFOP & LBL)**:
   - **Stage 1 (White Cross on D)**: Solve 4 white edges to D matching side centers.
   - **Stage 2 (F2L / Layer 1 & 2)**:
     - For LBL: Insert 4 white corners, then 4 middle layer edges.
     - For CFOP: Pair and insert 4 corner-edge slots.
   - **Stage 3 (OLL)**: Orient last layer (Yellow face).
   - **Stage 4 (PLL)**: Permute last layer (Yellow corners & edges).
   - Each stage returns authentic moves that transform the cube into that exact solved stage state.

#### Phase 3: UI & 3D Synchronization (`Step2CameraScan.tsx` & `Step3SolveInteractive.tsx`)
1. In Step 2: Bind `validateCubeState` to live 2D net. Display a diagnostic banner:
   - If invalid: show warning banner with Vietnamese diagnostics and disable "Tạo Lời Giải Chi Tiết".
   - If valid: enable button with green badge "Khối Rubik Hợp Lệ 100%".
2. In Step 3: Pass `scannedCubeState` to `solveCube(scannedCubeState, activeLevel)`.
3. Check `isCubeSolved(currentState)` before declaring solve complete and firing confetti.

#### Phase 4: Automated Test Suite & Code Splitting
1. Install `vitest` and configure `npm test`.
2. Implement unit tests verifying:
   - `applyMove`, `applyScramble`, `invertMoves`, `isCubeSolved`.
   - 3D rotation matrix & coordinate mapping parity vs `applyMove`.
   - Rejection of invalid states (sticker counts, single flip, single twist, swapped pieces) with Vietnamese messages.
   - Direct solving of 50+ random WCA scrambles from `CubeNetState` resulting in `isCubeSolved === true`.
3. Configure `vite.config.js` `manualChunks` to split `three` and solver into separate vendor chunks, eliminating chunk-size warnings.

---

## 5. Verification Method

To independently verify the observations:

1. **Verify Pseudo-Solver & Inversion Flaw**:
   Inspect `src/utils/solutionStages.ts:490-503`:
   Observe `const invStr = invertMoves(scrambleStr);` and note that `generateDynamicSolution` does not calculate solutions from cube state.
2. **Verify Scanned State Disconnect in Step 3**:
   Inspect `src/components/solver/Step3SolveInteractive.tsx:147`:
   Observe `getSolutionForLevel(activeLevel, demoScramble || undefined)` — `scannedCubeState` is completely missing from the solver call.
3. **Verify Lack of Parity & State Validation**:
   Inspect `src/components/solver/Step2CameraScan.tsx:1172-1239`:
   Confirm that only `verifiedCount === 54` and swatch count is displayed; no parity or piece checking exists.
4. **Verify Bundle Size Warning**:
   Execute `npm run build` in PowerShell:
   Observe warning `dist/assets/index-DXofq1SR.js 981.09 kB (!) Some chunks are larger than 500 kB after minification`.
5. **Verify Missing Test Suite**:
   Inspect `package.json` scripts: observe lack of `npm test`.
