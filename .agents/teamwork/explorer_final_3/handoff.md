# Explorer 3 Final Investigation & Verification Report

## Core Assessment
The codebase is in an advanced, healthy state: all 13 existing test suites pass (384/384 tests), and `npm run build` succeeds cleanly with zero chunk-size warnings (< 500 kB). Both `D:\Projects\rubik` and `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code` are currently 100% text-synchronized. The Step 3 Reset Color dropdown is anchored at `left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]` within a `relative` wrapper. However, an empirical coverage gap prevents 13 of the 46 algorithms in `ALGORITHMS_LIBRARY` from animating and solving in 3D Practice due to lack of WCA slice (`M, E, S`), wide (`r, l, u, d, f, b`), and cube rotation (`x, y, z`) moves, and parenthesized trigger multiplier parsing in `cubeState.ts` and `ThreeCubeViewer.tsx`. Additionally, an adversarial state precedence bug in `Step3SolveInteractive.tsx` causes desynchronization if a user navigates to 3D Practice after previously scanning a cube.

---

## 1. Observation

### 1.1 Step 3 Reset Color Dropdown Anchoring
- **File**: `src/components/solver/Step3SolveInteractive.tsx`
- **Line 798**: Parent container is declared relative:
  ```tsx
  {/* Reset Color Dropdown */}
  <div className="relative">
  ```
- **Line 824**: Dropdown menu container is positioned:
  ```tsx
  <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
  ```
- **Backdrop Overlay** (Line 820):
  ```tsx
  <div className="fixed inset-0 z-40" onClick={() => setIsResetMenuOpen(false)} />
  ```
- **Test Enforcement**: `tests/responsive.test.ts` (line 112) and `tests/challenger_m3.test.ts` (line 179) both explicitly assert:
  ```typescript
  expect(step3Source).toContain('left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]');
  ```

### 1.2 Existing Test Suite Execution Status
- Executing `npm test` (`vitest run`) in `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code`:
  ```
  Test Files  13 passed (13)
       Tests  384 passed (384)
    Duration  9.63s
  ```
- List of 13 test suites and counts:
  1. `tests/adversarial_solver.test.ts`: 108 tests passed
  2. `tests/adversarial_views.test.ts`: 15 tests passed
  3. `tests/challenger_m1.test.ts`: 64 tests passed
  4. `tests/challenger_m1_2.test.ts`: 25 tests passed
  5. `tests/challenger_m2_1.test.ts`: 9 tests passed
  6. `tests/challenger_m2_2.test.ts`: 12 tests passed
  7. `tests/challenger_m3.test.ts`: 15 tests passed
  8. `tests/responsive.test.ts`: 14 tests passed
  9. `tests/smoke.test.ts`: 6 tests passed
  10. `tests/solver.test.ts`: 8 tests passed
  11. `tests/stress.test.ts`: 61 tests passed
  12. `tests/sync.test.ts`: 37 tests passed
  13. `tests/validation.test.ts`: 10 tests passed

### 1.3 Production Build & Bundle Size
- Executing `npm run build`:
  ```
  dist/index.html                         1.34 kB │ gzip:   0.66 kB
  dist/assets/index-b_H7nFsj.css         64.98 kB │ gzip:  10.91 kB
  dist/assets/lucide-CB2F_x0u.js         25.85 kB │ gzip:   6.06 kB
  dist/assets/react-vendor-CAH2-Xdv.js  223.22 kB │ gzip:  69.24 kB
  dist/assets/index-B9dGcZ7n.js         267.86 kB │ gzip:  66.62 kB
  dist/assets/three-CV8TCiUC.js         484.74 kB │ gzip: 121.20 kB
  ✓ built in 14.59s
  ```
  All chunks are strictly < 500 kB (largest is Three.js at 484.74 kB). Zero bundle warnings.

### 1.4 Workspace Synchronization (`D:\Projects\rubik` vs Git Worktree)
- Tool command: `git diff --no-index 'D:\Projects\rubik\src' 'C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\src'`
- Tool command: `git diff --no-index 'D:\Projects\rubik\tests' 'C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\tests'`
- Tool command: `git diff --no-index 'D:\Projects\rubik\package.json' 'C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\package.json'`
- Tool command: `git diff --no-index 'D:\Projects\rubik\vite.config.js' 'C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\vite.config.js'`
- Result: 0 textual differences. The worktree and the original repository are in 100% sync as of baseline.

### 1.5 Diagnostic Finding: 13/46 Algorithms in `ALGORITHMS_LIBRARY` Unparseable in 3D Practice
- Running `tests/challenger_m2_1.test.ts` outputs:
  ```
  Algorithms whose setup state was NOT scrambled (already solved!): 2
  Setup state not scrambled algs: [
    { "name": "H-Perm (4 Cạnh Đối Xứng)", "notation": "M2 U M2 U2 M2 U M2" },
    { "name": "H-Perm", "notation": "M2 U M2 U2 M2 U M2" }
  ]
  === 3D VIEWER MOVE PARSING AUDIT ===
  Algorithms with unparseable 3D moves: 13 / 46
  Unparseable moves in 3D viewer:
  - OLL 45: "(R"
  - OLL 44: "f", "(R", "f'"
  - OLL 01: "(R", "f", "(R", "f'"
  - OLL 21: "(R" [notation has "F (R U R' U')3 F'"]
  - OLL 22: "(R2"
  - OLL 23: "(R'", "(R'"
  - OLL 24: "(r", "(r'"
  - OLL 25: "(r", "(r'"
  - Aa-Perm: "x", "x'"
  - Ab-Perm: "x", "x'"
  ```
- In `src/utils/cubeState.ts`:
  - `applyMove` (lines 75–148) only handles `case 'U'`, `'D'`, `'F'`, `'B'`, `'R'`, `'L'`. Any slice move (`M, E, S`), wide move (`r, l, u, d, f, b`), or rotation (`x, y, z`) silently falls through and returns the cube unmodified.
  - `invertMove` (lines 41–47) does not strip parentheses or handle composite tokens.
- In `src/components/solver/ThreeCubeViewer.tsx`:
  - `parseMoveToRotation` (lines 46–108) only handles `base` in `'R', 'L', 'U', 'D', 'F', 'B', 'M'`. It lacks `'E', 'S'`, all wide moves (`r, l, u, d, f, b`), all rotations (`x, y, z`), and fails if a token contains parentheses (e.g. `(R`).
- In `src/components/solver/Step3SolveInteractive.tsx`:
  - Line 127 naive regex: `const sanitizedNotation = customAlgorithm.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');`
  - When applied to OLL 21 `F (R U R' U')3 F'`, it produces `F R U R' U'3 F'`, leaving an invalid token `U'3` instead of expanding the 3 repeats (total 14 moves).
  - Line 185 precedence conflict:
    ```typescript
    const baseCubeState = useMemo(() => {
      if (scannedCubeState) return scannedCubeState;
      if (customAlgorithm) { ... }
    ```
    If `scannedCubeState` exists from a previous camera scan or manual edit, selecting "Practice in 3D" from Algorithm Library loads the custom algorithm's moves into `solutionData`, but `baseCubeState` still returns `scannedCubeState`. This causes complete desynchronization between the 3D cube mesh and the algorithm moves.

---

## 2. Logic Chain

1. **Premise 1 (Step 3 Dropdown)**: Observation 1.1 proves that the Reset Color dropdown in `Step3SolveInteractive.tsx` is located at line 824 with exact classes `left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]`. This is verified by 2 separate Vitest tests. Preserving this class string unchanged guarantees backward compatibility and prevents mobile clipping.
2. **Premise 2 (State Precedence)**: Observation 1.5 shows `baseCubeState` checks `if (scannedCubeState)` before `if (customAlgorithm)`. In contrast, `solutionData` (lines 126–155) checks `if (customAlgorithm)` first. Because `customAlgorithm` is an intentional explicit navigation from the Algorithm Library, it represents the user's immediate intent. Therefore, `if (customAlgorithm)` MUST take precedence over `if (scannedCubeState)` in `baseCubeState`.
3. **Premise 3 (WCA Mechanics Parity)**:
   - Slice moves `M`, `E`, `S` affect the 3 center pieces and 4 middle edges:
     - `M` follows `L`: $U \rightarrow F \rightarrow D \rightarrow B \rightarrow U$.
     - `E` follows `D`: $F \rightarrow R \rightarrow B \rightarrow L \rightarrow F$.
     - `S` follows `F`: $U \rightarrow R \rightarrow D \rightarrow L \rightarrow U$.
   - Wide moves are combinations of outer faces and slice moves:
     - $r = R + M'$
     - $l = L + M$
     - $u = U + E'$
     - $d = D + E$
     - $f = F + S$
     - $b = B + S'$
   - Rotations are whole-cube reorientations:
     - $x = R + M' + L'$ (axis $(1, 0, 0)$, angle $-\pi/2$)
     - $y = U + E' + D'$ (axis $(0, 1, 0)$, angle $-\pi/2$)
     - $z = F + S + B'$ (axis $(0, 0, 1)$, angle $-\pi/2$)
4. **Premise 4 (Repeat Expander)**: Algorithm OLL 21 in `algorithmsData.ts` defines `movesCount: 14` with notation `F (R U R' U')3 F'`. This requires an expansion function `expandAlgorithmNotation` that detects `\(([^)]+)\)(\d+)` and repeats the inner moves $N$ times, then strips remaining parentheses and normalizes spaces.
5. **Deduction**: Implementing `expandAlgorithmNotation`, slice moves `M, E, S`, wide moves `r, l, u, d, f, b`, rotations `x, y, z`, and updating `ThreeCubeViewer.tsx` and `Step3SolveInteractive.tsx` will allow 46/46 (100%) library algorithms to scramble, invert, animate, and reach `isCubeSolved === true`.

---

## 3. Caveats

1. **Read-Only Explorer Scope**: Explorer agents are strictly read-only and must not edit application source code files. The code snippets and migration steps in this document are recommendations for the Worker agent.
2. **WCA Wide Move Syntax Variations**: Cubing notation sometimes uses `Rw` instead of `r`, `Fw` instead of `f`. The sanitizer and move parser should support both lower-case (`r, l, u, d, f, b`) and uppercase-w (`Rw, Lw, Uw, Dw, Fw, Bw`) formats.
3. **Whole-Cube Rotation & `isCubeSolved`**: In `cubeState.ts`, `isCubeSolved` checks if all stickers on each face match that face's center sticker (`cube[f].every(st => st === cube[f][4])`). This center-relative definition correctly recognizes a rotated solved cube as solved.

---

## 4. Conclusion & Actionable Recommendations

### 4.1 Required Worker Modifications

#### Action 1: Update `src/utils/cubeState.ts`
1. Export helper `expandAlgorithmNotation(notation: string): string`:
   ```typescript
   export function expandAlgorithmNotation(notation: string): string {
     if (!notation) return '';
     let expanded = notation.replace(/\(([^)]+)\)(\d+)/g, (_, group, count) => {
       const n = parseInt(count, 10);
       return Array(n).fill(group.trim()).join(' ');
     });
     expanded = expanded.replace(/[()[\]]/g, ' ');
     return expanded.trim().replace(/\s+/g, ' ');
   }
   ```
2. Enhance `invertMove` and `invertMoves` to use `expandAlgorithmNotation` and handle all WCA tokens (`M, E, S`, wide, rotations).
3. Implement `M`, `E`, `S` slice permutations in `applyMove(cube, m)`.
4. Delegate wide moves (`r, l, u, d, f, b`, `Rw..`) and rotations (`x, y, z`) in `applyMove` to their equivalent face and slice combinations.

#### Action 2: Update `src/components/solver/ThreeCubeViewer.tsx`
1. In `parseMoveToRotation`:
   - Strip parentheses defensively: `const clean = moveStr.replace(/[()[\]]/g, '').trim();`
   - Add slice support:
     - `M`: `axis = (1, 0, 0)`, `angle = Math.PI / 2`, `filter = (p) => p.x > -0.5 && p.x < 0.5`
     - `E`: `axis = (0, 1, 0)`, `angle = Math.PI / 2`, `filter = (p) => p.y > -0.5 && p.y < 0.5`
     - `S`: `axis = (0, 0, 1)`, `angle = -Math.PI / 2`, `filter = (p) => p.z > -0.5 && p.z < 0.5`
   - Add wide moves:
     - `r` / `Rw`: `axis = (1, 0, 0)`, `angle = -Math.PI / 2`, `filter = (p) => p.x > -0.5`
     - `l` / `Lw`: `axis = (1, 0, 0)`, `angle = Math.PI / 2`, `filter = (p) => p.x < 0.5`
     - `u` / `Uw`: `axis = (0, 1, 0)`, `angle = -Math.PI / 2`, `filter = (p) => p.y > -0.5`
     - `d` / `Dw`: `axis = (0, 1, 0)`, `angle = Math.PI / 2`, `filter = (p) => p.y < 0.5`
     - `f` / `Fw`: `axis = (0, 0, 1)`, `angle = -Math.PI / 2`, `filter = (p) => p.z > -0.5`
     - `b` / `Bw`: `axis = (0, 0, 1)`, `angle = Math.PI / 2`, `filter = (p) => p.z < 0.5`
   - Add whole-cube rotations:
     - `x`: `axis = (1, 0, 0)`, `angle = -Math.PI / 2`, `filter = () => true`
     - `y`: `axis = (0, 1, 0)`, `angle = -Math.PI / 2`, `filter = () => true`
     - `z`: `axis = (0, 0, 1)`, `angle = -Math.PI / 2`, `filter = () => true`

#### Action 3: Update `src/components/solver/Step3SolveInteractive.tsx`
1. Replace line 127:
   ```typescript
   // BEFORE:
   const sanitizedNotation = customAlgorithm.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
   // AFTER:
   const sanitizedNotation = expandAlgorithmNotation(customAlgorithm.notation);
   ```
2. Fix precedence in `baseCubeState` (lines 185–193):
   ```typescript
   const baseCubeState = useMemo(() => {
     // Prioritize customAlgorithm practice setup first
     if (customAlgorithm) {
       const sanitizedNotation = expandAlgorithmNotation(customAlgorithm.notation);
       return applyScramble(invertMoves(sanitizedNotation));
     }
     if (scannedCubeState) return scannedCubeState;
     const targetScramble = demoScramble || DEMO_SCRAMBLES[activeLevel] || CFOP_DEMO_SCRAMBLE;
     return applyScramble(targetScramble);
   }, [scannedCubeState, customAlgorithm, demoScramble, activeLevel]);
   ```
3. **Preserve Dropdown Anchoring**: Ensure lines 798 and 824 retain:
   ```tsx
   <div className="relative">
     ...
     <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
   ```

#### Action 4: Update `src/utils/solutionStages.ts`
In `createMoves`, provide friendly labels for `M, E, S`, wide moves, and rotations so the execution tape displays accurate text.

---

## 5. Verification Method

### 5.1 Verification Test Plan for Worker & Challengers

Worker and Challengers should execute the following 5-stage verification:

#### Stage 1: Full WCA Unit Tests in `tests/cubeMechanics.test.ts` or `tests/sync.test.ts`
```typescript
describe('WCA Slice, Wide & Rotation Move Mechanics', () => {
  it('expands trigger multipliers like (R U R\' U\')3 to 14 moves', () => {
    expect(expandAlgorithmNotation("F (R U R' U')3 F'"))
      .toBe("F R U R' U' R U R' U' R U R' U' F'");
  });

  it('verifies 4x M, E, S slice moves return cube to identity', () => {
    for (const slice of ['M', 'E', 'S']) {
      let cube = cloneCube(SOLVED_CUBE);
      for (let i = 0; i < 4; i++) cube = applyMove(cube, slice);
      expect(isCubeSolved(cube)).toBe(true);
    }
  });

  it('verifies wide move equivalences (r === R M\', f === F S, etc.)', () => {
    let c1 = applyMove(SOLVED_CUBE, 'r');
    let c2 = applyMove(applyMove(SOLVED_CUBE, 'R'), "M'");
    expect(c1).toEqual(c2);
  });
});
```

#### Stage 2: 3D Coordinate & Normal Parity Test for All Slice, Wide & Rotation Moves
Verify 100% 54-sticker parity between `applyMove(numberedNet, move)` and `readNetFrom3DCubelets(simulated)` for every move token:
- Slices: `M, M', M2, E, E', E2, S, S', S2`
- Wide moves: `r, r', r2, l, l', l2, u, u', u2, d, d', d2, f, f', f2, b, b', b2`
- Rotations: `x, x', x2, y, y', y2, z, z', z2`

#### Stage 3: End-to-End Verification Across ALL 46/46 Library Algorithms
Iterate across all 46 cases in `ALGORITHMS_LIBRARY`:
```typescript
for (const alg of ALGORITHMS_LIBRARY) {
  const sanitized = expandAlgorithmNotation(alg.notation);
  const moves = createMoves(sanitized, 1);
  const setupState = applyScramble(invertMoves(sanitized));

  // 1. Initial setup state is genuinely scrambled
  expect(isCubeSolved(setupState)).toBe(false);

  // 2. Sequential moves solve the 2D cube to 100%
  let cur2D = cloneCube(setupState);
  for (const m of moves) cur2D = applyMove(cur2D, m.move);
  expect(isCubeSolved(cur2D)).toBe(true);

  // 3. 3D simulation transforms cube to 100% solved
  const cubelets = build3DCubelets(setupState as any);
  for (const m of moves) {
    const rot = parseMoveToRotation(m.move);
    expect(rot).not.toBeNull();
    apply3DMoveToSimulated(cubelets, m.move);
  }
  const net3D = readNetFrom3DCubelets(cubelets);
  expect(isCubeSolved(net3D as any)).toBe(true);
}
```

#### Stage 4: CSS Regression & Dropdown Anchoring Test
Verify that `tests/responsive.test.ts` and `tests/challenger_m3.test.ts` pass:
- String `left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]` present in `Step3SolveInteractive.tsx`.

#### Stage 5: Workspace Synchronization & Production Build Verification
1. Synchronize all modified files from worktree back to `D:\Projects\rubik`:
   ```powershell
   git diff --no-index 'C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\src' 'D:\Projects\rubik\src'
   ```
   Must yield 0 differences.
2. Run automated test suite:
   ```powershell
   npm test
   ```
   Must exit with code 0.
3. Run production build:
   ```powershell
   npm run build
   ```
   Must exit with code 0, producing zero chunks over 500 kB.
