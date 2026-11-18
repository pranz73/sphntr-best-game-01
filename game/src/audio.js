// Asset-free sound cues. Audio starts lazily after the first user-triggered play.
export function createAudio() {
  let context;
  let master;
  let pickupCount = 0;
  const ensureContext = () => {
    try {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!context) {
        context = new AudioContextClass();
        master = context.createGain();
        master.gain.value = 0.15;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
      return context;
    } catch { return null; }
  };
  const tone = (ctx, frequency, duration, type = 'sine', endFrequency = frequency, volume = 0.35, delay = 0) => {
    try {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(1, frequency), start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain); gain.connect(master);
      osc.start(start); osc.stop(start + duration + 0.01);
    } catch { /* Audio can be unavailable or interrupted; gameplay continues. */ }
  };
  return {
    play(name, opt = {}) {
      const ctx = ensureContext();
      if (!ctx) return;
      if (name === 'pickup') {
        pickupCount++;
        tone(ctx, opt.pitch || 520 + Math.min(pickupCount, 20) * 18, 0.12, 'sine', 900, 0.22);
      } else if (name === 'hit') tone(ctx, 150, 0.24, 'sawtooth', 48, 0.42);
      else if (name === 'dash') tone(ctx, 650, 0.18, 'triangle', 180, 0.22);
      else if (name === 'out') tone(ctx, 390, 0.9, 'sine', 65, 0.3);
      else if (name === 'start') {
        tone(ctx, 380, 0.2, 'sine', 520, 0.2);
        tone(ctx, 560, 0.24, 'sine', 820, 0.2, 0.14);
      } else if (name === 'click') tone(ctx, 900, 0.035, 'sine', 680, 0.12);
    },
  };
}
