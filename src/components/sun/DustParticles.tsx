"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSunStore } from "./useSunStore";

const COUNT = 220;

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vSeed = aSeed;
    vec3 p = position;

    // Slow vertical drift + lateral sway, modulated per particle by seed
    float t = uTime * aSpeed;
    p.x += sin(t * 0.8 + aSeed * 6.28) * 0.18;
    p.y += cos(t * 0.5 + aSeed * 12.56) * 0.12;
    p.y += mod(t * 0.05 + aSeed, 1.0) * 0.6 - 0.3;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Size in pixel units, with depth fade
    gl_PointSize = aSize * uPixelRatio * (1.0 / max(0.001, -mv.z));

    // Alpha breathing (twinkle)
    vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 9.0));
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  varying float vSeed;
  uniform vec3 uColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float halo = smoothstep(0.5, 0.15, d) * 0.4;
    float a = (core + halo) * vAlpha;
    // Slight per-particle hue shift toward warm
    vec3 col = mix(uColor, vec3(1.0, 0.85, 0.55), fract(vSeed * 7.13));
    gl_FragColor = vec4(col, a);
  }
`;

/**
 * Floating golden dust around the sun. Pure GPU points — cheap.
 */
export function DustParticles() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Distribute around sun area (-1.5..1.5 horizontally, -1..1 vertically)
      positions[i * 3 + 0] = (Math.random() - 0.5) * 3.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.2 + 0.4;
      positions[i * 3 + 2] = -0.05;
      sizes[i] = 1.5 + Math.random() * 4.0;
      seeds[i] = Math.random();
      speeds[i] = 0.4 + Math.random() * 0.8;
    }

    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      uColor: { value: new THREE.Color("#FFE3A0") },
    }),
    []
  );

  useFrame((state) => {
    const sun = useSunStore.getState();
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (pointsRef.current) {
      // Drift dust toward pointer for a delicate magnetic effect
      pointsRef.current.position.x +=
        (sun.pointer.x * 0.15 - pointsRef.current.position.x) * 0.04;
      pointsRef.current.position.y +=
        (sun.pointer.y * 0.08 - sun.scroll * 0.6 - pointsRef.current.position.y) * 0.04;
      pointsRef.current.visible = sun.ready;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} renderOrder={8}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
