import { sound } from './audio.js';

export class SpeedcubeTimer {
  constructor(elements, onTimerStart, onTimerStop) {
    this.digitsEl = elements.digits;
    this.hintEl = elements.hint;
    this.bestEl = elements.best;
    this.ao5El = elements.ao5;
    this.movesEl = elements.moves;
    this.tpsEl = elements.tps;

    this.onTimerStart = onTimerStart || (() => {});
    this.onTimerStop = onTimerStop || (() => {});

    this.state = 'idle'; // 'idle' | 'holding' | 'ready' | 'running' | 'stopped'
    this.holdStartTime = 0;
    this.holdTimer = null;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.animFrameId = null;

    this.moveCount = 0;
    this.history = JSON.parse(localStorage.getItem('rubik_timer_history') || '[]');

    this.init();
  }

  init() {
    this.bindKeyboard();
    this.updateStatsDisplay();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Spacebar controls timer
      if (e.code === 'Space' && !e.repeat) {
        // If typing in input, ignore
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();

        if (this.state === 'running') {
          this.stop();
        } else if (this.state === 'idle' || this.state === 'stopped') {
          this.state = 'holding';
          this.digitsEl.className = 'timer-digits holding';
          this.digitsEl.textContent = '0.000';
          this.hintEl.innerHTML = 'Hold space for 0.3s...';

          this.holdTimer = setTimeout(() => {
            if (this.state === 'holding') {
              this.state = 'ready';
              this.digitsEl.className = 'timer-digits ready';
              this.hintEl.innerHTML = 'Release to start timer!';
              sound.playTimerReady();
            }
          }, 300);
        }
      } else if (this.state === 'running') {
        // Any other key stops running timer
        this.stop();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state === 'ready') {
          this.start();
        } else if (this.state === 'holding') {
          clearTimeout(this.holdTimer);
          this.state = 'idle';
          this.digitsEl.className = 'timer-digits';
          this.digitsEl.textContent = this.formatTime(this.elapsedTime);
          this.hintEl.innerHTML = 'Hold <span class="keycap">SPACE</span> to prime timer';
        }
      }
    });
  }

  start() {
    this.state = 'running';
    this.startTime = performance.now();
    this.moveCount = 0;
    this.digitsEl.className = 'timer-digits running';
    this.hintEl.innerHTML = 'Press <span class="keycap">SPACE</span> or any key to stop';

    this.onTimerStart();

    const loop = () => {
      if (this.state !== 'running') return;
      this.elapsedTime = performance.now() - this.startTime;
      this.digitsEl.textContent = this.formatTime(this.elapsedTime);
      this.updateTPS();
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this.state !== 'running') return;
    this.state = 'stopped';
    cancelAnimationFrame(this.animFrameId);

    this.elapsedTime = performance.now() - this.startTime;
    this.digitsEl.className = 'timer-digits';
    this.digitsEl.textContent = this.formatTime(this.elapsedTime);
    this.hintEl.innerHTML = 'Solved! Hold <span class="keycap">SPACE</span> for next solve';

    this.recordSolve(this.elapsedTime, this.moveCount);
    this.onTimerStop(this.elapsedTime, this.moveCount);
  }

  recordMove() {
    this.moveCount++;
    if (this.movesEl) this.movesEl.textContent = this.moveCount;
    this.updateTPS();
  }

  updateTPS() {
    if (this.elapsedTime > 0 && this.tpsEl) {
      const seconds = this.elapsedTime / 1000;
      const tps = (this.moveCount / Math.max(0.1, seconds)).toFixed(1);
      this.tpsEl.textContent = tps;
    }
  }

  recordSolve(timeMs, moves) {
    this.history.unshift({ time: timeMs, moves, date: new Date().toISOString() });
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('rubik_timer_history', JSON.stringify(this.history));
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    if (this.history.length === 0) {
      if (this.bestEl) this.bestEl.textContent = '--:--';
      if (this.ao5El) this.ao5El.textContent = '--:--';
      return;
    }

    const times = this.history.map(h => h.time);
    const best = Math.min(...times);
    if (this.bestEl) this.bestEl.textContent = this.formatTime(best);

    // Calculate Ao5 (average of 5 excluding best & worst)
    if (times.length >= 5) {
      const last5 = times.slice(0, 5).sort((a, b) => a - b);
      const middle3 = last5.slice(1, 4);
      const ao5 = middle3.reduce((a, b) => a + b, 0) / 3;
      if (this.ao5El) this.ao5El.textContent = this.formatTime(ao5);
    } else {
      if (this.ao5El) this.ao5El.textContent = '--:--';
    }
  }

  formatTime(ms) {
    if (ms <= 0) return '0.000';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor(ms % 1000);

    const pad = (n, len = 2) => String(n).padStart(len, '0');

    if (minutes > 0) {
      return `${minutes}:${pad(seconds)}.${pad(milliseconds, 3)}`;
    }
    return `${seconds}.${pad(milliseconds, 3)}`;
  }

  reset() {
    this.state = 'idle';
    this.elapsedTime = 0;
    this.moveCount = 0;
    cancelAnimationFrame(this.animFrameId);
    this.digitsEl.className = 'timer-digits';
    this.digitsEl.textContent = '0.000';
    this.hintEl.innerHTML = 'Hold <span class="keycap">SPACE</span> to prime timer';
    if (this.movesEl) this.movesEl.textContent = '0';
    if (this.tpsEl) this.tpsEl.textContent = '0.0';
  }
}
