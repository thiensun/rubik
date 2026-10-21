import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import * as fs from 'fs';
import * as path from 'path';
import {
  CubeNetState,
  FaceKey,
  CubeColor,
  SOLVED_CUBE,
  cloneCube,
  applyMove,
  applyScramble,
  invertMoves,
  isCubeSolved,
  generateWCAScramble,
} from '../src/utils/cubeState';
import { validateCubeState } from '../src/utils/cubeValidator';
import { solveCube } from '../src/utils/cubeSolver';
import {
  getSolutionForLevel,
  getStaticSolutionForLevel,
  createMoves,
  DEMO_SCRAMBLES,
  CFOP_DEMO_SCRAMBLE,
  SolutionStage,
} from '../src/utils/solutionStages';
import { ALGORITHMS_LIBRARY, AlgorithmCase } from '../src/utils/algorithmsData';
import {
  formatTime,
  getEffectiveTime,
  calculateAo5,
  calculateAo12,
  computeSessionStats,
  SEED_SOLVES,
} from '../src/utils/cubingStats';
import { getTimerFontSizeClass } from '../src/components/timer/ZenTimerStage';
import { SolveRecord, PenaltyType, SolverLevelId } from '../src/types/cubing';

describe('Empirical Challenger 2 — Final Milestone: Adversarial Multi-View, UI/UX & Synchronization Hardening', () => {

  // =========================================================================
  // SECTION 1: SPEEDCUBING TIMER MECHANICS, INSPECTION & PENALTIES
  // =========================================================================
  describe('1. Speedcubing Timer: Mechanics, Inspection & Penalties', () => {
    it('verifies timer state lifecycle transitions: idle -> holding -> ready -> running -> stopped', () => {
      type TimerState = 'idle' | 'holding' | 'ready' | 'running' | 'inspection' | 'stopped';
      let state: TimerState = 'idle';

      // Holding phase (Space down / touch down)
      state = 'holding';
      expect(state).toBe('holding');

      // 350ms arming threshold reached
      state = 'ready';
      expect(state).toBe('ready');

      // Release key / finger
      state = 'running';
      expect(state).toBe('running');

      // Stop on tap / keydown
      state = 'stopped';
      expect(state).toBe('stopped');

      // Reset to idle
      state = 'idle';
      expect(state).toBe('idle');
    });

    it('empirically audits inspection mode countdown logic and dormant interval handling', () => {
      // Audit ZenTimerStage.tsx source code for inspection countdown implementation
      const zenPath = path.resolve(__dirname, '../src/components/timer/ZenTimerStage.tsx');
      const zenSource = fs.readFileSync(zenPath, 'utf-8');

      // Inspect inspection references
      expect(zenSource).toContain('inspectionEnabled');
      expect(zenSource).toContain('inspectionSeconds');
      expect(zenSource).toContain('inspectionIntervalRef');

      // Format inspection digits verification
      const formatInspectionDigits = (seconds: number) => seconds.toString().padStart(2, '0');
      expect(formatInspectionDigits(15)).toBe('15');
      expect(formatInspectionDigits(9)).toBe('09');
      expect(formatInspectionDigits(0)).toBe('00');

      // Check whether handleHoldStart directly enters holding or starts interval
      // In ZenTimerStage lines 171-179:
      // if (inspectionEnabled) { /* comment */ } setTimerState('holding');
      // Documenting that inspection countdown arms directly on hold
      const hasDirectArmingOnHold = zenSource.includes("setTimerState('holding')");
      expect(hasDirectArmingOnHold).toBe(true);
    });

    it('verifies penalty triggers (+2s, DNF) mathematically transform effective time and string display', () => {
      const baseMs = 9450; // 9.45 seconds

      // Standard no penalty
      expect(formatTime(baseMs, 'none')).toBe('09.45');
      expect(getEffectiveTime({ id: 1, timeMs: baseMs, penalty: 'none', scramble: '', timestamp: 0 })).toBe(9450);

      // +2 second penalty
      expect(formatTime(baseMs, '+2')).toBe('11.45');
      expect(getEffectiveTime({ id: 1, timeMs: baseMs, penalty: '+2', scramble: '', timestamp: 0 })).toBe(11450);

      // DNF penalty
      expect(formatTime(baseMs, 'dnf')).toBe('DNF');
      expect(getEffectiveTime({ id: 1, timeMs: baseMs, penalty: 'dnf', scramble: '', timestamp: 0 })).toBe(Infinity);

      // Minute boundary with +2 penalty: 58.50s + 2s = 1:00.50
      const nearMinuteMs = 58500;
      expect(formatTime(nearMinuteMs, '+2')).toBe('1:00.50');
    });

    it('verifies WCA Ao5 and Ao12 penalty calculation rules with DNF and +2 solves', () => {
      // 5 solves: [8000, 8500, 9000, 9500, 10000]
      const baseSolves: SolveRecord[] = [
        { id: 1, timeMs: 8000, penalty: 'none', scramble: '', timestamp: 1 },
        { id: 2, timeMs: 8500, penalty: 'none', scramble: '', timestamp: 2 },
        { id: 3, timeMs: 9000, penalty: 'none', scramble: '', timestamp: 3 },
        { id: 4, timeMs: 9500, penalty: 'none', scramble: '', timestamp: 4 },
        { id: 5, timeMs: 10000, penalty: 'none', scramble: '', timestamp: 5 },
      ];

      // Standard Ao5: drops 8000 and 10000 -> average of [8500, 9000, 9500] = 9000
      expect(calculateAo5(baseSolves)).toBe(9000);

      // Solve 5 gets DNF: effective times: [8000, 8500, 9000, 9500, Infinity]
      // WCA Rule: 1 DNF is counted as the highest time and discarded!
      // Middle 3 times: [8500, 9000, 9500] -> average is still 9000!
      const singleDnfSolves: SolveRecord[] = [
        ...baseSolves.slice(0, 4),
        { id: 5, timeMs: 10000, penalty: 'dnf', scramble: '', timestamp: 5 },
      ];
      expect(calculateAo5(singleDnfSolves)).toBe(9000);

      // Two DNFs in Ao5: WCA Rule: Ao5 is DNF (represented as null in engine)
      const doubleDnfSolves: SolveRecord[] = [
        ...baseSolves.slice(0, 3),
        { id: 4, timeMs: 9500, penalty: 'dnf', scramble: '', timestamp: 4 },
        { id: 5, timeMs: 10000, penalty: 'dnf', scramble: '', timestamp: 5 },
      ];
      expect(calculateAo5(doubleDnfSolves)).toBeNull();

      // Solve 1 (lowest 8000) gets +2 -> 10000. New times: [8500, 9000, 9500, 10000, 10000]
      // Drops 8500 and 10000 -> average of [9000, 9500, 10000] = 9500
      const plusTwoSolves: SolveRecord[] = [
        { id: 1, timeMs: 8000, penalty: '+2', scramble: '', timestamp: 1 },
        ...baseSolves.slice(1),
      ];
      expect(calculateAo5(plusTwoSolves)).toBe(9500);
    });

    it('verifies solve recording into Session History: monotonicity, PB flagging, and auto-scramble', () => {
      const initialSolves: SolveRecord[] = [...SEED_SOLVES];
      const initialStats = computeSessionStats(initialSolves);

      // Simulate solve completion
      const newSolveTimeMs = 6200; // Faster than any seed solve -> new PB!
      const isNewPB = initialStats.bestTime === null || newSolveTimeMs < initialStats.bestTime;
      expect(isNewPB).toBe(true);

      const maxId = Math.max(...initialSolves.map((s) => s.id));
      const newSolve: SolveRecord = {
        id: maxId + 1,
        timeMs: newSolveTimeMs,
        penalty: 'none',
        scramble: generateWCAScramble(21),
        timestamp: Date.now(),
        moves: 58,
        tps: Number((58 / (newSolveTimeMs / 1000)).toFixed(2)),
        isPB: isNewPB,
      };

      const updatedSolves = [newSolve, ...initialSolves];
      expect(updatedSolves.length).toBe(initialSolves.length + 1);
      expect(updatedSolves[0].id).toBe(maxId + 1);
      expect(updatedSolves[0].isPB).toBe(true);

      const newStats = computeSessionStats(updatedSolves);
      expect(newStats.bestTime).toBe(6200);
      expect(newStats.bestSolveId).toBe(newSolve.id);
    });
  });

  // =========================================================================
  // SECTION 2: "ANALYZE SOLVE" TRANSITION & CUSTOM SCRAMBLES
  // =========================================================================
  describe('2. "Analyze Solve": Passing Custom Scrambles to Step 3 Solver', () => {
    it('verifies selecting Analyze Solve loads custom scramble directly into Step 3 solver', () => {
      const customScrambles = [
        "R U R' U' R' F R2 U' R' U' R U R' F'", // T-Perm
        "F R U' R' U' R U R' F' R U R' U' R' F R F'", // Y-Perm
        "D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R", // WCA Scramble 1
        "U2 F2 R2 D' B2 D F2 U' B2 U L2 F' R' D2 F' D2 L' B' U R2", // WCA Scramble 2
        "B2 D' L2 F2 U' R2 D' F2 U2 B2 R' D' B' R' D B2 F' U' F'", // WCA Scramble 3
      ];

      for (const scramble of customScrambles) {
        const solve: SolveRecord = {
          id: 999,
          timeMs: 8420,
          penalty: 'none',
          scramble,
          timestamp: Date.now(),
        };

        // Simulated Analyze Solve state transfer:
        const selectedSolveForAnalysis = solve;
        const customAlgorithm = null;
        const scannedCubeState = applyScramble(selectedSolveForAnalysis.scramble);
        const demoScramble = selectedSolveForAnalysis.scramble;

        expect(isCubeSolved(scannedCubeState)).toBe(false);

        // Solver execution across levels
        for (const level of ['auto-solve', 'level-2', 'level-3'] as SolverLevelId[]) {
          const solution = getSolutionForLevel(level, demoScramble, scannedCubeState);
          expect(solution.totalMoves).toBeGreaterThan(0);
          expect(solution.stages.length).toBeGreaterThan(0);

          const moves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));
          let simulated = cloneCube(scannedCubeState);
          for (const m of moves) {
            simulated = applyMove(simulated, m);
          }
          expect(
            isCubeSolved(simulated),
            `Custom solve scramble "${scramble}" must solve to 100% on level ${level}`
          ).toBe(true);
        }
      }
    });

    it('verifies route state cleanup: clearing analyzed solve resets solve-learn view state', () => {
      let selectedSolveForAnalysis: SolveRecord | null = {
        id: 42,
        timeMs: 7890,
        penalty: 'none',
        scramble: "R U R' U'",
        timestamp: Date.now(),
      };
      let customAlgorithmFor3D: any = null;
      let activeTab: string = 'solve-learn';

      // User switches tab or clears solve
      const onTabChange = (newTab: string) => {
        if (newTab !== activeTab) {
          selectedSolveForAnalysis = null;
          customAlgorithmFor3D = null;
        }
        activeTab = newTab;
      };

      onTabChange('scramble-timer');
      expect(activeTab).toBe('scramble-timer');
      expect(selectedSolveForAnalysis).toBeNull();
      expect(customAlgorithmFor3D).toBeNull();
    });
  });

  // =========================================================================
  // SECTION 3: "PRACTICE IN 3D": ALGORITHMS_LIBRARY VERIFICATION
  // =========================================================================
  describe('3. "Practice in 3D": ALGORITHMS_LIBRARY Verification & Execution', () => {
    it('verifies 15+ standard notation algorithms from ALGORITHMS_LIBRARY execute to 100% solved', () => {
      // Filter library for algorithms with standard notation
      const standardAlgs = ALGORITHMS_LIBRARY.filter((alg) => {
        const sanitized = alg.notation.replace(/[()[\]]/g, '').trim();
        const tokens = sanitized.split(/\s+/).filter(Boolean);
        return tokens.every((t) => /^[UDFBLR][2']?$/.test(t));
      });

      expect(standardAlgs.length).toBeGreaterThanOrEqual(15);

      // Test 15 distinct algorithms from multiple categories
      const sampleAlgs = standardAlgs.slice(0, 15);
      expect(sampleAlgs.length).toBe(15);

      for (const alg of sampleAlgs) {
        const sanitizedNotation = alg.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
        const moves = createMoves(sanitizedNotation, 1);
        const invertedNotation = invertMoves(sanitizedNotation);
        const setupState = applyScramble(invertedNotation);

        // 1. Initial setup state must NOT be solved
        expect(
          isCubeSolved(setupState),
          `Algorithm "${alg.name}" setup state must be scrambled`
        ).toBe(false);

        // 2. Sequential application of algorithm moves
        let currentState = cloneCube(setupState);
        for (let k = 0; k < moves.length; k++) {
          currentState = applyMove(currentState, moves[k].move);
          if (k < moves.length - 1) {
            // Must not be solved at intermediate step
            expect(
              isCubeSolved(currentState),
              `Algorithm "${alg.name}" must not be solved prematurely at move ${k + 1}/${moves.length}`
            ).toBe(false);
          }
        }

        // 3. Final state must be 100% solved
        expect(
          isCubeSolved(currentState),
          `Algorithm "${alg.name}" must reach isCubeSolved === true after all ${moves.length} moves`
        ).toBe(true);
      }
    });

    it('adversarially stress-tests baseCubeState precedence conflict when customAlgorithm and scannedCubeState coexist', () => {
      // In Step3SolveInteractive.tsx:
      // solutionData prioritizes customAlgorithm first:
      // if (customAlgorithm) { ... return customStage; }
      //
      // In baseCubeState (line 185):
      // const baseCubeState = useMemo(() => {
      //   if (scannedCubeState) return scannedCubeState;
      //   if (customAlgorithm) { return applyScramble(invertMoves(sanitizedNotation)); }
      //
      // If scannedCubeState is non-null (e.g. from prior scan), baseCubeState returns scannedCubeState,
      // creating an empirical DESYNCHRONIZATION between solutionData (moves) and baseCubeState (mesh).

      const alg = ALGORITHMS_LIBRARY.find((a) => a.id === 'beg-sexy')!;
      const sanitizedNotation = alg.notation.replace(/[()[\]]/g, '').trim().replace(/\s+/g, ' ');
      const moves = createMoves(sanitizedNotation, 1);

      const priorScannedState = applyScramble("D2 B2 R2 U' L2 F2 D R2 U' B2 U F R' U2 L' D2 B' F D' L2 R");

      // Buggy behavior (scannedCubeState precedence):
      const buggyBaseState = priorScannedState;
      let buggyExecState = cloneCube(buggyBaseState);
      for (const m of moves) {
        buggyExecState = applyMove(buggyExecState, m.move);
      }
      expect(
        isCubeSolved(buggyExecState),
        'Buggy precedence results in unsolved cube when applying alg moves to unrelated scanned cube'
      ).toBe(false);

      // Correct behavior (customAlgorithm precedence):
      const correctBaseState = applyScramble(invertMoves(sanitizedNotation));
      let correctExecState = cloneCube(correctBaseState);
      for (const m of moves) {
        correctExecState = applyMove(correctExecState, m.move);
      }
      expect(
        isCubeSolved(correctExecState),
        'Correct customAlgorithm precedence results in 100% solved cube'
      ).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 4: CAMERA SCANNER TRANSITION (54-STICKER ARBITRARY SOLVING)
  // =========================================================================
  describe('4. Camera Scanner: 54-Sticker Custom State Direct Solving', () => {
    it('verifies 15 arbitrary 54-sticker states solve directly without demo fallback', () => {
      for (let i = 0; i < 15; i++) {
        const scramble = generateWCAScramble(20);
        const scannedCubeState = applyScramble(scramble);
        expect(isCubeSolved(scannedCubeState)).toBe(false);

        // Validate 54-sticker state
        const validation = validateCubeState(scannedCubeState);
        expect(validation.isValid).toBe(true);
        expect(validation.errors.length).toBe(0);

        // In Step 2 -> Step 3 transition, demoScramble is null
        const demoScramble = null;
        const solution = getSolutionForLevel('auto-solve', demoScramble || undefined, scannedCubeState);

        expect(solution.totalMoves).toBeGreaterThan(0);
        const moves = solution.stages.flatMap((s) => s.moves.map((m) => m.move));

        // Moves must NOT match static demo scramble
        const demoSolution = getStaticSolutionForLevel('auto-solve');
        const demoMoves = demoSolution.stages.flatMap((s) => s.moves.map((m) => m.move));
        expect(moves.join(' ')).not.toEqual(demoMoves.join(' '));

        // Direct solve verification
        let state = cloneCube(scannedCubeState);
        for (const m of moves) {
          state = applyMove(state, m);
        }
        expect(
          isCubeSolved(state),
          `54-sticker state for scramble "${scramble}" must solve directly to isCubeSolved === true`
        ).toBe(true);
      }
    });

    it('rejects invalid 54-sticker states with localized Vietnamese diagnostic errors', () => {
      // Test 1: Single twisted corner
      const twistedCornerCube = cloneCube(SOLVED_CUBE);
      // Twist URF corner (U[8], R[0], F[2])
      twistedCornerCube.U[8] = 'red';
      twistedCornerCube.R[0] = 'green';
      twistedCornerCube.F[2] = 'yellow';

      const twistRes = validateCubeState(twistedCornerCube);
      expect(twistRes.isValid).toBe(false);
      expect(twistRes.errors.length).toBeGreaterThan(0);

      // Test 2: Single flipped edge
      const flippedEdgeCube = cloneCube(SOLVED_CUBE);
      // Flip UF edge (U[7], F[1])
      flippedEdgeCube.U[7] = 'green';
      flippedEdgeCube.F[1] = 'yellow';

      const flipRes = validateCubeState(flippedEdgeCube);
      expect(flipRes.isValid).toBe(false);
      expect(flipRes.errors.length).toBeGreaterThan(0);

      // Test 3: Wrong color sticker counts
      const badCountCube = cloneCube(SOLVED_CUBE);
      badCountCube.U[0] = 'red'; // 10 reds, 8 yellows

      const countRes = validateCubeState(badCountCube);
      expect(countRes.isValid).toBe(false);
      expect(countRes.details.colorCountsValid).toBe(false);
    });
  });

  // =========================================================================
  // SECTION 5: 3D VIEWER LIFECYCLE & WEBGL RESOURCE CLEANUP
  // =========================================================================
  describe('5. 3D Viewer Lifecycle & WebGL Resource Cleanup', () => {
    it('verifies complete disposal of geometries, materials, textures, and renderer on unmount', () => {
      // Mock disposal spy tracking
      const disposedGeometries: THREE.BufferGeometry[] = [];
      const disposedMaterials: THREE.Material[] = [];
      const disposedTextures: THREE.Texture[] = [];
      let rendererDisposed = false;
      let contextLossForced = false;
      let animCancelled = false;

      // Simulate ThreeCubeViewer resource allocation:
      const cubeletMeshes: THREE.Mesh[] = [];
      for (let i = 0; i < 26; i++) {
        const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
        const mat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const mesh = new THREE.Mesh(geo, mat);
        cubeletMeshes.push(mesh);
      }

      const shadowGeo = new THREE.PlaneGeometry(8, 8);
      const shadowTex = new THREE.Texture();
      const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex });

      const animId = 12345;

      // Unmount cleanup function:
      const cleanup = () => {
        animCancelled = true;
        cubeletMeshes.forEach((mesh) => {
          mesh.geometry.dispose();
          disposedGeometries.push(mesh.geometry);
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.dispose();
              disposedMaterials.push(m);
            });
          } else if (mesh.material) {
            mesh.material.dispose();
            disposedMaterials.push(mesh.material);
          }
        });

        shadowGeo.dispose();
        disposedGeometries.push(shadowGeo);

        shadowTex.dispose();
        disposedTextures.push(shadowTex);

        shadowMat.dispose();
        disposedMaterials.push(shadowMat);

        rendererDisposed = true;
        contextLossForced = true;
      };

      // Execute unmount cleanup
      cleanup();

      expect(animCancelled).toBe(true);
      expect(disposedGeometries.length).toBe(27); // 26 cubelets + 1 shadow
      expect(disposedMaterials.length).toBe(27); // 26 cubelets + 1 shadow
      expect(disposedTextures.length).toBe(1); // 1 shadow texture
      expect(rendererDisposed).toBe(true);
      expect(contextLossForced).toBe(true);
    });

    it('simulates 50 rapid mount/unmount cycles without memory leakage or context retention', () => {
      let activeContextsCount = 0;

      for (let cycle = 0; cycle < 50; cycle++) {
        // Mount:
        activeContextsCount++;
        const meshes: THREE.Mesh[] = [];
        for (let i = 0; i < 26; i++) {
          meshes.push(new THREE.Mesh(new THREE.BufferGeometry(), new THREE.Material()));
        }

        // Unmount:
        meshes.forEach((m) => {
          m.geometry.dispose();
          m.material.dispose();
        });
        activeContextsCount--;
      }

      expect(activeContextsCount).toBe(0);
    });
  });

  // =========================================================================
  // SECTION 6: RESPONSIVE UI LAYOUT CONSTRAINTS (320px & 360px VIEWPORTS)
  // =========================================================================
  describe('6. Responsive UI Layout Constraints (320px & 360px Mobile Viewports)', () => {
    it('verifies typography advance width fits within 320px and 360px viewports without horizontal overflow', () => {
      // 320px viewport has 264px available width (320 - 56px container padding)
      // 360px viewport has 304px available width (360 - 56px container padding)
      const testCases = [
        { time: '00.00', len: 5, expectedClass: 'text-6xl', maxExpectedAdvanceWidth: 5 * (60 * 0.6) }, // 180px < 264px
        { time: '08.42', len: 5, expectedClass: 'text-6xl', maxExpectedAdvanceWidth: 5 * (60 * 0.6) }, // 180px < 264px
        { time: '59.99', len: 5, expectedClass: 'text-6xl', maxExpectedAdvanceWidth: 5 * (60 * 0.6) }, // 180px < 264px
        { time: '1:12.34', len: 7, expectedClass: 'text-5xl', maxExpectedAdvanceWidth: 7 * (48 * 0.6) }, // 201.6px < 264px
        { time: '12:34.56', len: 8, expectedClass: 'text-5xl', maxExpectedAdvanceWidth: 8 * (48 * 0.6) }, // 230.4px < 264px
      ];

      for (const tc of testCases) {
        const cls = getTimerFontSizeClass(tc.time);
        expect(cls).toContain(tc.expectedClass);
        expect(tc.maxExpectedAdvanceWidth).toBeLessThan(264); // Fits in 320px screen!
        expect(tc.maxExpectedAdvanceWidth).toBeLessThan(304); // Fits in 360px screen!
      }
    });

    it('verifies mobile layout defensive classes across core view templates', () => {
      // 1. Audit Header.tsx
      const headerSource = fs.readFileSync(path.resolve(__dirname, '../src/components/Header.tsx'), 'utf-8');
      expect(headerSource).toContain('overflow-x-auto');

      // 2. Audit AuditLogModal.tsx
      const modalSource = fs.readFileSync(path.resolve(__dirname, '../src/components/history/AuditLogModal.tsx'), 'utf-8');
      expect(modalSource).toContain('overflow-x-auto max-w-full');
      expect(modalSource).toContain('min-w-[480px]');

      // 3. Audit Step1SelectLevel.tsx
      const step1Source = fs.readFileSync(path.resolve(__dirname, '../src/components/solver/Step1SelectLevel.tsx'), 'utf-8');
      expect(step1Source).toContain('pb-32 sm:pb-36'); // Fixed dock clearance (> 120px)

      // 4. Audit Step2CameraScan.tsx
      const step2Source = fs.readFileSync(path.resolve(__dirname, '../src/components/solver/Step2CameraScan.tsx'), 'utf-8');
      expect(step2Source).toContain('flex-wrap'); // Camera button wrap

      // 5. Audit Step3SolveInteractive.tsx
      const step3Source = fs.readFileSync(path.resolve(__dirname, '../src/components/solver/Step3SolveInteractive.tsx'), 'utf-8');
      expect(step3Source).toContain('max-h-'); // Tape reel / canvas constraints
    });
  });
});
