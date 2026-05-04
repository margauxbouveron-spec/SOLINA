"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSunStore } from "./useSunStore";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Procedural sun fragment shader.
 * Layered noise yields a soft-living disc with golden corona.
 */
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vNormal;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uTemp;       // 0 dawn, 0.5 golden, 1 sunset
  uniform vec3  uCore;
  uniform vec3  uCorona;
  uniform vec3  uHalo;

  // Hash + value noise (cheap, stable on mobile)
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float d = length(uv);

    // Soft disc with feathered edge
    float core = smoothstep(0.50, 0.05, d);

    // Living turbulence — slow, organic
    vec2 flow = vec2(uTime * 0.04, uTime * 0.06);
    float turbulence = fbm(uv * 4.0 + flow);
    turbulence = mix(0.85, 1.15, turbulence);
    core *= turbulence;

    // Corona — radiant fall-off
    float corona = smoothstep(0.55, 0.10, d) * 0.45;
    corona += smoothstep(0.95, 0.20, d) * 0.18;

    // Rays — high frequency, polar coordinates
    float angle = atan(uv.y, uv.x);
    float rays = 0.5 + 0.5 * sin(angle * 22.0 + uTime * 0.3);
    rays *= smoothstep(0.5, 0.05, d);
    rays = pow(rays, 4.0) * 0.18;

    // Color grading by time-of-day
    vec3 warm = mix(uCore, uCorona, smoothstep(0.0, 0.5, d * 1.2));
    warm = mix(warm, uHalo, smoothstep(0.4, 0.95, d * 1.4));

    // Sunset shift — pull toward deep amber/red
    vec3 sunset = mix(warm, vec3(0.95, 0.55, 0.32), smoothstep(0.55, 1.0, uTemp));
    vec3 dawn   = mix(vec3(0.98, 0.92, 0.82), warm, smoothstep(0.0, 0.5, uTemp));
    vec3 col    = mix(dawn, sunset, smoothstep(0.0, 1.0, uTemp));

    float a = clamp((core + corona + rays) * uIntensity, 0.0, 1.0);
    gl_FragColor = vec4(col, a);
  }
`;

type SunProps = {
  /** Mounted size of the sun in NDC vertical units (1 ≈ viewport height/2) */
  size?: number;
  /** Optional fixed position (world space). When omitted, sun follows pointer + scroll. */
  fixed?: [number, number, number];
};

export function Sun({ size = 1.4, fixed }: SunProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const target = useRef(new THREE.Vector3());
  const current = useRef(new THREE.Vector3());

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uTemp: { value: 0.5 },
      uCore: { value: new THREE.Color("#FFE9B0") },
      uCorona: { value: new THREE.Color("#D4AF37") },
      uHalo: { value: new THREE.Color("#F6E2A8") },
    }),
    []
  );

  useFrame((state, delta) => {
    const sun = useSunStore.getState();
    const t = state.clock.elapsedTime;

    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      const targetIntensity = sun.ready ? sun.intensity : 0.001;
      matRef.current.uniforms.uIntensity.value +=
        (targetIntensity - matRef.current.uniforms.uIntensity.value) * 0.06;

      // Temperature: hero (golden) → product/checkout (cooler) → scroll past midpoint shifts to sunset
      const phaseTemp =
        sun.phase === "intro" ? 0.35 :
        sun.phase === "hero" ? 0.5 :
        sun.phase === "collection" ? 0.55 :
        sun.phase === "product" ? 0.4 :
        0.25;
      const scrollTemp = phaseTemp + sun.scroll * 0.5;
      matRef.current.uniforms.uTemp.value +=
        (scrollTemp - matRef.current.uniforms.uTemp.value) * 0.04;
    }

    if (!meshRef.current) return;

    if (fixed) {
      meshRef.current.position.set(fixed[0], fixed[1], fixed[2]);
      meshRef.current.scale.setScalar(size * sun.scale);
      return;
    }

    // Float organic with low-amp noise
    const floatX = Math.sin(t * 0.2) * 0.05 + Math.cos(t * 0.13) * 0.03;
    const floatY = Math.cos(t * 0.17) * 0.04 + Math.sin(t * 0.11) * 0.02;

    // Cursor parallax — subtle, delayed
    target.current.set(
      sun.pointer.x * 0.35 + floatX,
      0.6 + sun.pointer.y * 0.18 + floatY - sun.scroll * 1.6,
      0
    );
    current.current.lerp(target.current, 0.045);
    meshRef.current.position.copy(current.current);

    // Breathing scale + intro grow
    const breathe = 1 + Math.sin(t * 0.7) * 0.012;
    meshRef.current.scale.setScalar(size * sun.scale * breathe);
  });

  return (
    <mesh ref={meshRef} renderOrder={10}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
