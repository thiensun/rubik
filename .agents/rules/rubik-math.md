# Rubik Mathematical Engine & Multi-Cube Invariants (2x2, 3x3, 4x4)

## 1. Parametric State Matrix
- CubeSize is strictly typed as `2 | 3 | 4`.
- Total stickers per cube: `6 * (CubeSize * CubeSize)` (24 for 2x2, 54 for 3x3, 96 for 4x4).
- 3D Surface Cubies count: 8 for 2x2, 26 for 3x3, 56 for 4x4 (never render internal hidden core cubies).
- Coordinate centering formula for any N: `offset = (N - 1) / 2`, `cubieScale = 2.7 / N`.

## 2. Extended WCA Notation & Layer Depth Standards
- Outer layer moves (depth `[0]`): `U, D, L, R, F, B` (with `'`, `2`). Valid for 2x2, 3x3, 4x4.
- 2x2x2 Scrambler & Solver restriction: Use only `<U, R, F>` move group (keep DBL corner fixed in space).
- Wide moves for 4x4x4 (depth `[0, 1]`): `Rw, Uw, Fw, Lw, Dw, Bw` (and lowercase `r, u, f, l, d, b`).
- Inner slice moves for 4x4x4 Parity (depth `[1]` only): `2R, 2U, 2L, 2F, 2D, 2B` (including `2R2`, `2U2`).
- Slice & rotation tokens: `M, E, S` and `x, y, z` (with `'`, `2`).

## 3. Trigger Tokenization Standards
- Always preserve and color-code trigger groupings in parentheses across all sizes:
  - `(R U R' U')` -> Sexy Move (Emerald)
  - `(U R U' R')` -> Inverse Sexy (Sky Blue)
  - `(R' F R F')` -> Sledgehammer (Amber)
  - `(F R' F' R)` -> Hedgeslammer (Violet)
  - `(L' U' L U)` -> Left Sexy (Teal)
  - `(R U2 R')`   -> Fast Flick (Rose)
  - `(Rw U2 Rw)`  -> Wide Parity Trigger (Indigo)

## 4. State & Inverse Rules (`invertAlg`)
- Strip parentheses and tokenize moves accurately (preserving prefixes like `2R` and suffixes like `w'`, `w2`).
- REVERSE the token array order (`.reverse()`) from last move to first move.
- Flip modifiers:
  - `R` <-> `R'`, `Rw` <-> `Rw'`, `2R` <-> `2R'`
  - Self-inverses remain unchanged: `R2` -> `R2`, `Rw2` -> `Rw2`, `2R2` -> `2R2`.
- 2D & 3D Pre-execution State: Always apply `invertAlg(mainAlg)` onto a solved `N x N` state.

## 5. Solver & Parity Invariants
- Run `optimizeMoves()` on all generated solutions to cancel adjacent redundant turns on the same layer (`R + R' -> []`, `Rw + Rw -> Rw2`, `U2 + U -> U'`).
- 2x2x2 Optimal Solver must resolve any state in `<= 11` moves HTM.
- 3x3x3 CFOP Solver must resolve within 45 to 65 moves (4 distinct F2L slots: FR, FL, BR, BL).
- 4x4x4 Reduction/Yau Solver must explicitly detect and isolate OLL Parity (odd wing edge flip count) and PLL Parity (odd dedge permutation swap) into dedicated roadmap stages.
