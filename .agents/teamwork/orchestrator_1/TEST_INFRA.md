# E2E Test Infra: CubeMaster AI v2.4

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md` and user-facing specifications, independent of internal module structure.
- Methodology: Category-Partition, Boundary Value Analysis, Pairwise Combinatorial Testing, Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | applyMove mechanics (18 moves) | R4 | 5 | 5 | ✓ |
| 2 | applyScramble & invertMoves | R4 | 5 | 5 | ✓ |
| 3 | isCubeSolved evaluation | R4 | 5 | 5 | ✓ |
| 4 | 54-Sticker color counts validation | R1 | 5 | 5 | ✓ |
| 5 | Fixed center pieces validation | R1 | 5 | 5 | ✓ |
| 6 | 12 Edge pieces legality & uniqueness | R1 | 5 | 5 | ✓ |
| 7 | 8 Corner pieces legality & chirality | R1 | 5 | 5 | ✓ |
| 8 | Edge orientation parity | R1 | 5 | 5 | ✓ |
| 9 | Corner orientation parity | R1 | 5 | 5 | ✓ |
| 10 | Permutation parity | R1 | 5 | 5 | ✓ |
| 11 | Vietnamese diagnostic feedback | R1 | 5 | 5 | ✓ |
| 12 | 50+ WCA scrambles solving to 100% | R1, R4 | 5 | 5 | ✓ |
| 13 | Auto-solve (Kociemba/Two-Phase) | R1 | 5 | 5 | ✓ |
| 14 | Level-1 LBL solver stage correctness | R1 | 5 | 5 | ✓ |
| 15 | Level-2 CFOP 2-look stage correctness | R1 | 5 | 5 | ✓ |
| 16 | Level-3 CFOP full stage correctness | R1 | 5 | 5 | ✓ |
| 17 | Level-4 ZBLL stage correctness | R1 | 5 | 5 | ✓ |
| 18 | 3D coordinate/normal transformation parity | R2, R4 | 5 | 5 | ✓ |
| 19 | "Analyze Solve" data loading & routing | R2 | 5 | 5 | ✓ |
| 20 | "Practice in 3D" setup state correctness | R2 | 5 | 5 | ✓ |
| 21 | Camera scan net state to Step 3 transfer | R2 | 5 | 5 | ✓ |
| 22 | Step 3 live state tracking & true 100% SOLVED | R2 | 5 | 5 | ✓ |
| 23 | Reset to Solved Cube handling | R2 | 5 | 5 | ✓ |
| 24 | WebGL resource cleanup | R2 | 5 | 5 | ✓ |
| 25 | Production build exit code 0 & chunk limits | R3, R4 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Vitest (`npm test` / `npx vitest run`)
- Pass/Fail semantics: All tests must pass with exit code 0
- Test case directory: `tests/`
  - `tests/unit/`: Mechanics, validation, solvers, parity.
  - `tests/e2e/`: Multi-view flows, 3D synchronization, and complete application workflows.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | WCA Competition Solve Analysis | Timer solve -> Analyze Solve -> Step 3 replay -> Step through -> Verified solved | High |
| 2 | Algorithm Practice Drill | Alg library -> T-Perm 3D practice -> Execute 14 moves -> Verified 100% solved | Medium |
| 3 | Camera Scanned Cube Recovery | Arbitrary 54-sticker valid net -> Validate -> Generate solution -> Step to solved | High |
| 4 | Malformed Cube Correction Flow | Invalid net (flipped edge) -> Validator rejects with Vietnamese msg -> Fix sticker -> Solves | High |
| 5 | Multi-Stage CFOP Solve Execution | Scrambled cube -> Cross -> F2L -> OLL -> PLL -> Verified solved | High |

## Coverage Thresholds
- Tier 1: >= 5 tests per feature
- Tier 2: >= 5 tests per feature (boundary and invalid inputs)
- Tier 3: Pairwise coverage of major feature combinations
- Tier 4: >= 5 realistic end-to-end application scenarios
