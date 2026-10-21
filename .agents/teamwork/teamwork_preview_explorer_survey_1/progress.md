# Progress — Explorer 1: Cube Mechanics & Real Solver Specialist

Last visited: 2026-10-20T16:16:00Z

## Status
Survey and exploration complete. All findings, evidence, and recommendations compiled into `handoff.md`.

## Tasks
- [x] 1. Identify file structure and locate all cube mechanics and solver files.
- [x] 2. Inspect CubeNetState representation, faces, 54 sticker indexing, colors, `applyMove`, `applyScramble`, `invertMoves`, `isCubeSolved`.
- [x] 3. Analyze solver engines: `auto-solve` and human-style solver levels (level-1 to level-4: CFOP stages Cross, F2L, OLL, PLL, and beginner/LBL).
- [x] 4. Analyze arbitrary 54-sticker state solving from scanner/color picker: mapping, limitations, crash causes.
- [x] 5. Analyze state validation and parity checks (color counts, center stickers, edge orientation/permutation, corner orientation/permutation, duplicate pieces, Vietnamese diagnostic messages).
- [x] 6. Identify all bugs, design flaws, and missing logic.
- [x] 7. Formulate step-by-step fix strategy and architecture recommendations.
- [x] 8. Synthesize findings and write handoff report (`handoff.md`).

## Preliminary Findings
1. **Mock / Pseudo-Solver in `solutionStages.ts`**:
   - `getSolutionForLevel` calls `generateDynamicSolution(level, scrambleStr)` which merely inverts `scrambleStr` (`invertMoves(scrambleStr)`).
   - If `scrambleStr` is absent (such as when scanning a physical cube or editing the 2D net manually), it falls back to hardcoded `getStaticSolutionForLevel(level)` which has static demo moves for a single fixed demo scramble!
   - For human levels (LBL and CFOP), the stages are fabricated by slicing the inverted scramble moves tokens with arbitrary percentage fractions (`splits = [0.15, 0.30, ...]` and `0.25, 0.55, 0.80`). It does NOT actually solve Cross, F2L, OLL, or PLL!
2. **Missing Solver Engine for Arbitrary 54-Sticker States**:
   - There is NO two-phase solver (e.g. Kociemba) or real CFOP / LBL solver implemented that accepts `CubeNetState`.
   - When user scans a cube with camera or modifies stickers, there is no scramble string. Step 3 displays a warning ("Chưa phát hiện khối Rubik đã quét") if `scannedCubeState` is missing, but if present, `getSolutionForLevel(activeLevel, undefined)` returns the hardcoded demo moves! The 3D viewer then plays the demo moves on top of the user's custom cube state, resulting in a completely scrambled, unsolved cube rather than solving it!
3. **Missing State Validation & Parity Checking**:
   - Currently, `Step2CameraScan.tsx` only counts the number of verified faces (out of 6) and color swatches (out of 9 each).
   - There is ZERO validation for:
     - Edge orientation parity: sum of edge orientations must be 0 mod 2.
     - Corner orientation parity: sum of corner twists must be 0 mod 3.
     - Permutation parity: total permutation parity of corners and edges must be equal (even permutation).
     - Unique and valid edge pieces: all 12 edges must be valid pairs of non-opposite faces, with no duplicates.
     - Unique and valid corner pieces: all 8 corners must be valid triplets of faces, with no duplicates.
     - Center stickers: 6 centers must be fixed and unique (standard color scheme: U=Yellow, D=White, F=Green, B=Blue, L=Orange, R=Red).
     - Missing actionable Vietnamese diagnostic error messages explaining which pieces are flipped, twisted, or duplicated.
