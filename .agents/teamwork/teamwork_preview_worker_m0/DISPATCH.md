## 2026-10-20T16:22:28Z
You are Worker Milestone 0: Workspace Baseline & Build/Test Infra.
Your working directory is:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\teamwork_preview_worker_m0

MANDATORY: Read the authoritative user request at:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\ORIGINAL_REQUEST.md

Read the project scope at:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\orchestrator_1\PROJECT.md

Read the findings from Explorer 3 at:
C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\teamwork_preview_explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You exclusively own:
- `vite.config.js`
- `package.json`
- `package-lock.json`
- Workspace baseline sync between `D:\Projects\rubik` and `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code`

Tasks:
1. Workspace Baseline Synchronization:
   - Synchronize all newer/updated files from `D:\Projects\rubik` to `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code` (e.g. `DESIGN_GUIDELINES.md`, `tailwind.config.js`, `index.html`, `src/App.tsx`, `src/components/Footer.tsx`, `src/components/Header.tsx`, `src/components/history/SessionHistoryCard.tsx`, `src/components/metrics/*`, `src/components/scramble/CubeNet2D.tsx`, `src/components/timer/ZenTimerStage.tsx`, `src/styles/index.css`).
   - Run `npm install` in `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code` so that all dependencies (`@vitejs/plugin-react`, `three`, etc.) are fully installed and node_modules is healthy.
2. Build & Bundle Optimization:
   - Update `vite.config.js` to configure `build.rollupOptions.output.manualChunks` splitting `three`, `react-vendor`, `lucide`, and `index`.
   - Run `npm run build` in PowerShell and verify:
     - Exit code is 0.
     - Zero chunk-size warnings emitted (no unsplit chunks exceeding 500 kB).
3. Test Infrastructure:
   - Install `vitest` as devDependency (or configure test runner).
   - Add `"test": "vitest run"` in `package.json`.
   - Create a smoke test (e.g., `tests/smoke.test.ts`) that imports `isCubeSolved`, `applyMove` and checks basic functionality.
   - Run `npm test` and verify it passes with exit code 0.
4. Bidirectional Sync Baseline:
   - Keep `D:\Projects\rubik` and `C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code` in sync.

Output:
Write a comprehensive completion report with build and test outputs to:
`C:\Users\diamo\.gemini\antigravity\worktrees\rubik\audit_and_refactor_code\.agents\teamwork\teamwork_preview_worker_m0\handoff.md`
When complete, send a message to your parent orchestrator with your status and results.
