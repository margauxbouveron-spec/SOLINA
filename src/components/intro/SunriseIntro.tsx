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
    // Phase 0: deep midnight
    vec3 nightTop    = vec3(0.018, 0.030, 0.072);
    vec3 nightBottom = vec3(0.030, 0.060, 0.110);
    vec3 nightSea    = vec3(0.012, 0.022, 0.052);

    // Phase 0.5: pre-dawn violet/indigo
    vec3 dawnTop    = vec3(0.10, 0.10, 0.22);
    vec3 dawnBottom = vec3(0.55, 0.30, 0.32);
    vec3 dawnSea    = vec3(0.06, 0.12, 0.22);

    // Phase 1: golden hour
    vec3 dayTop    = vec3(0.42, 0.34, 0.48);
    vec3 dayBottom = vec3(1.00, 0.74, 0.40);
    vec3 daySea    = vec3(0.08, 0.18, 0.30);

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

      // Sun disc + corona + rays (only when above horizon)
      if (sunY > horizon - 0.04) {
        // Slight blob via noise
        float blob = fbm((uv - sunPos) * 24.0 + uTime * 0.4);
        float radius = 0.052 + (blob - 0.5) * 0.004;
        float disc = smoothstep(radius, radius - 0.005, dSun);
        float surface = fbm((uv - sunPos) * 80.0 + uTime * 0.2);
        disc *= mix(0.92, 1.08, surface);
        col = mix(col, vec3(1.00, 0.96, 0.78), disc);

        // Thin rays
        float angle = atan(dToSun.y, dToSun.x);
        float rays = 0.5 + 0.5 * sin(angle * 26.0 + uTime * 0.18);
        rays = pow(max(rays, 0.0), 12.0) * smoothstep(0.36, 0.05, dSun) * 0.30 * uProgress;
        col += vec3(1.00, 0.92, 0.65) * rays;

        // Inner corona
        float corona = exp(-dSun * 12.0) * 0.55;
        col += vec3(1.00, 0.85, 0.55) * corona;
      }

      // Thin cloud streaks — break the gradient
      float clouds = smoothstep(0.55, 0.95, fbm(vec2(uv.x * 4.0 + uTime * 0.04, uv.y * 22.0)));
      float cloudBand = smoothstep(0.62, 0.78, uv.y) * (1.0 - smoothstep(0.78, 0.95, uv.y));
      col += vec3(1.0, 0.88, 0.7) * clouds * cloudBand * 0.18 * uProgress;
    }

    /* ───── SEA ───── */
    else {
      col = seaCol;

      // Wave field — multi-octave horizontal flow
      vec2 waveP = vec2(uv.x * aspect, uv.y) * vec2(7.0, 30.0);
      waveP.x += uTime * 0.18;
      float waves = fbm(waveP);
      float waves2 = fbm(waveP * 2.2 - vec2(uTime * 0.32, 0.0));
      float wave = mix(waves, waves2, 0.55);

      // Depth gradient — darker as you look down
      float depth = (horizon - uv.y) / horizon;
      col *= mix(1.25, 0.42, depth);

      // Wave highlights (small)
      col += vec3(0.55, 0.72, 0.92) * pow(wave, 5.0) * 0.28;

      // Sun reflection — vertical streak from sun's column
      if (sunY > horizon - 0.05) {
        float reflectX = abs(uv.x - 0.5) * aspect;
        float reflectY = horizon - uv.y;

        // Streak: narrow at top, widens with depth
        float streakWidth = 0.025 + reflectY * 0.55;
        float streak = exp(-reflectX * reflectX / max(0.0001, streakWidth * streakWidth));

        // Brokenness — modulated by waves
        float streakBreak = 0.45 + 0.55 * sin(uv.y * 70.0 - uTime * 5.0 + waves * 8.0);
        streak *= max(0.0, streakBreak);

        // Fade with depth
        streak *= exp(-reflectY * 1.4);

        // Strength tied to sun height above horizon
        float sunHeight = smoothstep(-0.02, 0.20, sunY - horizon);
        streak *= sunHeight;

        col += vec3(1.00, 0.82, 0.50) * streak * 1.7;
      }

      // Specular sparkles
      float sparkle = pow(wave, 14.0);
      col += vec3(1.00, 0.95, 0.80) * sparkle * 0.45 * uProgress;
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
  const { size } = useThree();

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

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
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
