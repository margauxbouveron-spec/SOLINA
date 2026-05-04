"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Optional ambient soundscape toggle.
 * Audio is generated locally with the WebAudio API — soft pink-noise + gentle low oscillation,
 * evoking distant waves & wind. No asset shipped.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioNode[]>([]);

  useEffect(() => {
    if (!on) {
      sourcesRef.current.forEach((n) => {
        try {
          (n as OscillatorNode | AudioBufferSourceNode).stop?.();
        } catch {}
      });
      sourcesRef.current = [];
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      return;
    }

    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;

    // Pink-ish noise via short looped buffer
    const bufferSize = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.5);

    // Soft LFO for waves
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain).connect(gain.gain);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    lfo.start();
    sourcesRef.current = [noise, lfo];

    return () => {
      try { noise.stop(); lfo.stop(); } catch {}
      ctx.close().catch(() => {});
    };
  }, [on]);

  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={on ? "Couper le son ambiant" : "Activer le son ambiant"}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-ink/20 bg-cream/70 px-4 py-2 text-[10px] uppercase tracking-[0.32em] backdrop-blur-md transition hover:border-ink/50"
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full transition ${
          on ? "bg-gold animate-breathe" : "bg-ink/30"
        }`}
      />
      Son
    </button>
  );
}
