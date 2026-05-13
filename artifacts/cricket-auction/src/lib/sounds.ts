/**
 * Procedural sound effects via the Web Audio API.
 * No audio files required — all sounds are synthesized in the browser.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Resume if suspended (browsers require a user gesture first)
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function master(ac: AudioContext): GainNode {
  const g = ac.createGain();
  g.gain.value = 0.6;
  g.connect(ac.destination);
  return g;
}

/**
 * Crisp ascending "ding" played on every new bid.
 * Two-tone chime that pings up to signal competitive activity.
 */
export function playBidSound(): void {
  try {
    const ac = getCtx();
    const out = master(ac);
    const now = ac.currentTime;

    const freqs = [880, 1320];
    freqs.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.5, now + i * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(out);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.4);
    });
  } catch {
    // Audio blocked or not supported
  }
}

/**
 * Dramatic three-phase hammer fall:
 * 1. Rising anticipation tone
 * 2. Wooden thud impact (noise burst)
 * 3. Low resonant boom
 *
 * Plays when a player is marked sold.
 */
export function playHammerSound(): void {
  try {
    const ac = getCtx();
    const out = master(ac);
    const now = ac.currentTime;

    // Phase 1 — rising anticipation whistle
    const whistle = ac.createOscillator();
    const whistleGain = ac.createGain();
    whistle.type = "sine";
    whistle.frequency.setValueAtTime(400, now);
    whistle.frequency.exponentialRampToValueAtTime(900, now + 0.15);
    whistleGain.gain.setValueAtTime(0.3, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    whistle.connect(whistleGain);
    whistleGain.connect(out);
    whistle.start(now);
    whistle.stop(now + 0.25);

    // Phase 2 — wood thud (filtered noise burst)
    const bufferSize = ac.sampleRate * 0.08;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noise = ac.createBufferSource();
    noise.buffer = buffer;

    const lowpass = ac.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 500;

    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0, now + 0.18);
    noiseGain.gain.linearRampToValueAtTime(1.2, now + 0.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(out);
    noise.start(now + 0.18);

    // Phase 3 — low resonant boom
    const boom = ac.createOscillator();
    const boomGain = ac.createGain();
    boom.type = "sine";
    boom.frequency.setValueAtTime(120, now + 0.2);
    boom.frequency.exponentialRampToValueAtTime(55, now + 0.6);
    boomGain.gain.setValueAtTime(0, now + 0.2);
    boomGain.gain.linearRampToValueAtTime(0.8, now + 0.22);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    boom.connect(boomGain);
    boomGain.connect(out);
    boom.start(now + 0.2);
    boom.stop(now + 1.0);

    // Phase 4 — celebratory high chime pair
    [1047, 1568].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + 0.5 + i * 0.12);
      g.gain.linearRampToValueAtTime(0.4, now + 0.52 + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.1 + i * 0.12);
      osc.connect(g);
      g.connect(out);
      osc.start(now + 0.5 + i * 0.12);
      osc.stop(now + 1.2 + i * 0.12);
    });
  } catch {
    // Audio blocked or not supported
  }
}

/**
 * Low descending "buzzer" played when a player is marked unsold.
 */
export function playUnsoldSound(): void {
  try {
    const ac = getCtx();
    const out = master(ac);
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.55);
  } catch {
    // Audio blocked or not supported
  }
}

/**
 * Three rapid descending ticks — signals the timer has expired.
 */
export function playTimerExpiredSound(): void {
  try {
    const ac = getCtx();
    const out = master(ac);
    const now = ac.currentTime;

    [0, 0.12, 0.24].forEach((delay, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "square";
      osc.frequency.value = 440 - i * 60;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.35, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  } catch {
    // Audio blocked or not supported
  }
}

/**
 * Subtle soft tick for the last 5 seconds of the countdown.
 */
export function playTickSound(): void {
  try {
    const ac = getCtx();
    const out = master(ac);
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // Audio blocked or not supported
  }
}
