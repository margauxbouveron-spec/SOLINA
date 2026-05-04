"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSunStore } from "./useSunStore";

/* ───────────────── Photosphere — disc + corona + rays ───────────────── */

const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uTemp;
  uniform float uFlare;     // 0..1 momentary flare bursts
  uniform vec3  uCore;
  uniform vec3  uCorona;
  uniform vec3  uHalo;

  // ---- Noise helpers ----
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * gnoise(p);
      p = mat2(1.6, 1.2, -1.2, 1.6) * p;
      a *= 0.5;
    }
    return 0.5 + 0.5 * v;
  }
  // Domain-warped fbm — gives churning, "living" surface
  float warpedFbm(vec2 p, float t) {
    vec2 q = vec2(fbm(p + t * 0.05), fbm(p + vec2(5.2, 1.3) + t * 0.07));
    vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.09),
                  fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.11));
    return fbm(p + 4.0 * r);
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float d = length(uv);

    // Discard far outside to save shading cost
    if (d > 0.7) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // ---- Photosphere disc (with limb darkening) ----
    float disc = smoothstep(0.50, 0.48, d);
    float limb = 1.0 - smoothstep(0.0, 0.50, d);
    float limbDark = mix(0.55, 1.05, limb);          // edges dimmer

    // Living surface — domain-warped multi-octave fbm
    float surface = warpedFbm(uv * 6.0, uTime * 0.3);
    surface = mix(0.7, 1.25, surface);

    // Granulation — small high-freq cells (boiling effect)
    float gran = fbm(uv * 28.0 + uTime * 0.4);
    gran = mix(0.92, 1.08, gran);

    // Sun spots — slow-moving darker patches
    float spots = smoothstep(0.65, 0.4, fbm(uv * 5.5 + vec2(uTime * 0.04, -uTime * 0.03)));
    spots = mix(1.0, 0.78, spots * 0.6);

    float photo = disc * limbDark * surface * gran * spots;

    // ---- Inner corona — radiant fall-off ----
    float corona1 = smoothstep(0.55, 0.10, d) * 0.42;       // tight
    float corona2 = smoothstep(0.95, 0.20, d) * 0.18;       // mid
    float corona3 = smoothstep(1.40, 0.30, d) * 0.06;       // far halo

    // ---- Volumetric god rays — angular noise on polar coords ----
    float angle = atan(uv.y, uv.x);
    float rays1 = fbm(vec2(angle * 6.0, uTime * 0.12));
    float rays2 = fbm(vec2(angle * 18.0 - uTime * 0.06, 1.3));
    float rays = pow(0.4 + 0.6 * (rays1 * 0.6 + rays2 * 0.4), 2.0);
    rays *= smoothstep(0.7, 0.05, d) * 0.55;

    // Sharp accent rays (thin spikes)
    float spikes = 0.5 + 0.5 * sin(angle * 24.0 + uTime * 0.18);
    spikes = pow(max(spikes, 0.0), 12.0) * smoothstep(0.5, 0.05, d) * 0.22;

    // ---- Solar flares (burst pulses) ----
    float flareRing = smoothstep(0.5, 0.48, d) - smoothstep(0.48, 0.42, d);
    float flareN = smoothstep(0.55, 0.95, fbm(vec2(angle * 4.0, uTime * 0.6)));
    float flares = flareRing * flareN * uFlare * 1.8;

    // ---- Color grading by time-of-day ----
    vec3 warm   = mix(uCore, uCorona, smoothstep(0.0, 0.5, d * 1.2));
    warm        = mix(warm, uHalo,    smoothstep(0.4, 0.95, d * 1.4));
    vec3 sunset = mix(warm, vec3(0.98, 0.52, 0.28), smoothstep(0.55, 1.0, uTemp));
    vec3 dawn   = mix(vec3(1.00, 0.96, 0.86), warm, smoothstep(0.0, 0.5, uTemp));
    vec3 col    = mix(dawn, sunset, smoothstep(0.0, 1.0, uTemp));

    // Boost saturation of flares with a hotter tint
    vec3 flareCol = mix(col, vec3(1.0, 0.85, 0.55), 0.6);

    float a = clamp(
      (photo + corona1 + corona2 + corona3 + rays + spikes) * uIntensity + flares,
      0.0, 1.0
    );

    vec3 finalCol = col + flareCol * flares;

    gl_FragColor = vec4(finalCol, a);
  }
`;

/* ───────────────── Lens flare — anamorphic streak + ghosts ───────────────── */

const flareFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uTint;

  // Hash
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec2 uv = vUv - 0.5;

    // Anamorphic horizontal streak (cyan-tinted)
    float streak = exp(-abs(uv.y) * 80.0) * exp(-abs(uv.x) * 1.2);
    vec3 streakCol = vec3(0.55, 0.78, 1.0) * streak * 0.9;

    // Vertical short streak
    float streakV = exp(-abs(uv.x) * 90.0) * exp(-abs(uv.y) * 5.0) * 0.4;
    streakCol += vec3(1.0, 0.92, 0.7) * streakV;

    // Soft glow halo
    float halo = exp(-length(uv) * 5.5) * 0.65;

    // Ghost circles along the line from center
    vec3 ghosts = vec3(0.0);
    for (int i = 1; i <= 6; i++) {
      float fi = float(i);
      vec2 gp = uv * (1.0 + fi * 0.18);
      float r = length(gp);
      float g = exp(-r * (35.0 + fi * 8.0));
      vec3 tint = mix(vec3(1.0, 0.7, 0.4), vec3(0.55, 0.8, 1.0), fract(fi * 0.37));
      ghosts += g * tint * (0.05 + 0.02 * hash(fi));
    }

    // Subtle hex bloom
    float ang = atan(uv.y, uv.x);
    float hex = 0.5 + 0.5 * cos(ang * 6.0);
    float hexBloom = exp(-length(uv) * 8.0) * (0.5 + 0.5 * hex) * 0.18;

    vec3 col = (streakCol + uTint * halo + ghosts + uTint * hexBloom) * uIntensity;
    float a = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
    gl_FragColor = vec4(col, a);
  }
`;

/* ───────────────── Heat shimmer — subtle distortion below sun ───────────────── */

const shimmerFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    float wave = n2(vec2(uv.x * 8.0, uv.y * 4.0 + uTime * 0.6));
    float falloff = smoothstep(0.0, 0.6, uv.y);     // strongest near top edge
    float horiz = smoothstep(0.0, 0.4, abs(uv.x - 0.5)) * -0.6 + 1.0;
    float a = wave * falloff * horiz * 0.18 * uIntensity;
    gl_FragColor = vec4(vec3(1.0, 0.85, 0.55) * a, a);
  }
`;

/* ───────────────── Component ───────────────── */

type SunProps = {
  size?: number;
  fixed?: [number, number, number];
};

export function Sun({ size = 1.4, fixed }: SunProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sunMatRef = useRef<THREE.ShaderMaterial>(null);
  const flareMatRef = useRef<THREE.ShaderMaterial>(null);
  const shimmerMatRef = useRef<THREE.ShaderMaterial>(null);

  const target = useRef(new THREE.Vector3());
  const current = useRef(new THREE.Vector3());

  const sunUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uTemp: { value: 0.5 },
      uFlare: { value: 0 },
      uCore: { value: new THREE.Color("#FFF4C9") },
      uCorona: { value: new THREE.Color("#E5BC54") },
      uHalo: { value: new THREE.Color("#F6E2A8") },
    }),
    []
  );

  const flareUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uTint: { value: new THREE.Color("#FFE6A8") },
    }),
    []
  );

  const shimmerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const sun = useSunStore.getState();
    const t = state.clock.elapsedTime;

    // Occasional flare burst — Perlin-like smooth pulse
    const burst = Math.max(0, Math.sin(t * 0.27) - 0.92) * 12;
    const burst2 = Math.max(0, Math.sin(t * 0.13 + 1.7) - 0.95) * 18;
    const flareLevel = Math.min(1, burst + burst2);

    if (sunMatRef.current) {
      const u = sunMatRef.current.uniforms;
      u.uTime.value = t;
      const targetIntensity = sun.ready ? sun.intensity : 0.001;
      u.uIntensity.value += (targetIntensity - u.uIntensity.value) * 0.06;
      u.uFlare.value += (flareLevel - u.uFlare.value) * 0.08;

      const phaseTemp =
        sun.phase === "intro" ? 0.35 :
        sun.phase === "hero" ? 0.5 :
        sun.phase === "collection" ? 0.55 :
        sun.phase === "product" ? 0.4 :
        0.25;
      const scrollTemp = phaseTemp + sun.scroll * 0.5;
      u.uTemp.value += (scrollTemp - u.uTemp.value) * 0.04;
    }

    if (flareMatRef.current) {
      flareMatRef.current.uniforms.uTime.value = t;
      const targetFlare = sun.ready ? sun.intensity * 0.85 : 0;
      flareMatRef.current.uniforms.uIntensity.value +=
        (targetFlare - flareMatRef.current.uniforms.uIntensity.value) * 0.05;
    }

    if (shimmerMatRef.current) {
      shimmerMatRef.current.uniforms.uTime.value = t;
      const targetShim = sun.ready ? sun.intensity * 0.9 : 0;
      shimmerMatRef.current.uniforms.uIntensity.value +=
        (targetShim - shimmerMatRef.current.uniforms.uIntensity.value) * 0.05;
    }

    if (!groupRef.current) return;

    if (fixed) {
      groupRef.current.position.set(fixed[0], fixed[1], fixed[2]);
      groupRef.current.scale.setScalar(size * sun.scale);
      return;
    }

    // Float — organic + cursor parallax + scroll sunset descent
    const floatX = Math.sin(t * 0.2) * 0.05 + Math.cos(t * 0.13) * 0.03;
    const floatY = Math.cos(t * 0.17) * 0.04 + Math.sin(t * 0.11) * 0.02;
    target.current.set(
      sun.pointer.x * 0.35 + floatX,
      0.6 + sun.pointer.y * 0.18 + floatY - sun.scroll * 1.6,
      0
    );
    current.current.lerp(target.current, 0.045);
    groupRef.current.position.copy(current.current);

    // Breathing scale + intro grow
    const breathe = 1 + Math.sin(t * 0.7) * 0.012;
    groupRef.current.scale.setScalar(size * sun.scale * breathe);

    // Sun rotates very slowly to keep rays alive
    groupRef.current.rotation.z = t * 0.012;
  });

  return (
    <group ref={groupRef} renderOrder={10}>
      {/* Heat shimmer underneath — large vertical strip */}
      <mesh position={[0, -0.9, -0.02]} renderOrder={9}>
        <planeGeometry args={[3.2, 1.8]} />
        <shaderMaterial
          ref={shimmerMatRef}
          uniforms={shimmerUniforms}
          vertexShader={sunVertex}
          fragmentShader={shimmerFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Far halo + lens flare ghosts (anamorphic) */}
      <mesh position={[0, 0, -0.01]} renderOrder={11}>
        <planeGeometry args={[6, 3]} />
        <shaderMaterial
          ref={flareMatRef}
          uniforms={flareUniforms}
          vertexShader={sunVertex}
          fragmentShader={flareFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Photosphere core */}
      <mesh renderOrder={12}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <shaderMaterial
          ref={sunMatRef}
          uniforms={sunUniforms}
          vertexShader={sunVertex}
          fragmentShader={sunFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
