let sharedAudioCtx: AudioContext | null = null;
let userInteracted = false;

export function markAlarmUserGesture() {
  userInteracted = true;
}

function getAudioContext(fromUserGesture = false): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (fromUserGesture) {
    userInteracted = true;
  }
  if (!userInteracted && !sharedAudioCtx) {
    return null;
  }
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Attempt to resume/unlock the Web Audio context after a user gesture.
 * Returns true if the context is running and ready to emit sound.
 */
export async function unlockAlarmAudio(): Promise<boolean> {
  const ctx = getAudioContext(true);
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
}

/**
 * Play a crisp, urgent two-pulse alarm chime using Web Audio API.
 * Returns true if sound played, false if blocked or awaiting user gesture.
 */
export async function playAlarmChime(): Promise<boolean> {
  const ctx = getAudioContext(false);
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    if (!userInteracted) return false;
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  if (ctx.state !== "running") {
    return false;
  }

  const now = ctx.currentTime;
  const pulses = [
    { start: 0, freq: 880, duration: 0.18 },
    { start: 0.24, freq: 1046.5, duration: 0.18 },
    { start: 0.48, freq: 880, duration: 0.22 },
  ];

  for (const p of pulses) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(p.freq, now + p.start);

    gain.gain.setValueAtTime(0.0001, now + p.start);
    gain.gain.exponentialRampToValueAtTime(0.28, now + p.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.start + p.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + p.start);
    osc.stop(now + p.start + p.duration + 0.02);
  }

  return true;
}
