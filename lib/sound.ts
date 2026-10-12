/**
 * Sunet discret de foșnet de hârtie, sintetizat cu Web Audio (fără fișiere audio).
 */
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const len = Math.floor(ctx.sampleRate * 0.9);
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    // brown-ish noise: smoother than white noise, closer to paper
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.09 * w) / 1.09;
      d[i] = last * 3.2 + w * 0.18;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playFlip(hard = false) {
  const ac = ensure();
  if (!ac || !noise) return;
  const t = ac.currentTime;

  const src = ac.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.25;

  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(hard ? 500 : 900, t);
  band.frequency.exponentialRampToValueAtTime(hard ? 1400 : 3600, t + 0.32);

  const gain = ac.createGain();
  const peak = hard ? 0.16 : 0.11;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(peak * 0.45, t + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

  src.connect(band).connect(gain).connect(ac.destination);
  src.start(t);
  src.stop(t + 0.55);

  if (hard) {
    // a soft "thump" when the board lands
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(120, t + 0.42);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.6);
    g.gain.setValueAtTime(0.0001, t + 0.42);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.44);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.66);
    o.connect(g).connect(ac.destination);
    o.start(t + 0.42);
    o.stop(t + 0.7);
  }
}
