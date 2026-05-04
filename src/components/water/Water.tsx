"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uMouse;     // [-1, 1]
  uniform vec3  uShallow;
  uniform vec3  uDeep;
  uniform vec3  uSun;       // sun color
  uniform vec2  uSunUV;     // 0..1

  // Hash + value noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p) {
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
      v += a * vnoise(p);
      p = p * 2.07 + vec2(uTime * 0.04, uTime * 0.03);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Layered ripples
    float t = uTime * 0.18;
    float n1 = fbm(uv * 4.0 + vec2(t, -t * 0.6));
    float n2 = fbm(uv * 8.0 - vec2(t * 1.3, t * 0.4));
    float ripple = mix(n1, n2, 0.55);

    // Mouse splash — distance-based displacement
    vec2 m = uMouse * 0.5 + 0.5;
    float md = distance(uv, m);
    float splash = exp(-md * 12.0) * 0.55;
    ripple += splash * (0.4 + 0.6 * sin(md * 60.0 - uTime * 4.0));

    // Color from depth + ripple
    vec3 col = mix(uDeep, uShallow, smoothstep(0.25, 0.85, ripple));

    // Fresnel-style horizon glow toward top
    float horizon = smoothstep(0.85, 0.45, uv.y);
    col = mix(col, uShallow * 1.15, horizon * 0.35);

    // Sun reflection — soft elongated glint toward sun position
    vec2 toSun = uv - uSunUV;
    float vert = abs(toSun.x);
    float along = clamp(toSun.y, 0.0, 1.0);
    float glint = exp(-vert * 24.0) * exp(-along * 1.6);
    glint *= 0.6 + 0.4 * sin(uv.y * 80.0 - uTime * 3.0);
    col += uSun * glint * 0.85;

    // Specular highlights
    float spec = pow(ripple, 6.0) * 0.4;
    col += vec3(1.0, 0.94, 0.78) * spec;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Surface() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uShallow: { value: new THREE.Color("#7AA9C2") },
      uDeep: { value: new THREE.Color("#1F3A5F") },
      uSun: { value: new THREE.Color("#FFE3A0") },
      uSunUV: { value: new THREE.Vector2(0.5, 0.78) },
    }),
    []
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const { x, y } = state.pointer;
    matRef.current.uniforms.uMouse.value.set(x, y);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
      />
    </mesh>
  );
}

export function Water({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1, near: 0.01, far: 10 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Surface />
      </Canvas>
    </div>
  );
}
