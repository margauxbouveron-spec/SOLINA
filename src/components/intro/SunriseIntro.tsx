"use client";

import { useGSAP } from "@gsap/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSunStore } from "../sun/useSunStore";

const STORAGE_KEY = "solina:sunrise-v1";

/* ─────────────────────── Sunrise scene shader ─────────────────────── */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uProgress;     // 0 = night, 1 = sun risen + apex held
  uniform float uMouse;        // pointer x, used for ripple
  uniform vec2  uResolution;

  /* ───── Noise helpers ───── */
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.0 + vec2(uTime * 0.02, 0.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(1.0, uResolution.y);

    /* ───── Geometry: horizon at 0.46, sun rises from -0.18 to +0.20 ───── */
    float horizon = 0.46;
    float sunStartY = horizon - 0.20;
    float sunEndY   = horizon + 0.22;
    float sunY      = mix(sunStartY, sunEndY, smoothstep(0.0, 1.0, uProgress));
    vec2  sunPos    = vec2(0.5, sunY);

    /* ───── Color phases ───── */
    // Phase 0: night under moonlight (bright enough to see the sea)
    vec3 nightTop    = vec3(0.045, 0.070, 0.150);
    vec3 nightBottom = vec3(0.090, 0.130, 0.220);
    vec3 nightSea    = vec3(0.060, 0.110, 0.200);

    // Phase 0.5: pre-dawn violet/peach
    vec3 dawnTop    = vec3(0.18, 0.14, 0.30);
    vec3 dawnBottom = vec3(0.70, 0.38, 0.36);
    vec3 dawnSea    = vec3(0.12, 0.18, 0.28);

    // Phase 1: golden hour
    vec3 dayTop    = vec3(0.42, 0.34, 0.48);
    vec3 dayBottom = vec3(1.00, 0.74, 0.40);
    vec3 daySea    = vec3(0.10, 0.22, 0.34);

    float p1 = smoothstep(0.0, 0.55, uProgress);
    float p2 = smoothstep(0.45, 1.0, uProgress);
    vec3 skyTop    = mix(mix(nightTop,    dawnTop,    p1), dayTop,    p2);
    vec3 skyBottom = mix(mix(nightBottom, dawnBottom, p1), dayBottom, p2);
    vec3 seaCol    = mix(mix(nightSea,    dawnSea,    p1), daySea,    p2);

    vec3 col = vec3(0.0);
    bool isSky = uv.y > horizon;

    /* ───── SKY ───── */
    if (isSky) {
      float skyT = (uv.y - horizon) / (1.0 - horizon);
      col = mix(skyBottom, skyTop, smoothstep(0.0, 1.0, pow(skyT, 0.85)));

      // Stars — visible at night, fade out as the sky brightens
      vec2 starP = uv * vec2(aspect, 1.0) * 90.0;
      vec2 starI = floor(starP);
      float starH = hash(starI);
      float star = step(0.992, starH);
      float twinkle = 0.4 + 0.6 * sin(uTime * (1.5 + starH * 4.0) + starH * 12.5);
      float starFade = (1.0 - p1) * smoothstep(0.0, 0.9, skyT);
      col += vec3(0.92, 0.95, 1.0) * star * twinkle * starFade * 0.95;

      // Subtle nebula band higher up — purple noise
      float neb = fbm(uv * 3.0 + vec2(0.0, uTime * 0.01));
      col += vec3(0.20, 0.10, 0.35) * neb * (1.0 - p1) * skyT * 0.18;

      // Atmospheric scatter glow around the sun
      vec2 dToSun = (uv - sunPos) * vec2(aspect, 1.0);
      float dSun = length(dToSun);
      float scatter = exp(-dSun * 3.6) * 0.85 * uProgress;
      col += vec3(1.00, 0.78, 0.42) * scatter;

      // Long horizontal warm band at horizon (heat haze)
      float horizonGlow = exp(-abs(uv.y - horizon) * 14.0);
      col += vec3(1.00, 0.55, 0.28) * horizonGlow * uProgress * 0.55;

      // Sun disc + corona — clean, no procedural rays
      if (sunY > horizon - 0.04) {
        // Perfectly round, very softly feathered disc — like a real distant sun
        float radius = 0.048;
        float disc = smoothstep(radius, radius - 0.004, dSun);
        col = mix(col, vec3(1.00, 0.97, 0.86), disc);

        // Tight inner corona — bright halo immediately around the disc
        float coronaTight = exp(-dSun * 14.0) * 0.65;
        col += vec3(1.00, 0.86, 0.55) * coronaTight;

        // Wide outer corona — soft warm bloom
        float coronaWide = exp(-dSun * 4.5) * 0.30;
        col += vec3(1.00, 0.74, 0.42) * coronaWide;

        // Subtle bright "kiss" at the very top of the disc — high-key highlight
        float topKiss = exp(-dSun * 28.0) * smoothstep(0.0, 0.05, sunPos.y - uv.y + 0.03);
        col += vec3(1.0, 0.98, 0.92) * topKiss * 0.4;
      }

      // Soft cloud band — smooth horizontal sine, no fbm
      float cloudShape = sin(uv.x * 5.0 + uTime * 0.04) * 0.5 + 0.5;
      cloudShape = smoothstep(0.45, 0.85, cloudShape);
      float cloudBand = smoothstep(0.62, 0.74, uv.y) * (1.0 - smoothstep(0.74, 0.92, uv.y));
      col += vec3(0.95, 0.78, 0.62) * cloudShape * cloudBand * 0.14 * uProgress;
    }

    /* ───── SEA — glassy, almost-mirror Mediterranean ───── */
    else {
      // Depth gradient — sapphire near horizon, near-black at bottom
      float depth = (horizon - uv.y) / horizon;
      vec3 deep = seaCol * 0.32;
      vec3 surface = seaCol * 1.55;
      col = mix(surface, deep, smoothstep(0.0, 1.0, pow(depth, 0.85)));

      // Very wide, very slow swells — broad sine curves, NOT noise.
      // These give the water a sense of motion without graininess.
      float swellA = sin(uv.y * 8.0 - uTime * 0.18) * 0.5 + 0.5;
      float swellB = sin(uv.y * 3.2 + uTime * 0.09 + uv.x * 0.6) * 0.5 + 0.5;
      float swell = swellA * swellB;
      // Tint the swell slightly toward the warm bottom-of-sky color
      vec3 swellTint = mix(vec3(0.06, 0.10, 0.18), skyBottom, 0.4);
      col += swellTint * swell * 0.18 * (1.0 - depth * 0.6);

      // Subtle horizontal shimmer hairlines — pure sine, no noise
      float hairlines = sin(uv.y * 200.0) * 0.5 + 0.5;
      hairlines = smoothstep(0.78, 1.0, hairlines);
      col += vec3(0.45, 0.62, 0.85) * hairlines * 0.06;

      /* ── Sun reflection — bright smooth column ── */
      if (sunY > horizon - 0.05) {
        float reflectX = abs(uv.x - 0.5) * aspect;
        float reflectY = horizon - uv.y;

        // Smooth gaussian column that widens with depth
        float colWidth = 0.045 + reflectY * 0.42;
        float column = exp(-reflectX * reflectX / max(0.0001, colWidth * colWidth));

        // Clean horizontal banding — clean sines, no noise
        float bands = 0.55 + 0.45 * sin(uv.y * 110.0 - uTime * 2.4);
        bands = smoothstep(0.30, 1.0, bands);
        column *= bands;

        // Fade with depth — exponential falloff
        column *= exp(-reflectY * 1.5);

        // Tied to sun height
        float sunHeight = smoothstep(-0.02, 0.22, sunY - horizon);
        column *= sunHeight;

        // Warm gold reflection
        col += vec3(1.00, 0.82, 0.48) * column * 2.1;

        // Brilliant white-hot kernel right at the horizon directly under the sun
        float kernel = exp(-reflectX * reflectX * 800.0) * exp(-reflectY * 18.0);
        col += vec3(1.00, 0.95, 0.78) * kernel * sunHeight * 1.4;
      }

      /* ── Moonlight glint — visible at night, fades as sun rises ── */
      {
        float reflectX = abs(uv.x - 0.5) * aspect;
        float reflectY = horizon - uv.y;
        float moonW = 0.030 + reflectY * 0.32;
        float moonStreak = exp(-reflectX * reflectX / max(0.0001, moonW * moonW));
        float moonBands = 0.55 + 0.45 * sin(uv.y * 130.0 - uTime * 1.8);
        moonBands = smoothstep(0.30, 1.0, moonBands);
        moonStreak *= moonBands;
        moonStreak *= exp(-reflectY * 1.7);
        col += vec3(0.62, 0.78, 0.98) * moonStreak * 0.85 * (1.0 - uProgress * 0.8);
      }

      /* ── Diamond sparkles — sparse, sharp, drifting ── */
      // Coarse cell grid keeps sparkles distinct (not a noise carpet)
      vec2 cellSize = vec2(140.0, 70.0);
      vec2 cell = floor(uv * cellSize + vec2(uTime * 0.04, 0.0));
      float h = hash(cell);
      // Only ~1.2% of cells host a sparkle
      float spark = step(0.988, h);
      // Each sparkle pulses with its own phase
      float pulse = 0.4 + 0.6 * sin(uTime * 3.0 + h * 30.0);
      // Position inside the cell, accentuate the very center
      vec2 cellUV = fract(uv * cellSize + vec2(uTime * 0.04, 0.0)) - 0.5;
      float pt = exp(-dot(cellUV, cellUV) * 90.0);
      float sparkle = spark * pulse * pt;
      // Concentrate sparkles in the top third of the sea (near horizon)
      float sparkleBand = smoothstep(0.0, 0.28, depth) * (1.0 - smoothstep(0.55, 1.0, depth));
      sparkle *= sparkleBand;
      // Cool-tinted at night, warm as the sun rises
      vec3 sparkleCol = mix(vec3(0.85, 0.95, 1.0), vec3(1.0, 0.92, 0.72), uProgress);
      col += sparkleCol * sparkle * 1.6;
    }

    /* ───── Vignette + grain ───── */
    vec2 c = uv - 0.5;
    float vig = 1.0 - dot(c, c) * 0.65;
    col *= vig;

    float grain = (hash(uv + uTime) - 0.5) * 0.022;
    col += grain;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ─────────────────────── Mesh ─────────────────────── */

function Scene({ progressRef }: { progressRef: React.MutableRefObject<{ value: number }> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uMouse: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size.width, size.height]
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uProgress.value = progressRef.current.value;
    matRef.current.uniforms.uResolution.value.set(state.size.width, state.size.height);
  });

  // Fill the entire viewport: orthographic zoom=1 means 1 world unit == 1 px,
  // so a unit plane scaled to (viewport.width, viewport.height) covers the screen.
  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

/* ─────────────────────── Component ─────────────────────── */

export function SunriseIntro() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);

  const [skip, setSkip] = useState(false);
  const [enterable, setEnterable] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const setReady = useSunStore((s) => s.setReady);
  const setPhase = useSunStore((s) => s.setPhase);

  // Mutable progress driven by GSAP, read each frame by the shader
  const progressRef = useRef({ value: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setSkip(true);
  }, []);

  useGSAP(
    () => {
      if (skip) {
        gsap.set(overlayRef.current, { autoAlpha: 0 });
        setReady(true);
        setPhase("hero");
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 0–0.6s — eyebrow text "moment précis" fades in (stays during the rise)
      tl.fromTo(
        eyebrowRef.current,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 1.0 },
        0.4
      );

      // 0–6s — sun rises (drives shader uProgress 0→1)
      tl.to(
        progressRef.current,
        { value: 1, duration: 6.2, ease: "power2.inOut" },
        0
      );

      // 5.6s — eyebrow fades out before wordmark arrives
      tl.to(
        eyebrowRef.current,
        { autoAlpha: 0, y: -6, duration: 0.8, ease: "power2.in" },
        5.6
      );

      // 6.2s — wordmark rises
      tl.fromTo(
        wordmarkRef.current,
        { autoAlpha: 0, y: 26, filter: "blur(14px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.4, ease: "power3.out" },
        6.2
      );

      // 7.0s — tagline
      tl.fromTo(
        taglineRef.current,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 1.0 },
        7.0
      );

      // 7.6s — CTA appears + becomes clickable
      tl.fromTo(
        ctaRef.current,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          onComplete: () => setEnterable(true),
        },
        7.6
      );
    },
    { dependencies: [skip] }
  );

  const enter = () => {
    if (!enterable || dismissing) return;
    setDismissing(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        setReady(true);
        setPhase("hero");
        setSkip(true);
      },
    });

    // Wordmark + CTA whoosh out first
    tl.to([ctaRef.current, taglineRef.current], {
      autoAlpha: 0,
      y: -20,
      duration: 0.6,
      stagger: 0.06,
    }, 0);
    tl.to(wordmarkRef.current, {
      autoAlpha: 0,
      y: -36,
      filter: "blur(10px)",
      duration: 0.9,
    }, 0.05);

    // Veil dissolves
    tl.to(overlayRef.current, { autoAlpha: 0, duration: 1.1 }, 0.35);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] overflow-hidden bg-night"
      aria-hidden={skip}
    >
      <div className="absolute inset-0">
        <Canvas
          orthographic
          camera={{ position: [0, 0, 1], zoom: 1, near: 0.01, far: 10 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <Scene progressRef={progressRef} />
        </Canvas>
      </div>

      {/* Top eyebrow — sets the mood while the sun rises */}
      <div
        ref={eyebrowRef}
        className="pointer-events-none absolute left-1/2 top-[14%] z-10 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.5em] text-cream/65 md:text-[11px]"
      >
        Méditerranée — un lever
      </div>

      {/* Wordmark — appears at apex of the sunrise */}
      <div
        ref={wordmarkRef}
        className="pointer-events-none absolute left-1/2 top-[58%] z-10 -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <h1
          className="font-editorial text-[20vw] italic leading-[0.85] tracking-[-0.02em] text-cream md:text-[12vw] lg:text-[180px]"
          style={{
            textShadow: "0 0 40px rgba(255, 220, 150, 0.35), 0 0 120px rgba(0,0,0,0.5)",
          }}
        >
          solina
        </h1>
      </div>

      {/* Tagline */}
      <div
        ref={taglineRef}
        className="pointer-events-none absolute left-1/2 top-[72%] z-10 -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.5em] text-cream/85 md:text-[12px]"
      >
        Capturer la lumière
      </div>

      {/* Click-to-enter CTA */}
      <button
        ref={ctaRef}
        type="button"
        onClick={enter}
        disabled={!enterable}
        aria-label="Entrer dans le site"
        className="group absolute bottom-[10%] left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-3 rounded-full bg-cream/[0.08] px-6 py-3 pr-2 text-[10.5px] uppercase tracking-[0.42em] text-cream ring-1 ring-inset ring-cream/25 backdrop-blur-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cream/[0.14] hover:ring-cream/55 active:scale-[0.985] disabled:cursor-default md:bottom-[12%]"
        style={{
          boxShadow: enterable
            ? "0 0 0 0 rgba(224,194,117,0.5)"
            : undefined,
          animation: enterable ? "breathe 3s ease-in-out infinite" : undefined,
        }}
      >
        <span>Entrer</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 text-cream transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-[1.06] group-hover:bg-cream/25">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>
  );
}
