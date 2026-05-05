"use client";

import { useGSAP } from "@gsap/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import gsap from "gsap";
import { BlendFunction, KernelSize } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Vector2 } from "three";
import { useSunStore } from "../sun/useSunStore";

const STORAGE_KEY = "solina:sunrise-v2";

/* ─────────────────────────────────────────────────────────────────
   GERSTNER OCEAN — 5 wave layers, all coprime so the surface never
   visibly repeats. Direction / amplitude / wavelength / speed /
   steepness are tuned to feel like a calm Mediterranean swell, not
   a stormy open ocean.
   ───────────────────────────────────────────────────────────────── */

const WAVES: ReadonlyArray<{
  dir: [number, number];
  amp: number;
  len: number;
  speed: number;
  steep: number;
}> = [
  { dir: [1.0, 0.20],  amp: 0.22, len: 9.5, speed: 1.0, steep: 0.45 },
  { dir: [0.85, -0.30], amp: 0.14, len: 6.1, speed: 1.18, steep: 0.36 },
  { dir: [0.65, 0.55],  amp: 0.08, len: 3.7, speed: 1.42, steep: 0.30 },
  { dir: [0.92, -0.08], amp: 0.05, len: 2.1, speed: 1.71, steep: 0.22 },
  { dir: [0.40, 0.70],  amp: 0.025, len: 1.18, speed: 2.13, steep: 0.16 },
];

/* ─────────────────────────── WATER SHADERS ─────────────────────────── */

const waterVertex = /* glsl */ `
  uniform float uTime;
  // Pack: (dirX, dirY, amplitude, wavelength)
  uniform vec4 uWaves[5];
  // Pack: (speed, steepness)
  uniform vec2 uWaveExtra[5];

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFoam;

  void main() {
    vec3 pos = position;
    vec3 tangent  = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    float foam = 0.0;

    for (int i = 0; i < 5; i++) {
      vec2 dir = normalize(uWaves[i].xy);
      float a = uWaves[i].z;
      float L = uWaves[i].w;
      float speed = uWaveExtra[i].x;
      float Q = uWaveExtra[i].y;

      float k = 6.2831853 / L;                 // wave number
      float c = sqrt(9.81 / k);                // gravity-driven phase speed
      float phi = k * (dot(dir, pos.xz) - c * speed * uTime);
      float cosF = cos(phi);
      float sinF = sin(phi);

      // Gerstner displacement
      pos.x += Q * a * dir.x * cosF;
      pos.z += Q * a * dir.y * cosF;
      pos.y += a * sinF;

      // Tangent / binormal accumulation for accurate normal
      float wa = k * a;
      tangent.x  += -Q * dir.x * dir.x * wa * sinF;
      tangent.y  +=      dir.x * wa * cosF;
      tangent.z  += -Q * dir.x * dir.y * wa * sinF;
      binormal.x += -Q * dir.x * dir.y * wa * sinF;
      binormal.y +=      dir.y * wa * cosF;
      binormal.z += -Q * dir.y * dir.y * wa * sinF;

      // Foam: highlight wave crests, weighted by the wave's steepness
      foam += smoothstep(0.86, 1.0, sinF) * Q;
    }

    vec3 normal = normalize(cross(binormal, tangent));
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal   = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vFoam     = clamp(foam, 0.0, 1.0);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragment = /* glsl */ `
  precision highp float;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFoam;

  uniform float uTime;
  uniform float uProgress;     // 0 night → 1 risen
  uniform vec3  uCameraPos;
  uniform vec3  uSunPos;
  uniform vec3  uSunColor;
  uniform vec3  uShallow;
  uniform vec3  uDeep;
  uniform vec3  uSky;
  uniform vec3  uMoonColor;

  /* ─── Procedural value noise for animated micro-normals ─── */
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Animated ripple normal — two octaves of noise at right angles, derived as a gradient
  vec3 microNormal(vec2 p, float t) {
    vec2 d1 = vec2(t * 0.18, t * 0.13);
    vec2 d2 = vec2(-t * 0.11, t * 0.21);
    float h0 = noise(p * 6.0 + d1) + 0.5 * noise(p * 14.0 + d2);
    float hx = noise((p + vec2(0.01, 0.0)) * 6.0 + d1) + 0.5 * noise((p + vec2(0.01, 0.0)) * 14.0 + d2);
    float hz = noise((p + vec2(0.0, 0.01)) * 6.0 + d1) + 0.5 * noise((p + vec2(0.0, 0.01)) * 14.0 + d2);
    return normalize(vec3(h0 - hx, 1.0, h0 - hz));
  }

  void main() {
    vec3 N = normalize(vNormal);

    // Layer animated micro-ripples on top of the Gerstner geometric normal
    vec3 micro = microNormal(vWorldPos.xz, uTime);
    N = normalize(N + vec3(micro.x, 0.0, micro.z) * 0.55);

    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 L = normalize(uSunPos - vWorldPos);

    /* ── Schlick Fresnel ── */
    float fres = pow(1.0 - max(0.0, dot(V, N)), 5.0);
    fres = mix(0.025, 1.0, fres);

    /* ── Depth-based water color (turquoise close, navy deep) ── */
    float dist = length(uCameraPos - vWorldPos);
    float depthT = smoothstep(2.5, 28.0, dist);
    vec3 waterCol = mix(uShallow, uDeep, depthT);

    /* ── Reflection (sky tint via Fresnel) ── */
    vec3 R = reflect(-V, N);
    float skyUp = smoothstep(-0.1, 0.6, R.y);
    vec3 reflCol = mix(uSky * 0.7, uSky * 1.4, skyUp);

    /* ── Sun specular (Blinn-Phong, two lobes) ── */
    vec3 H = normalize(L + V);
    float NdotH = max(0.0, dot(N, H));
    float specHard = pow(NdotH, 480.0) * 9.0;
    float specSoft = pow(NdotH, 28.0) * 0.55;
    float sunVis = smoothstep(0.0, 0.4, uProgress);
    vec3 specular = uSunColor * (specHard + specSoft) * sunVis;

    /* ── Cool moonlight specular (visible at night) ── */
    vec3 moonDir = normalize(vec3(0.0, 1.0, -0.6));
    vec3 Hm = normalize(moonDir + V);
    float specMoon = pow(max(0.0, dot(N, Hm)), 220.0) * 4.0;
    vec3 moonSpec = uMoonColor * specMoon * (1.0 - smoothstep(0.0, 0.65, uProgress));

    /* ── Compose ── */
    vec3 col = mix(waterCol, reflCol, fres * 0.75);
    col += specular;
    col += moonSpec;

    /* ── Foam on crests ── */
    vec3 foamCol = mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.95, 0.85), uProgress);
    col = mix(col, foamCol, vFoam * 0.65);

    /* ── Distance haze: water blends into sky at the horizon ── */
    float fog = smoothstep(8.0, 60.0, dist);
    col = mix(col, uSky, fog * 0.92);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Water({
  progressRef,
  sunPosRef,
  highQuality,
}: {
  progressRef: React.MutableRefObject<{ value: number }>;
  sunPosRef: React.MutableRefObject<THREE.Vector3>;
  highQuality: boolean;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaves: {
        value: WAVES.map(
          (w) => new THREE.Vector4(w.dir[0], w.dir[1], w.amp, w.len)
        ),
      },
      uWaveExtra: {
        value: WAVES.map((w) => new THREE.Vector2(w.speed, w.steep)),
      },
      uCameraPos: { value: new THREE.Vector3() },
      uSunPos: { value: new THREE.Vector3(0, -1, -10) },
      uSunColor: { value: new THREE.Color("#FFD68A") },
      uMoonColor: { value: new THREE.Color("#9CB7E0") },
      uShallow: { value: new THREE.Color("#2C7A9C") },
      uDeep: { value: new THREE.Color("#06122A") },
      uSky: { value: new THREE.Color("#11253F") },
      uProgress: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    const p = progressRef.current.value;
    const u = matRef.current.uniforms;

    u.uTime.value = t;
    u.uProgress.value = p;
    u.uCameraPos.value.copy(camera.position);
    u.uSunPos.value.copy(sunPosRef.current);

    /* Sky color phases (RGB lerps): night → dawn → golden hour */
    const phase = (n0: number, n1: number, d0: number, d1: number, g0: number, g1: number) => {
      const a = Math.min(1, p * 2.0);
      const b = Math.max(0, (p - 0.5) * 2.0);
      return n0 * (1 - a) + (d0 * (1 - b) + g0 * b) * a;
    };
    u.uSky.value.setRGB(
      phase(0.030, 0, 0.32, 0, 0.62, 0),
      phase(0.060, 0, 0.18, 0, 0.45, 0),
      phase(0.140, 0, 0.20, 0, 0.36, 0)
    );
    u.uShallow.value.setRGB(
      phase(0.10, 0, 0.34, 0, 0.55, 0),
      phase(0.32, 0, 0.42, 0, 0.50, 0),
      phase(0.55, 0, 0.50, 0, 0.42, 0)
    );
  });

  // Lower poly count on mobile for budget
  const segs = highQuality ? 192 : 96;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
      <planeGeometry args={[140, 140, segs, segs]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={waterVertex}
        fragmentShader={waterFragment}
      />
    </mesh>
  );
}

/* ─────────────────────────── SKY SHADERS ─────────────────────────── */

const skyVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const skyFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform float uProgress;
  uniform vec3  uSunWorldPos;
  uniform vec3  uTopNight;
  uniform vec3  uBottomNight;
  uniform vec3  uTopDay;
  uniform vec3  uBottomDay;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    // Vertical gradient — uv.y goes 0 (bottom) to 1 (top of sky plane)
    float skyT = clamp(vUv.y, 0.0, 1.0);
    float p1 = smoothstep(0.0, 0.55, uProgress);
    float p2 = smoothstep(0.45, 1.0, uProgress);

    vec3 dawnTop = vec3(0.18, 0.14, 0.30);
    vec3 dawnBot = vec3(0.74, 0.36, 0.34);
    vec3 top = mix(mix(uTopNight, dawnTop, p1), uTopDay, p2);
    vec3 bot = mix(mix(uBottomNight, dawnBot, p1), uBottomDay, p2);
    vec3 col = mix(bot, top, pow(skyT, 0.85));

    // Stars — visible at low progress, fade out
    vec2 starP = vUv * vec2(220.0, 100.0);
    vec2 starI = floor(starP);
    float h = hash(starI);
    float star = step(0.992, h);
    float twinkle = 0.45 + 0.55 * sin(uTime * (1.6 + h * 4.0) + h * 12.5);
    col += vec3(0.92, 0.95, 1.0) * star * twinkle * (1.0 - p1) * skyT * 0.95;

    // Sun-ward horizon scatter (warm band near horizon, brightest under sun)
    float hScatter = exp(-vUv.y * 6.5) * uProgress;
    col += vec3(1.0, 0.55, 0.28) * hScatter * 0.55;

    // The sun disc + corona, rendered in screen-space at the sun's projected UV
    // Project sun world pos to NDC manually via passed-in uniform — simpler to
    // compute vUv distance to a uniform-supplied UV (uSunWorldPos.xy used as
    // pre-projected sun UV on this plane).
    vec2 sunUv = uSunWorldPos.xy;
    float dSun = length(vUv - sunUv);
    if (uSunWorldPos.z > 0.5) {
      // Disc
      float radius = 0.045;
      float disc = smoothstep(radius, radius - 0.004, dSun);
      col = mix(col, vec3(1.00, 0.97, 0.86), disc);
      // Tight + wide corona
      col += vec3(1.00, 0.82, 0.50) * exp(-dSun * 16.0) * 0.75;
      col += vec3(1.00, 0.66, 0.36) * exp(-dSun *  4.5) * 0.30;
    }

    // Soft cloud band — single sine wave, no noise carpet
    float cloud = sin(vUv.x * 4.5 + uTime * 0.04) * 0.5 + 0.5;
    cloud = smoothstep(0.50, 0.85, cloud);
    float cloudBand = smoothstep(0.40, 0.55, vUv.y) * (1.0 - smoothstep(0.55, 0.78, vUv.y));
    col += vec3(0.95, 0.78, 0.62) * cloud * cloudBand * 0.16 * uProgress;

    // Subtle film grain
    col += (hash(vUv + uTime) - 0.5) * 0.018;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Sky background plane — sits far behind the water, fills everything above
 * the horizon line. The sun is projected onto this plane via a uniform.
 */
function Sky({
  progressRef,
  sunUvRef,
}: {
  progressRef: React.MutableRefObject<{ value: number }>;
  sunUvRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uSunWorldPos: { value: new THREE.Vector3(0.5, 0.5, 0) },
      uTopNight: { value: new THREE.Color("#070D17") },
      uBottomNight: { value: new THREE.Color("#1A2438") },
      uTopDay: { value: new THREE.Color("#48395E") },
      uBottomDay: { value: new THREE.Color("#FFC07A") },
    }),
    []
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uProgress.value = progressRef.current.value;
    matRef.current.uniforms.uSunWorldPos.value.copy(sunUvRef.current);
  });

  return (
    <mesh position={[0, 14, -45]}>
      <planeGeometry args={[160, 60]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={skyVertex}
        fragmentShader={skyFragment}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─────────────────────── Sun position controller ─────────────────────── */

function SunPositionRig({
  progressRef,
  sunPosRef,
  sunUvRef,
}: {
  progressRef: React.MutableRefObject<{ value: number }>;
  sunPosRef: React.MutableRefObject<THREE.Vector3>;
  sunUvRef: React.MutableRefObject<THREE.Vector3>;
}) {
  useFrame(() => {
    const p = progressRef.current.value;

    // Sun's world position — starts behind the horizon (below water), rises
    const sunY = -1.5 + p * 5.5;       // -1.5 (under) → 4.0 (high above horizon)
    const sunZ = -22.0;                // far away
    sunPosRef.current.set(0, sunY, sunZ);

    // Project the sun to UV space of the sky plane (160x60, centered at y=14, z=-45)
    // Sky plane spans X in [-80, 80], Y in [-16, 44]
    const skyU = 0.5; // sun is centered horizontally
    const skyV = (sunY - (-16)) / 60;  // map [-16..44] → [0..1]
    sunUvRef.current.set(
      Math.max(0, Math.min(1, skyU)),
      Math.max(0, Math.min(1, skyV)),
      sunY > -0.4 ? 1.0 : 0.0          // visibility flag for sky shader
    );
  });
  return null;
}

/* ─────────────────────────── Component ─────────────────────────── */

export function SunriseIntro() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);

  const [skip, setSkip] = useState(false);
  const [enterable, setEnterable] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [highQuality, setHighQuality] = useState(false);

  const setReady = useSunStore((s) => s.setReady);
  const setPhase = useSunStore((s) => s.setPhase);

  const progressRef = useRef({ value: 0 });
  const sunPosRef = useRef(new THREE.Vector3(0, -1.5, -22));
  const sunUvRef = useRef(new THREE.Vector3(0.5, 0.0, 0));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setSkip(true);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const wide = window.innerWidth >= 768;
    const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setHighQuality(wide && motion && dpr >= 1);
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

      tl.fromTo(
        eyebrowRef.current,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 1.0 },
        0.4
      );

      tl.to(
        progressRef.current,
        { value: 1, duration: 6.4, ease: "power2.inOut" },
        0
      );

      tl.to(
        eyebrowRef.current,
        { autoAlpha: 0, y: -6, duration: 0.8, ease: "power2.in" },
        5.7
      );

      tl.fromTo(
        wordmarkRef.current,
        { autoAlpha: 0, y: 26, filter: "blur(14px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.4 },
        6.4
      );

      tl.fromTo(
        taglineRef.current,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 1.0 },
        7.2
      );

      tl.fromTo(
        ctaRef.current,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          onComplete: () => setEnterable(true),
        },
        7.8
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

    tl.to(
      [ctaRef.current, taglineRef.current],
      { autoAlpha: 0, y: -20, duration: 0.6, stagger: 0.06 },
      0
    );
    tl.to(
      wordmarkRef.current,
      { autoAlpha: 0, y: -36, filter: "blur(10px)", duration: 0.9 },
      0.05
    );
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
          camera={{ position: [0, 2.4, 4.5], fov: 52, near: 0.1, far: 200 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 1.2, -10);
          }}
        >
          <SunPositionRig
            progressRef={progressRef}
            sunPosRef={sunPosRef}
            sunUvRef={sunUvRef}
          />
          <Sky progressRef={progressRef} sunUvRef={sunUvRef} />
          <Water
            progressRef={progressRef}
            sunPosRef={sunPosRef}
            highQuality={highQuality}
          />
          {highQuality && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={1.4}
                luminanceThreshold={0.55}
                luminanceSmoothing={0.6}
                kernelSize={KernelSize.LARGE}
                mipmapBlur
                blendFunction={BlendFunction.SCREEN}
              />
              <ChromaticAberration
                offset={new Vector2(0.0008, 0.0008)}
                radialModulation={true}
                modulationOffset={0.5}
                blendFunction={BlendFunction.NORMAL}
              />
              <Vignette eskil={false} offset={0.3} darkness={0.5} />
            </EffectComposer>
          )}
        </Canvas>
      </div>

      {/* Top eyebrow */}
      <div
        ref={eyebrowRef}
        className="pointer-events-none absolute left-1/2 top-[14%] z-10 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.5em] text-cream/65 md:text-[11px]"
      >
        Méditerranée — un lever
      </div>

      {/* Wordmark */}
      <div
        ref={wordmarkRef}
        className="pointer-events-none absolute left-1/2 top-[58%] z-10 -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <h1
          className="font-editorial text-[20vw] italic leading-[0.85] tracking-[-0.02em] text-cream md:text-[12vw] lg:text-[180px]"
          style={{
            textShadow:
              "0 0 40px rgba(255, 220, 150, 0.35), 0 0 120px rgba(0,0,0,0.55)",
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

      {/* CTA */}
      <button
        ref={ctaRef}
        type="button"
        onClick={enter}
        disabled={!enterable}
        aria-label="Entrer dans le site"
        className="group absolute bottom-[10%] left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-3 rounded-full bg-cream/[0.08] px-6 py-3 pr-2 text-[10.5px] uppercase tracking-[0.42em] text-cream ring-1 ring-inset ring-cream/25 backdrop-blur-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-cream/[0.14] hover:ring-cream/55 active:scale-[0.985] disabled:cursor-default md:bottom-[12%]"
        style={{
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
