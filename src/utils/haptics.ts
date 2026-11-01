/**
 * Mobile Haptic Feedback Utility for Speedcubing & PWA
 * Provides tactile sensory feedback for timer ready states, button taps, and solve completions.
 */

class HapticManager {
  private isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && 'vibrate' in window.navigator;
  }

  /**
   * Light click/tick feedback (10ms)
   * Used for step navigation, move taping, button presses.
   */
  tick(): void {
    if (this.isSupported()) {
      try {
        window.navigator.vibrate(10);
      } catch {
        // Silently ignore if blocked by user permissions
      }
    }
  }

  /**
   * Crisp READY signal (25ms)
   * Used when timer holding reaches 300ms and turns GREEN (Stackmat ready).
   */
  ready(): void {
    if (this.isSupported()) {
      try {
        window.navigator.vibrate(25);
      } catch {
        // Silently ignore
      }
    }
  }

  /**
   * Snappy timer release / solve start (15ms)
   */
  start(): void {
    if (this.isSupported()) {
      try {
        window.navigator.vibrate(15);
      } catch {
        // Silently ignore
      }
    }
  }

  /**
   * Solve stopped / timer landed (double pulse: 20ms, pause 40ms, 25ms)
   */
  stop(): void {
    if (this.isSupported()) {
      try {
        window.navigator.vibrate([20, 40, 25]);
      } catch {
        // Silently ignore
      }
    }
  }

  /**
   * WCA Inspection warning pulse (30ms, pause 30ms, 30ms)
   * Fired at 8s and 12s inspection warnings.
   */
  warning(): void {
    if (this.isSupported()) {
      try {
        window.navigator.vibrate([30, 30, 30]);
      } catch {
        // Silently ignore
      }
    }
  }
}

export const haptic = new HapticManager();
