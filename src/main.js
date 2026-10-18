import confetti from 'canvas-confetti';
import { RubikCube3D } from './core/rubikCube.js';
import { SpeedcubeTimer } from './core/timer.js';
import { RubikSolver } from './core/solver.js';
import { sound } from './core/audio.js';

// DOM References
const container = document.getElementById('canvas-container');
const scrambleTextEl = document.getElementById('scramble-text');
const btnScramble = document.getElementById('btn-scramble');
const btnSolve = document.getElementById('btn-solve');
const btnReset = document.getElementById('btn-reset');
const btnCopyScramble = document.getElementById('btn-copy-scramble');
const btnSound = document.getElementById('btn-sound');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnShortcuts = document.getElementById('btn-shortcuts');
const btnCloseShortcuts = document.getElementById('btn-close-shortcuts');
const shortcutsModal = document.getElementById('shortcuts-modal');
const btnSolutionToggle = document.getElementById('btn-solution-toggle');
const btnCloseSolution = document.getElementById('btn-close-solution');
const solutionPanel = document.getElementById('solution-panel');
const solutionStepsList = document.getElementById('solution-steps-list');
const stateBadge = document.getElementById('cube-state-badge');
const toastContainer = document.getElementById('toast-container');

// Notation quick pad buttons
const notationButtons = document.querySelectorAll('.notation-btn');

// Toast feedback helper
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// 1. Initialize Speedcubing Timer
const timer = new SpeedcubeTimer(
  {
    digits: document.getElementById('timer-digits'),
    hint: document.getElementById('timer-hint'),
    best: document.getElementById('stat-best'),
    ao5: document.getElementById('stat-ao5'),
    moves: document.getElementById('stat-moves'),
    tps: document.getElementById('stat-tps')
  },
  () => {
    // Timer started
    stateBadge.textContent = 'SOLVING';
    stateBadge.style.color = '#00f0ff';
    stateBadge.style.borderColor = 'rgba(0, 240, 255, 0.4)';
    stateBadge.style.background = 'rgba(0, 240, 255, 0.15)';
  },
  (elapsedTime, moveCount) => {
    // Timer stopped
    showToast(`Time: ${timer.formatTime(elapsedTime)} (${moveCount} moves)`);
  }
);

// 2. Initialize 3D Rubik's Cube
let currentScrambleMoves = [];

const rubik = new RubikCube3D(
  container,
  (notation, totalMoves) => {
    // Move callback
    timer.recordMove();
    stateBadge.textContent = 'IN PROGRESS';
    stateBadge.style.color = '#f97316';
    stateBadge.style.borderColor = 'rgba(249, 115, 22, 0.4)';
    stateBadge.style.background = 'rgba(249, 115, 22, 0.15)';
    updateSolutionPanel();
  },
  () => {
    // Solved callback!
    stateBadge.textContent = 'SOLVED';
    stateBadge.style.color = '#10b981';
    stateBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    stateBadge.style.background = 'rgba(16, 185, 129, 0.15)';

    sound.playSolved();

    // Trigger timer stop if running
    if (timer.state === 'running') {
      timer.stop();
    }

    // Spectacular celebration confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    showToast('🎉 Rubik Solved Successfully!');
  }
);

// 3. Initialize Solver Helper
const solver = new RubikSolver(rubik);

function updateSolutionPanel() {
  const inverse = solver.getInverseSolution(rubik.moveHistory);
  const steps = solver.generateCFOPSteps(inverse);

  solutionStepsList.innerHTML = '';
  steps.forEach((step, idx) => {
    const card = document.createElement('div');
    card.className = 'step-card';
    card.innerHTML = `
      <div class="step-title">${step.title}</div>
      <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:6px;">${step.description}</div>
      <div class="step-moves">${step.moves.length > 0 ? step.moves.join(' ') : 'Completed'}</div>
    `;
    solutionStepsList.appendChild(card);
  });
}

// Scramble Handler
async function handleScramble() {
  btnScramble.disabled = true;
  timer.reset();
  stateBadge.textContent = 'SCRAMBLED';
  stateBadge.style.color = '#eab308';
  stateBadge.style.borderColor = 'rgba(234, 179, 8, 0.4)';
  stateBadge.style.background = 'rgba(234, 179, 8, 0.15)';

  const formula = await rubik.scramble(22);
  scrambleTextEl.textContent = formula;
  btnScramble.disabled = false;
  updateSolutionPanel();
  showToast('Cube scrambled! Hold SPACE to start timer');
}

// Auto Solve Handler
async function handleAutoSolve() {
  const inverseMoves = solver.getInverseSolution(rubik.moveHistory);
  if (inverseMoves.length === 0) {
    showToast('Cube is already in solved state');
    return;
  }

  btnSolve.disabled = true;
  showToast(`Auto solving ${inverseMoves.length} moves...`);

  for (const move of inverseMoves) {
    await rubik.applyMove(move, 120, false);
  }

  rubik.moveHistory = [];
  btnSolve.disabled = false;
  updateSolutionPanel();

  stateBadge.textContent = 'SOLVED';
  stateBadge.style.color = '#10b981';
  stateBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  stateBadge.style.background = 'rgba(16, 185, 129, 0.15)';
  sound.playSolved();
  confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  showToast('✨ Cube solved automatically!');
}

// Reset Handler
function handleReset() {
  rubik.reset();
  timer.reset();
  scrambleTextEl.textContent = 'Click "Scramble" to generate competition sequence';
  stateBadge.textContent = 'SOLVED';
  stateBadge.style.color = '#10b981';
  stateBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  stateBadge.style.background = 'rgba(16, 185, 129, 0.15)';
  updateSolutionPanel();
  showToast('Cube reset to solved state');
}

// Wire Event Listeners
btnScramble.addEventListener('click', handleScramble);
btnSolve.addEventListener('click', handleAutoSolve);
btnReset.addEventListener('click', handleReset);

btnCopyScramble.addEventListener('click', () => {
  const formula = scrambleTextEl.textContent;
  if (formula && !formula.includes('Click "Scramble"')) {
    navigator.clipboard.writeText(formula);
    showToast('Scramble copied to clipboard!');
  } else {
    showToast('Please scramble first to copy formula');
  }
});

// Sound Toggle
btnSound.addEventListener('click', () => {
  const isEnabled = sound.toggle();
  btnSound.classList.toggle('active', isEnabled);
  showToast(isEnabled ? 'Sound Effects Enabled' : 'Sound Effects Muted');
});

// Fullscreen Toggle
btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Shortcuts Modal
btnShortcuts.addEventListener('click', () => {
  shortcutsModal.classList.add('open');
});
btnCloseShortcuts.addEventListener('click', () => {
  shortcutsModal.classList.remove('open');
});
shortcutsModal.addEventListener('click', (e) => {
  if (e.target === shortcutsModal) shortcutsModal.classList.remove('open');
});

// Solution Steps Panel
btnSolutionToggle.addEventListener('click', () => {
  solutionPanel.classList.toggle('open');
  if (solutionPanel.classList.contains('open')) {
    updateSolutionPanel();
  }
});
btnCloseSolution.addEventListener('click', () => {
  solutionPanel.classList.remove('open');
});

// Quick Notation Pad Click
notationButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const move = btn.getAttribute('data-move');
    if (move) {
      rubik.applyMove(move);
    }
  });
});

// Keyboard Controls for Face Rotations
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key.toUpperCase();
  const shift = e.shiftKey;

  // Faces: U, D, L, R, F, B
  if (['U', 'D', 'L', 'R', 'F', 'B'].includes(key)) {
    const notation = shift ? `${key}'` : key;
    rubik.applyMove(notation);
  } else if (key === 'S' && !e.ctrlKey && !e.metaKey) {
    handleScramble();
  } else if (key === 'M') {
    sound.toggle();
  } else if (key === '?') {
    shortcutsModal.classList.toggle('open');
  }
});

// Initial population of solution panel
updateSolutionPanel();
