## 2026-10-20T16:38:00Z
You are Worker Milestone 1: 54-Sticker Cube State Validation & Real Solving Specialist.
Your working directory is:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\teamwork_preview_worker_m1

MANDATORY: Read the authoritative user request at:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\ORIGINAL_REQUEST.md

Read the project architecture and interface contracts at:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\orchestrator_1\PROJECT.md

Read the comprehensive findings and mathematical guidelines from Explorer 1 at:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\teamwork_preview_explorer_survey_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You exclusively own:
- `src/utils/cubeValidator.ts`
- `src/utils/cubeSolver.ts`
- `src/utils/solutionStages.ts`
- `src/components/solver/Step2CameraScan.tsx`
- `tests/validation.test.ts`
- `tests/solver.test.ts`
- Synchronization of these files to `D:\Projects\rubik`

Core Objectives to Implement:
1. `src/utils/cubeValidator.ts`:
   - Implement `validateCubeState(cube: CubeNetState): CubeValidationResult`.
   - Validate 54 stickers:
     - Color counts: exactly 9 stickers for each of the 6 colors (white, yellow, green, blue, orange, red).
     - Center pieces: verify 6 unique fixed centers matching standard WCA colors: U=yellow, D=white, F=green, B=blue, L=orange, R=red.
     - 12 unique valid edge pieces (check 2-color pairs, no illegal opposite colors, no duplicates).
     - 8 unique valid corner pieces (check 3-color triplets, chirality, no duplicates).
     - Edge orientation parity: sum of edge flips % 2 === 0. Report single flipped edge in Vietnamese if odd.
     - Corner orientation parity: sum of corner twists % 3 === 0. Report single twisted corner in Vietnamese if non-zero.
     - Permutation parity: sgn(EP) === sgn(CP). Report two swapped pieces error in Vietnamese if unequal.
   - Diagnostic messages: Provide clear, actionable Vietnamese error messages indicating which faces, stickers, or impossible states to correct.
2. `src/utils/cubeSolver.ts`:
   - Implement authentic Rubik's cube solver capable of solving ANY valid 54-sticker `CubeNetState` to `isCubeSolved(state) === true`.
   - For `auto-solve`: Implement a Two-Phase (Kociemba-style or IDA*) solver or robust Layer-by-Layer / CFOP solver that converts `CubeNetState` and returns a mathematically valid move sequence that transforms the cube to `SOLVED_CUBE`.
   - For `level-1` through `level-4` (LBL, 2-Look CFOP, Full CFOP, ZBLL):
     - Produce authentic stage solutions:
       - Cross on D (White Cross)
       - F2L / First Two Layers
       - OLL (Orient Last Layer)
       - PLL (Permute Last Layer)
     - Intermediate stages must physically transform the cube state into that exact stage state!
3. `src/utils/solutionStages.ts`:
   - Update `getSolutionForLevel(level, scrambleStr, cubeState)`:
     - If `cubeState` is provided, solve it directly using `src/utils/cubeSolver.ts`.
     - If `scrambleStr` is provided (e.g. built-in demo), continue to solve it correctly (all 5 demo levels must continue to pass `isCubeSolved === true`).
4. `src/components/solver/Step2CameraScan.tsx`:
   - Bind `validateCubeState` live to the 2D review net.
   - If invalid: display warning banner with localized Vietnamese diagnostics and disable "Tạo Lời Giải Chi Tiết".
   - If valid: display green badge "Khối Rubik Hợp Lệ 100%" and enable button.
5. Tests:
   - In `tests/validation.test.ts`:
     - Test that `SOLVED_CUBE` and 50+ random WCA scrambles validate as valid.
     - Test rejection of invalid states: wrong color counts, duplicate pieces, single flipped edge, single twisted corner, swapped two edges — with Vietnamese messages.
   - In `tests/solver.test.ts`:
     - Test that all 5 solver levels solve demo scrambles to `isCubeSolved === true`.
     - Test that 50+ randomly generated valid WCA scrambles solve directly from `CubeNetState` to `isCubeSolved === true`.
6. Synchronization & Verification:
   - Synchronize all changes to `D:\Projects\rubik`.
   - Run `npm test` and `npm run build` in both repositories and ensure exit code 0 and 0 chunk warnings.
