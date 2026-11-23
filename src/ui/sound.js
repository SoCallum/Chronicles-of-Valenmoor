/**
 * Subtle synthesized Web Audio fantasy chimes (dice roll, rune unlock, steel strike, victory).
 * Disabled cleanly if unsupported; user-toggleable from the header.
 */

let audioCtx = null;
let enabled = true;

function ensureContext() {
  if (!enabled || typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, duration = 0.14, type = "sine", gainPeak = 0.05, delay = 0) {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export const sound = {
  isEnabled: () => enabled,
  toggle() {
    enabled = !enabled;
    return enabled;
  },
  pageTurn() {
    playTone(260, 0.08, "triangle", 0.03);
    playTone(340, 0.09, "sine", 0.025, 0.04);
  },
  diceRoll() {
    playTone(380, 0.05, "triangle", 0.035, 0);
    playTone(470, 0.05, "triangle", 0.035, 0.05);
    playTone(540, 0.09, "sine", 0.04, 0.1);
  },
  runeSolve() {
    playTone(523.25, 0.16, "sine", 0.05, 0);
    playTone(659.25, 0.18, "sine", 0.05, 0.08);
    playTone(783.99, 0.28, "sine", 0.055, 0.16);
  },
  strike() {
    playTone(170, 0.11, "sawtooth", 0.04, 0);
    playTone(110, 0.12, "triangle", 0.045, 0.04);
  },
  ward() {
    playTone(330, 0.14, "triangle", 0.04, 0);
    playTone(440, 0.18, "sine", 0.04, 0.06);
  },
  victory() {
    playTone(440, 0.16, "triangle", 0.05, 0);
    playTone(554.37, 0.16, "triangle", 0.05, 0.1);
    playTone(659.25, 0.2, "triangle", 0.05, 0.2);
    playTone(880, 0.35, "sine", 0.06, 0.3);
  },
  warning() {
    playTone(220, 0.16, "sawtooth", 0.035, 0);
    playTone(165, 0.22, "sawtooth", 0.035, 0.12);
  }
};
