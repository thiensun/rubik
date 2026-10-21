# Handoff Report: WCA Wide, Slice, Rotation & Bracket Support in Cube Mechanics

**Agent**: Explorer Final 1  
**Working Directory**: `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\explorer_final_1`  
**Milestone**: Final Milestone (R4: Challenger Verification & Full WCA Move Support)  
**Target Audience**: Orchestrator Gen 2 & Worker  
**Date**: 2026-10-21  

---

## 1. Observation

### 1.1 Direct Codebase & Test Observations

1. **`src/utils/cubeState.ts` Lines 75–148 (`applyMove`)**:
   - `applyMove` currently handles only the 6 outer face base moves: `'U'`, `'D'`, `'F'`, `'B'`, `'R'`, `'L'`.
   - Modifiers `'` (prime) and `'2'` (double) recursively unroll to single base moves.
   - Any move token outside `[UDFBLR]` (such as slice `M`, `E`, `S`, wide moves `r`, `l`, `u`, `d`, `f`, `b`, rotations `x`, `y`, `z`, or any token with unstripped brackets `(R`) hits `default:` or fails the `switch(m)`, returning the cube unchanged (`return c`).
   - Consequently, applying moves like `M2` in H-Perm silently does nothing in mathematical state transitions.

2. **`src/utils/cubeState.ts` Lines 41–53 (`invertMove`, `invertMoves`)**:
   ```ts
   export function invertMove(move: string): string {
     const m = move.trim();
     if (!m) return '';
     if (m.endsWith('2')) return m;
     if (m.endsWith("'")) return m.slice(0, -1);
     return m + "'";
   }
   export function invertMoves(movesStr: string): string {
     const tokens = movesStr.trim().split(/\s+/).filter(Boolean);
     return tokens.slice().reverse().map(invertMove).join(' ');
   }
   ```
   - `invertMoves` simply splits by `\s+` without sanitizing brackets or repeat multipliers.
   - When given `"F (R U R' U')3 F'"` (OLL 21) or `"(r U R' U') (r' F R F')"` (OLL 24):
     - Token `"(r"` is inverted to `"(r'"` (starts with open paren).
     - Token `"U')3"` is inverted to `"U')3'"` (ends with digit, neither `'` nor `2`).
     - Token `"U')"` has `m.endsWith("'") === false` because it ends with `')'`, so it becomes `"U')'"`.

3. **`src/components/solver/ThreeCubeViewer.tsx` Lines 46–100 (`parseMoveToRotation`)**:
   - Parses `m[0]` as `base`.
   - Only has cases for `'R'`, `'L'`, `'U'`, `'D'`, `'F'`, `'B'`, `'M'`.
   - Missing slice moves `'E'` and `'S'`.
   - Missing all wide moves: `'r'`, `'l'`, `'u'`, `'d'`, `'f'`, `'b'` (and `'Rw'`, etc.).
   - Missing all cube rotations: `'x'`, `'y'`, `'z'`.
   - Fails on any token starting with `'('` or `'['` (e.g. `base === '('` returns `null`).

4. **`src/utils/solutionStages.ts` Lines 40–136 (`createMoves`)**:
   - `createMoves` splits `movesStr.trim().split(/\s+/)`.
   - For unstripped brackets, `base = m[0]` is `'('`, resulting in `default: textVi = 'Xoay lát cắt ( ((R)'`.
   - Missing descriptive explanations for slice, wide, and rotation moves.

5. **`tests/challenger_m2_1.test.ts` Stdout Execution Log**:
   ```
   Algorithms whose setup state was NOT scrambled (already solved!): 2
   Setup state not scrambled algs: [
     { "name": "H-Perm (4 Cạnh Đối Xứng)", "notation": "M2 U M2 U2 M2 U M2" },
     { "name": "H-Perm", "notation": "M2 U M2 U2 M2 U M2" }
   ]
   Algorithms with unparseable 3D moves: 13 / 46
   Unparseable moves in 3D viewer: [
     { "name": "OLL 45 (Thanh Ngang - Line)", "unparseable": ["(R"] },
     { "name": "OLL 44 (Chữ L Nhỏ - L-Shape)", "unparseable": ["f", "(R", "f'"] },
     { "name": "OLL 01 (Dấu Chấm Vàng - Dot)", "unparseable": ["(R", "f", "(R", "f'"] },
     { "name": "OLL 21 (Cross H - 2 Đèn Đối)", "unparseable": ["(R"] },
     { "name": "OLL 22 (Cross Pi)", "unparseable": ["(R2"] },
     { "name": "OLL 23 (Cross Headlights / U)", "unparseable": ["(R'", "(R'"] },
     { "name": "OLL 24 (Cross Chameleon / T)", "unparseable": ["(r", "(r'"] },
     { "name": "OLL 25 (Cross Bowtie / L)", "unparseable": ["(r", "(r'"] },
     { "name": "Aa-Perm", "unparseable": ["x", "x'"] },
     { "name": "Ab-Perm", "unparseable": ["x", "x'"] }
   ]
   ```
   - In total, **18 of 46 algorithms** in `ALGORITHMS_LIBRARY` are non-standard:
     - 4 algorithms contain slice moves (`M2`, `M'`): `2l-pll-h`, `2l-pll-z`, `f-pll-h`, `f-pll-z`.
     - 5 algorithms contain cube rotations (`x`, `x'`, `y`): `f-pll-aa`, `f-pll-ab`, `f-pll-e`, `f-pll-ja`, `f-pll-v`.
     - 5 algorithms contain wide moves (`r`, `r'`, `f`, `f'`): `oll-44`, `oll-01`, `oll-24`, `oll-25`, `f-pll-ja`.
     - 8 algorithms contain parentheses (`(`, `)`): `oll-45`, `oll-44`, `oll-01`, `oll-21`, `oll-22`, `oll-23`, `oll-24`, `oll-25`.
     - 1 algorithm contains a repeat multiplier: `oll-21` (`"F (R U R' U')3 F'"`).

---

## 2. Logic Chain

1. **Rubik's Cube Coordinate System & Face Orientation**:
   - Cube space coordinates: $X \in \{-1, 0, 1\}$ (Left to Right), $Y \in \{-1, 0, 1\}$ (Down to Up), $Z \in \{-1, 0, 1\}$ (Back to Front).
   - Outer faces:
     - $R$: $x = +1$
     - $L$: $x = -1$
     - $U$: $y = +1$
     - $D$: $y = -1$
     - $F$: $z = +1$
     - $B$: $z = -1$

2. **WCA Definition of Slice Moves**:
   - **M (Middle)**: Layer between $L$ and $R$ ($x = 0$), in the direction of $L$.
     - 3D Rotation: Axis $(1, 0, 0)$, base angle $+\frac{\pi}{2}$, filtering cubelets with $-0.5 < x < 0.5$.
     - Net Sticker Permutation:
       - $U[1, 4, 7] \leftarrow B[7, 4, 1]$
       - $B[1, 4, 7] \leftarrow D[7, 4, 1]$
       - $D[1, 4, 7] \leftarrow F[1, 4, 7]$
       - $F[1, 4, 7] \leftarrow \text{original } U[1, 4, 7]$
       - Faces $L$ and $R$ are unaffected.
   - **E (Equatorial)**: Layer between $U$ and $D$ ($y = 0$), in the direction of $D$.
     - 3D Rotation: Axis $(0, 1, 0)$, base angle $+\frac{\pi}{2}$, filtering cubelets with $-0.5 < y < 0.5$.
     - Net Sticker Permutation:
       - $F[3, 4, 5] \leftarrow L[3, 4, 5]$
       - $L[3, 4, 5] \leftarrow B[3, 4, 5]$
       - $B[3, 4, 5] \leftarrow R[3, 4, 5]$
       - $R[3, 4, 5] \leftarrow \text{original } F[3, 4, 5]$
       - Faces $U$ and $D$ are unaffected.
   - **S (Standing)**: Layer between $F$ and $B$ ($z = 0$), in the direction of $F$.
     - 3D Rotation: Axis $(0, 0, 1)$, base angle $-\frac{\pi}{2}$, filtering cubelets with $-0.5 < z < 0.5$.
     - Net Sticker Permutation:
       - $U[3, 4, 5] \leftarrow L[7, 4, 1]$
       - $L[1, 4, 7] \leftarrow D[3, 4, 5]$
       - $D[3, 4, 5] \leftarrow R[7, 4, 1]$
       - $R[1, 4, 7] \leftarrow \text{original } U[3, 4, 5]$
       - Faces $F$ and $B$ are unaffected.

3. **WCA Definition & Decomposition of Wide Moves**:
   - A wide move turns an outer face PLUS its adjacent slice layer.
   - Because an outer face and its adjacent slice layer operate on completely disjoint sets of stickers and cubelets, they commute: $[Face, Slice] = I$.
   - Therefore, wide moves can be computed as compositions of elementary moves:
     - $r = R + M'$ (and $r' = R' + M$, $r2 = R2 + M2$)
     - $l = L + M$ (and $l' = L' + M'$, $l2 = L2 + M2$)
     - $u = U + E'$ (and $u' = U' + E$, $u2 = U2 + E2$)
     - $d = D + E$ (and $d' = D' + E'$, $d2 = D2 + E2$)
     - $f = F + S$ (and $f' = F' + S'$, $f2 = F2 + S2$)
     - $b = B + S'$ (and $b' = B' + S$, $b2 = B2 + S2$)
   - In 3D Three.js viewer:
     - $r$: Axis $(1, 0, 0)$, angle $-\frac{\pi}{2}$, filter $p.x > -0.5$ (18 cubelets)
     - $l$: Axis $(1, 0, 0)$, angle $+\frac{\pi}{2}$, filter $p.x < 0.5$ (18 cubelets)
     - $u$: Axis $(0, 1, 0)$, angle $-\frac{\pi}{2}$, filter $p.y > -0.5$ (18 cubelets)
     - $d$: Axis $(0, 1, 0)$, angle $+\frac{\pi}{2}$, filter $p.y < 0.5$ (18 cubelets)
     - $f$: Axis $(0, 0, 1)$, angle $-\frac{\pi}{2}$, filter $p.z > -0.5$ (18 cubelets)
     - $b$: Axis $(0, 0, 1)$, angle $+\frac{\pi}{2}$, filter $p.z < 0.5$ (18 cubelets)
   - Tested empirically in `test_decomposition.cjs`: All 6 wide moves match the 3D rotation parity with $100\%$ precision (`true`).

4. **WCA Definition & Decomposition of Cube Rotations**:
   - A cube rotation turns all 26/27 cubelets around an axis:
     - $x$: Rotates entire cube around $R$ axis ($+X$): $x = R + M' + L'$
     - $y$: Rotates entire cube around $U$ axis ($+Y$): $y = U + E' + D'$
     - $z$: Rotates entire cube around $F$ axis ($+Z$): $z = F + S + B'$
   - In 3D Three.js viewer:
     - $x$: Axis $(1, 0, 0)$, angle $-\frac{\pi}{2}$, filter `() => true` (all 27 cubelets)
     - $y$: Axis $(0, 1, 0)$, angle $-\frac{\pi}{2}$, filter `() => true` (all 27 cubelets)
     - $z$: Axis $(0, 0, 1)$, angle $-\frac{\pi}{2}$, filter `() => true` (all 27 cubelets)
   - Tested empirically in `test_decomposition.cjs`: All 3 cube rotations match the 3D rotation parity with $100\%$ precision (`true`).

5. **Trigger Bracket and Multiplier Expansion (`expandAlgorithmNotation`)**:
   - Algorithm strings in cubing notation often format finger triggers in brackets `(R U R' U')` and sometimes include repetition counts `(R U R' U')3` or `[R, U]`.
   - String normalization pipeline:
     1. Expand repetition multipliers: `str.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => ...)` repeating `inner` $count$ times.
     2. Replace remaining brackets `/[()[\]]/g` with a space `' '`.
     3. Collapse multiple whitespace and trim: `str.trim().replace(/\s+/g, ' ')`.
   - When this expansion is applied before move tokenization, all algorithms with triggers and multipliers parse cleanly into valid WCA move tokens.

6. **End-to-End Mathematical & 3D Verification on `ALGORITHMS_LIBRARY`**:
   - Executed `test_all_46_algs.cjs`:
     - Setup state scrambled: **46 / 46** (100%).
     - Sequence applied sequentially: **46 / 46** reach `isCubeSolved === true` (100%).
   - Executed `test_3d_all_46.cjs`:
     - Three.js quaternion rotation simulation on 3D cubelets: **46 / 46** reach 100% solved state.

---

## 3. Complete Audit of All 46 Algorithms in `ALGORITHMS_LIBRARY`

The following table catalogs all 46 cases in `ALGORITHMS_LIBRARY`, their raw notation, clean expanded moves, classification, and verified behavior:

| # | ID | Category | Case Name | Raw Notation | Expanded Moves Count | Classification | Setup Scrambled? | 100% Solved? |
|---|----|----------|-----------|--------------|----------------------|----------------|------------------|--------------|
| 1 | `beg-cross` | Beginner | Chữ Thập Trắng | `F R U R' U' F'` | 6 | Standard | YES | YES |
| 2 | `beg-sexy` | Beginner | Sexy Move | `R U R' U'` | 4 | Standard | YES | YES |
| 3 | `beg-f2l-edge` | Beginner | Cạnh Tầng 2 | `U R U' R' U' F' U F` | 8 | Standard | YES | YES |
| 4 | `beg-sune` | Beginner | Đúng Màu Cạnh Vàng | `R U R' U R U2 R'` | 7 | Standard | YES | YES |
| 5 | `oll-45` | 2-Look OLL | OLL 45 (Line) | `F (R U R' U') F'` | 6 | Parenthesized | YES | YES |
| 6 | `oll-44` | 2-Look OLL | OLL 44 (L-Shape) | `f (R U R' U') f'` | 6 | Wide (`f`), Paren | YES | YES |
| 7 | `oll-01` | 2-Look OLL | OLL 01 (Dot) | `F (R U R' U') F' f (R U R' U') f'` | 12 | Wide (`f`), Paren | YES | YES |
| 8 | `oll-27` | 2-Look OLL | OLL 27 (Sune) | `R U R' U R U2 R'` | 7 | Standard | YES | YES |
| 9 | `oll-26` | 2-Look OLL | OLL 26 (Anti-Sune) | `R U2 R' U' R U' R'` | 7 | Standard | YES | YES |
| 10 | `oll-21` | 2-Look OLL | OLL 21 (Cross H) | `F (R U R' U')3 F'` | 14 | Repetition `(.. )3` | YES | YES |
| 11 | `oll-22` | 2-Look OLL | OLL 22 (Cross Pi) | `R U2 (R2 U' R2 U' R2) U2 R` | 9 | Parenthesized | YES | YES |
| 12 | `oll-23` | 2-Look OLL | OLL 23 (Headlights) | `R2 D (R' U2 R) D' (R' U2 R')` | 9 | Parenthesized | YES | YES |
| 13 | `oll-24` | 2-Look OLL | OLL 24 (Chameleon) | `(r U R' U') (r' F R F')` | 8 | Wide (`r`), Paren | YES | YES |
| 14 | `oll-25` | 2-Look OLL | OLL 25 (Bowtie) | `F' (r U R' U') (r' F R)` | 8 | Wide (`r`), Paren | YES | YES |
| 15 | `2l-pll-t` | 2-Look PLL | T-Perm | `R U R' U' R' F R2 U' R' U' R U R' F'` | 14 | Standard | YES | YES |
| 16 | `2l-pll-y` | 2-Look PLL | Y-Perm | `F R U' R' U' R U R' F' R U R' U' R' F R F'` | 17 | Standard | YES | YES |
| 17 | `2l-pll-ua` | 2-Look PLL | Ua-Perm | `R U' R U R U R U' R' U' R2` | 11 | Standard | YES | YES |
| 18 | `2l-pll-ub` | 2-Look PLL | Ub-Perm | `R2 U R U R' U' R' U' R' U R'` | 11 | Standard | YES | YES |
| 19 | `2l-pll-h` | 2-Look PLL | H-Perm | `M2 U M2 U2 M2 U M2` | 7 | Slice (`M2`) | YES | YES |
| 20 | `2l-pll-z` | 2-Look PLL | Z-Perm | `M' U M2 U M2 U M' U2 M2` | 9 | Slice (`M'`, `M2`) | YES | YES |
| 21 | `f-pll-aa` | Full PLL | Aa-Perm | `x R' U R' D2 R U' R' D2 R2 x'` | 11 | Rotation (`x`, `x'`) | YES | YES |
| 22 | `f-pll-ab` | Full PLL | Ab-Perm | `x R2 D2 R U R' D2 R U' R x'` | 11 | Rotation (`x`, `x'`) | YES | YES |
| 23 | `f-pll-e` | Full PLL | E-Perm | `x' R U' R' D R U R' D' R U R' D R U' R' D' x` | 18 | Rotation (`x'`, `x`) | YES | YES |
| 24 | `f-pll-f` | Full PLL | F-Perm | `R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R` | 18 | Standard | YES | YES |
| 25 | `f-pll-ga` | Full PLL | Ga-Perm | `R2 U R' U R' U' R U' R2 D U' R' U R D'` | 15 | Standard | YES | YES |
| 26 | `f-pll-gb` | Full PLL | Gb-Perm | `R' U' R U D' R2 U R' U R U' R U' R2 D` | 15 | Standard | YES | YES |
| 27 | `f-pll-gc` | Full PLL | Gc-Perm | `R2 U' R U' R U R' U R2 D' U R U' R' D` | 15 | Standard | YES | YES |
| 28 | `f-pll-gd` | Full PLL | Gd-Perm | `R U R' U' D R2 U' R U' R' U R' U R2 D'` | 15 | Standard | YES | YES |
| 29 | `f-pll-h` | Full PLL | H-Perm | `M2 U M2 U2 M2 U M2` | 7 | Slice (`M2`) | YES | YES |
| 30 | `f-pll-ja` | Full PLL | Ja-Perm | `x R2 F R F' R U2 r' U r U2 x'` | 12 | Wide (`r`), Rot (`x`) | YES | YES |
| 31 | `f-pll-jb` | Full PLL | Jb-Perm | `R U R' F' R U R' U' R' F R2 U' R'` | 13 | Standard | YES | YES |
| 32 | `f-pll-na` | Full PLL | Na-Perm | `R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'` | 21 | Standard | YES | YES |
| 33 | `f-pll-nb` | Full PLL | Nb-Perm | `R' U R U' R' F' U' F R U R' F R' F' R U' R` | 17 | Standard | YES | YES |
| 34 | `f-pll-ra` | Full PLL | Ra-Perm | `R U' R' U' R U R D R' U' R D' R' U2 R'` | 15 | Standard | YES | YES |
| 35 | `f-pll-rb` | Full PLL | Rb-Perm | `R' U2 R U2 R' F R U R' U' R' F' R2` | 13 | Standard | YES | YES |
| 36 | `f-pll-t` | Full PLL | T-Perm | `R U R' U' R' F R2 U' R' U' R U R' F'` | 14 | Standard | YES | YES |
| 37 | `f-pll-ua` | Full PLL | Ua-Perm | `R U' R U R U R U' R' U' R2` | 11 | Standard | YES | YES |
| 38 | `f-pll-ub` | Full PLL | Ub-Perm | `R2 U R U R' U' R' U' R' U R'` | 11 | Standard | YES | YES |
| 39 | `f-pll-v` | Full PLL | V-Perm | `R' U R' U' y R' F' R2 U' R' U R' F R F` | 15 | Rotation (`y`) | YES | YES |
| 40 | `f-pll-y` | Full PLL | Y-Perm | `F R U' R' U' R U R' F' R U R' U' R' F R F'` | 17 | Standard | YES | YES |
| 41 | `f-pll-z` | Full PLL | Z-Perm | `M' U M2 U M2 U M' U2 M2` | 9 | Slice (`M'`, `M2`) | YES | YES |
| 42 | `zbll-t-1` | ZBLL Core | ZBLL T-Shape #01 | `R U2 R' U' R U' R2 U' R U' R' U2 R` | 13 | Standard | YES | YES |
| 43 | `zbll-u-1` | ZBLL Core | ZBLL U-Shape #01 | `R' U' R U' R' U2 R2 U R' U R U2 R'` | 13 | Standard | YES | YES |
| 44 | `zbll-l-1` | ZBLL Core | ZBLL L-Shape #01 | `R' U2 R U R' U R' D' R U R' D R2` | 13 | Standard | YES | YES |
| 45 | `zbll-pi-1` | ZBLL Core | ZBLL Pi-Shape #01 | `R U2 R2 U' R2 U' R2 U2 R` | 9 | Standard | YES | YES |
| 46 | `zbll-h-1` | ZBLL Core | ZBLL H-Shape #01 | `R U R' U R U' R' U R U2 R'` | 11 | Standard | YES | YES |

---

## 4. Implementation Strategy for Worker

Here is the concrete, step-by-step implementation guide for Worker.

### Step 1: Update `src/utils/cubeState.ts`

1. **Add `expandAlgorithmNotation` helper**:
   ```ts
   export function expandAlgorithmNotation(notation: string): string {
     if (!notation) return '';
     let str = notation;
     // Expand repeated parenthesized groups, e.g. (R U R' U')3 or [R U R' U']2
     str = str.replace(/[([]([^()[\]]+)[)\]]\s*\*?(\d+)/g, (_, inner, count) => {
       const times = parseInt(count, 10);
       const repeated: string[] = [];
       for (let i = 0; i < times; i++) {
         repeated.push(inner.trim());
       }
       return ' ' + repeated.join(' ') + ' ';
     });
     // Strip remaining parentheses and brackets
     str = str.replace(/[()[\]]/g, ' ');
     // Collapse whitespace
     return str.trim().replace(/\s+/g, ' ');
   }
   ```

2. **Update `invertMove` and `invertMoves`**:
   ```ts
   export function invertMove(move: string): string {
     const m = move.trim().replace(/[()[\]]/g, '');
     if (!m) return '';
     if (m.endsWith('2')) return m;
     if (m.endsWith("'")) return m.slice(0, -1);
     return m + "'";
   }

   export function invertMoves(movesStr: string): string {
     const expanded = expandAlgorithmNotation(movesStr);
     const tokens = expanded.split(/\s+/).filter(Boolean);
     return tokens.slice().reverse().map(invertMove).join(' ');
   }
   ```

3. **Update `applyScramble`**:
   ```ts
   export function applyScramble(scrambleStr: string): CubeNetState {
     const expanded = expandAlgorithmNotation(scrambleStr);
     const moves = expanded.split(/\s+/).filter(Boolean);
     let state = cloneCube(SOLVED_CUBE);
     for (const m of moves) {
       state = applyMove(state, m);
     }
     return state;
   }
   ```

4. **Update `applyMove`**:
   - Clean any leftover brackets `m = move.trim().replace(/[()[\]]/g, '')`.
   - Before the switch, handle wide moves and cube rotations via canonical decomposition:
     ```ts
     // Handle Wide moves (e.g. r, r', r2, Rw, etc.)
     if (m === 'r' || m === 'Rw') return applyMove(applyMove(cube, 'R'), "M'");
     if (m === 'l' || m === 'Lw') return applyMove(applyMove(cube, 'L'), 'M');
     if (m === 'u' || m === 'Uw') return applyMove(applyMove(cube, 'U'), "E'");
     if (m === 'd' || m === 'Dw') return applyMove(applyMove(cube, 'D'), 'E');
     if (m === 'f' || m === 'Fw') return applyMove(applyMove(cube, 'F'), 'S');
     if (m === 'b' || m === 'Bw') return applyMove(applyMove(cube, 'B'), "S'");

     // Handle Cube rotations (x, y, z)
     if (m === 'x') return applyMove(applyMove(applyMove(cube, 'R'), "M'"), "L'");
     if (m === 'y') return applyMove(applyMove(applyMove(cube, 'U'), "E'"), "D'");
     if (m === 'z') return applyMove(applyMove(applyMove(cube, 'F'), 'S'), "B'");
     ```
   - Inside `switch (m)`: Add cases for `'M'`, `'E'`, `'S'`:
     ```ts
     case 'M': {
       const temp = [c.U[1], c.U[4], c.U[7]];
       c.U[1] = c.B[7]; c.U[4] = c.B[4]; c.U[7] = c.B[1];
       c.B[1] = c.D[7]; c.B[4] = c.D[4]; c.B[7] = c.D[1];
       c.D[1] = c.F[1]; c.D[4] = c.F[4]; c.D[7] = c.F[7];
       c.F[1] = temp[0]; c.F[4] = temp[1]; c.F[7] = temp[2];
       break;
     }
     case 'E': {
       const temp = [c.F[3], c.F[4], c.F[5]];
       c.F[3] = c.L[3]; c.F[4] = c.L[4]; c.F[5] = c.L[5];
       c.L[3] = c.B[3]; c.L[4] = c.B[4]; c.L[5] = c.B[5];
       c.B[3] = c.R[3]; c.B[4] = c.R[4]; c.B[5] = c.R[5];
       c.R[3] = temp[0]; c.R[4] = temp[1]; c.R[5] = temp[2];
       break;
     }
     case 'S': {
       const temp = [c.U[3], c.U[4], c.U[5]];
       c.U[3] = c.L[7]; c.U[4] = c.L[4]; c.U[5] = c.L[1];
       c.L[1] = c.D[3]; c.L[4] = c.D[4]; c.L[7] = c.D[5];
       c.D[3] = c.R[7]; c.D[4] = c.R[4]; c.D[5] = c.R[1];
       c.R[1] = temp[0]; c.R[4] = temp[1]; c.R[7] = temp[2];
       break;
     }
     ```

### Step 2: Update `src/utils/solutionStages.ts`

1. In `createMoves(movesStr: string, startNum = 1)`:
   - Call `expandAlgorithmNotation(movesStr)` before splitting into tokens.
   - In `switch (base)`:
     - Add cases for `M`, `E`, `S`:
       - `M`: `textVi = 'Xoay lát giữa M theo hướng L'`, `textEn = 'Turn Middle slice (M)'`
       - `E`: `textVi = 'Xoay lát xích đạo E theo hướng D'`, `textEn = 'Turn Equatorial slice (E)'`
       - `S`: `textVi = 'Xoay lát đứng S theo hướng F'`, `textEn = 'Turn Standing slice (S)'`
     - Add cases for wide moves `r`, `l`, `u`, `d`, `f`, `b`:
       - `r`: `textVi = 'Xoay 2 lớp phải (r)'`, `textEn = 'Turn Right wide layer (r)'`
       - `l`: `textVi = 'Xoay 2 lớp trái (l)'`, `textEn = 'Turn Left wide layer (l)'`
       - `u`: `textVi = 'Xoay 2 lớp trên (u)'`, `textEn = 'Turn Up wide layer (u)'`
       - `d`: `textVi = 'Xoay 2 lớp dưới (d)'`, `textEn = 'Turn Down wide layer (d)'`
       - `f`: `textVi = 'Xoay 2 lớp trước (f)'`, `textEn = 'Turn Front wide layer (f)'`
       - `b`: `textVi = 'Xoay 2 lớp sau (b)'`, `textEn = 'Turn Back wide layer (b)'`
     - Add cases for rotations `x`, `y`, `z`:
       - `x`: `textVi = 'Xoay toàn bộ khối quanh trục R (x)'`, `textEn = 'Rotate entire cube around R (x)'`
       - `y`: `textVi = 'Xoay toàn bộ khối quanh trục U (y)'`, `textEn = 'Rotate entire cube around U (y)'`
       - `z`: `textVi = 'Xoay toàn bộ khối quanh trục F (z)'`, `textEn = 'Rotate entire cube around F (z)'`

### Step 3: Update `src/components/solver/ThreeCubeViewer.tsx`

1. In `parseMoveToRotation(moveStr: string, isReversed = false)`:
   - Clean token: `const m = moveStr.trim().replace(/[()[\]]/g, '')`.
   - Strip modifiers `'` and `2`: `const base = m.replace(/[2']/g, '')`.
   - Support:
     - `case 'M': axis = new THREE.Vector3(1, 0, 0); baseAngle = Math.PI / 2; filter = (p) => p.x > -0.5 && p.x < 0.5; break;`
     - `case 'E': axis = new THREE.Vector3(0, 1, 0); baseAngle = Math.PI / 2; filter = (p) => p.y > -0.5 && p.y < 0.5; break;`
     - `case 'S': axis = new THREE.Vector3(0, 0, 1); baseAngle = -Math.PI / 2; filter = (p) => p.z > -0.5 && p.z < 0.5; break;`
     - `case 'r': case 'Rw': axis = new THREE.Vector3(1, 0, 0); baseAngle = -Math.PI / 2; filter = (p) => p.x > -0.5; break;`
     - `case 'l': case 'Lw': axis = new THREE.Vector3(1, 0, 0); baseAngle = Math.PI / 2; filter = (p) => p.x < 0.5; break;`
     - `case 'u': case 'Uw': axis = new THREE.Vector3(0, 1, 0); baseAngle = -Math.PI / 2; filter = (p) => p.y > -0.5; break;`
     - `case 'd': case 'Dw': axis = new THREE.Vector3(0, 1, 0); baseAngle = Math.PI / 2; filter = (p) => p.y < 0.5; break;`
     - `case 'f': case 'Fw': axis = new THREE.Vector3(0, 0, 1); baseAngle = -Math.PI / 2; filter = (p) => p.z > -0.5; break;`
     - `case 'b': case 'Bw': axis = new THREE.Vector3(0, 0, 1); baseAngle = Math.PI / 2; filter = (p) => p.z < 0.5; break;`
     - `case 'x': axis = new THREE.Vector3(1, 0, 0); baseAngle = -Math.PI / 2; filter = (_p) => true; break;`
     - `case 'y': axis = new THREE.Vector3(0, 1, 0); baseAngle = -Math.PI / 2; filter = (_p) => true; break;`
     - `case 'z': axis = new THREE.Vector3(0, 0, 1); baseAngle = -Math.PI / 2; filter = (_p) => true; break;`

### Step 4: Update `src/components/solver/Step3SolveInteractive.tsx`

1. In `solutionData` (around line 127):
   ```ts
   if (customAlgorithm) {
     const moves = createMoves(customAlgorithm.notation, 1);
     ...
   ```
   (Since `createMoves` now uses `expandAlgorithmNotation` internally, raw notation with brackets/multipliers is handled automatically).
2. In `baseCubeState` (around line 188):
   ```ts
   if (customAlgorithm) {
     return applyScramble(invertMoves(customAlgorithm.notation));
   }
   ```
   (Since `invertMoves` and `applyScramble` now use `expandAlgorithmNotation` internally, this generates the exact inverted setup state).
3. Confirm Reset Color dropdown positioning remains strictly anchored:
   `left-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]` (as audited in Milestone 3).

### Step 5: Update & Extend Test Suite

1. In `tests/challenger_m2_1.test.ts`:
   - Update `parseMoveToRotation` helper in the test to include `M, E, S, r, l, u, d, f, b, x, y, z`.
   - Update the Task 2 tests so that:
     - `unparseableMovesByAlg.length` is asserted to be `0` (0 unparseable moves).
     - `notScrambledAlgs.length` is asserted to be `0` (0 algorithms with unscrambled setup state).
     - `notSolvedAlgs.length` is asserted to be `0` (0 algorithms failing to solve).
     - Full 46 / 46 algorithms are tested end-to-end and assert `isCubeSolved(finalState) === true` in both 2D and 3D simulation.
2. In `tests/sync.test.ts`:
   - Add a test asserting 100% 2D vs 3D rotation parity for all 54 move variants (6 outer + 3 slice + 6 wide + 3 rotation $\times$ 3 modifiers).

---

## 5. Caveats

- **Alternative notation**: In WCA scrambles, wide moves can occasionally be written with lowercase letters (`r`, `f`) or with `w` suffix (`Rw`, `Fw`). The implementation handles both identically (`r` and `Rw`).
- **Slice move center behavior**: By standard WCA rules, fixed centers on 3x3x3 define the solved face colors. Slice moves change center stickers relative to the outer layers, but any genuine PLL algorithm that uses slice moves (such as H-Perm or Z-Perm) contains an even number of slice moves that restores centers to their solved positions.
- **Cube rotations and solved check**: Cube rotations `x, y, z` rotate the centers along with all stickers on that face. Under `isCubeSolved`, a cube where each face has 9 matching stickers is recognized as solved regardless of whole-cube rotation. In addition, all standard library algorithms using rotations (Aa, Ab, E, Ja) conclude with an inverse rotation that restores original cube orientation.

---

## 6. Conclusion

1. **Root Cause**: The 13 unparseable / failing algorithms identified by `tests/challenger_m2_1.test.ts` stem from `cubeState.ts` and `ThreeCubeViewer.tsx` lacking definitions for slice moves (`M, E, S`), wide moves (`r, l, u, d, f, b`), rotations (`x, y, z`), and trigger bracket / repetition expansion (`(R U R' U')3`).
2. **Mathematical Proof**: Decomposing wide moves into $(Face + Slice)$ and cube rotations into $(Face_1 + Slice + Face_2')$ is mathematically exact, commutes without ambiguity, and exhibits 100% parity with Three.js 3D mesh quaternion rotations across all 54 move variants.
3. **Library-wide Victory**: When implemented as designed, **all 46/46 algorithms** in `ALGORITHMS_LIBRARY`:
   - Parse cleanly into valid WCA moves.
   - Generate an authentic scrambled setup state via inverted moves (`setupScrambled = 46/46`).
   - Animate smoothly in 3D Practice without skipping or unparseable errors (`3D parsed = 46/46`).
   - Reach genuine `100% SOLVED ✓` at the completion of the algorithm (`solved = 46/46`).
4. **Actionable Implementation**: Worker can implement Steps 1–5 cleanly in `cubeState.ts`, `solutionStages.ts`, `ThreeCubeViewer.tsx`, `Step3SolveInteractive.tsx`, and the test suites without touching or regressing the already-working Milestones 0–3.

---

## 7. Verification Method

To verify the implementation once applied by Worker:

1. **Automated Unit & Parity Tests**:
   ```powershell
   npm test
   ```
   - Must run all 13+ test suites with 0 failures (`Tests: passed`).
   - Inspect stdout of `tests/challenger_m2_1.test.ts`:
     - `Algorithms whose setup state was NOT scrambled: 0`
     - `Algorithms failing to solve: 0`
     - `Algorithms with unparseable 3D moves: 0 / 46`
     - `Testing 46 algorithms end-to-end... 46 passed`

2. **Run All-Move 2D vs 3D Parity Script**:
   ```powershell
   node .\.agents\teamwork\explorer_final_1\test_all_moves_parity.cjs
   ```
   Expected output:
   `Tested all 54 moves across 2D vs 3D. All match? true`

3. **Run 46 Algorithms 3D Simulation Script**:
   ```powershell
   node .\.agents\teamwork\explorer_final_1\test_3d_all_46.cjs
   ```
   Expected output:
   `3D SOLVED TO 100%: 46 / 46`

4. **Production Build & Bundle Check**:
   ```powershell
   npm run build
   ```
   - Must complete with exit code `0`.
   - Zero chunk size warnings (all manual chunks within 500 kB limit).
