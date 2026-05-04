"use client";

import { create } from "zustand";

type Phase = "intro" | "hero" | "collection" | "product" | "checkout";

type SunState = {
  /** Pointer position normalized to viewport [-1, 1] */
  pointer: { x: number; y: number };
  /** Scroll progress 0 → 1 across the active page */
  scroll: number;
  /** Current narrative phase — controls light temperature */
  phase: Phase;
  /** Has the cinematic intro completed (sun is "live") */
  ready: boolean;
  /** Visual scale of the sun in scene units */
  scale: number;
  /** Light intensity multiplier */
  intensity: number;

  setPointer: (x: number, y: number) => void;
  setScroll: (s: number) => void;
  setPhase: (p: Phase) => void;
  setReady: (r: boolean) => void;
  setScale: (s: number) => void;
  setIntensity: (i: number) => void;
};

export const useSunStore = create<SunState>((set) => ({
  pointer: { x: 0, y: 0 },
  scroll: 0,
  phase: "intro",
  ready: false,
  scale: 1,
  intensity: 1,
  setPointer: (x, y) => set({ pointer: { x, y } }),
  setScroll: (s) => set({ scroll: s }),
  setPhase: (p) => set({ phase: p }),
  setReady: (r) => set({ ready: r }),
  setScale: (s) => set({ scale: s }),
  setIntensity: (i) => set({ intensity: i }),
}));
