"use client";

import { Environment, Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useSunStore } from "./useSunStore";

/**
 * The Sun — a full 3D iridescent metallic sphere.
 *
 * Replaces the original orthographic flat-shader sun with a real
 * perspective-rendered orb. Smooth high-poly geometry with subtle vertex
 * displacement for an organic blob feel; MeshPhysicalMaterial with
 * iridescence + clearcoat tuned to a warm gold base, lit by a single
 * gold key light that slides with the cursor + scroll. Bloom around it
 * (added at the canvas level) yields the cinematic chrome-orb feel.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistort;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  // Classic perlin noise (Ashima)
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}
  float cnoise(vec3 P){
    vec3 Pi0=floor(P);vec3 Pi1=Pi0+vec3(1.0);
    Pi0=mod289(vec4(Pi0,0.0).xyz);Pi1=mod289(vec4(Pi1,0.0).xyz);
    vec3 Pf0=fract(P);vec3 Pf1=Pf0-vec3(1.0);
    vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
    vec4 iy=vec4(Pi0.yy,Pi1.yy);
    vec4 iz0=Pi0.zzzz;vec4 iz1=Pi1.zzzz;
    vec4 ixy=permute(permute(ix)+iy);
    vec4 ixy0=permute(ixy+iz0);vec4 ixy1=permute(ixy+iz1);
    vec4 gx0=ixy0*(1.0/7.0);vec4 gy0=fract(floor(gx0)*(1.0/7.0))-0.5;
    gx0=fract(gx0);vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);vec4 sz0=step(gz0,vec4(0.0));
    gx0-=sz0*(step(0.0,gx0)-0.5);gy0-=sz0*(step(0.0,gy0)-0.5);
    vec4 gx1=ixy1*(1.0/7.0);vec4 gy1=fract(floor(gx1)*(1.0/7.0))-0.5;
    gx1=fract(gx1);vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);vec4 sz1=step(gz1,vec4(0.0));
    gx1-=sz1*(step(0.0,gx1)-0.5);gy1-=sz1*(step(0.0,gy1)-0.5);
    vec3 g000=vec3(gx0.x,gy0.x,gz0.x);vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010=vec3(gx0.z,gy0.z,gz0.z);vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001=vec3(gx1.x,gy1.x,gz1.x);vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011=vec3(gx1.z,gy1.z,gz1.z);vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
    g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;
    vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
    g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;
    float n000=dot(g000,Pf0);
    float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
    float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));
    float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
    float n001=dot(g001,vec3(Pf0.xy,Pf1.z));
    float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
    float n011=dot(g011,vec3(Pf0.x,Pf1.yz));
    float n111=dot(g111,Pf1);
    vec3 fade_xyz=fade(Pf0);
    vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
    vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
    float n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);
    return 2.2*n_xyz;
  }

  void main() {
    float n = cnoise(position * 1.6 + vec3(uTime * 0.18));
    float n2 = cnoise(position * 3.2 + vec3(uTime * 0.07, 0.0, uTime * 0.05));
    float displacement = (n * 0.6 + n2 * 0.25) * uDistort;
    vec3 displaced = position + normal * displacement;

    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mv.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * Inner glow plane, sits behind the sphere — radial fade.
 * Sells the "luminous body" feeling and keeps bloom hot in the center.
 */
function InnerGlow() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#FFD68A") },
      uIntensity: { value: 0.9 },
    }),
    []
  );

  useFrame((s) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = s.clock.elapsedTime;
  });

  return (
    <mesh position={[0, 0, -0.6]} renderOrder={1}>
      <planeGeometry args={[6, 6]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `}
        fragmentShader={`
          precision highp float;
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uIntensity;
          void main(){
            vec2 p = vUv - 0.5;
            float d = length(p);
            float pulse = 0.92 + 0.08 * sin(uTime * 0.4);
            float core = exp(-d * 4.6) * pulse;
            float halo = exp(-d * 1.6) * 0.18;
            float a = clamp(core * uIntensity + halo, 0.0, 1.0);
            gl_FragColor = vec4(uColor * (core + halo) * uIntensity, a);
          }
        `}
      />
    </mesh>
  );
}

type Props = {
  /** Sphere radius in world units */
  radius?: number;
};

export function Sun({ radius = 1.05 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightRef2 = useRef<THREE.DirectionalLight>(null);

  const target = useRef(new THREE.Vector3());
  const current = useRef(new THREE.Vector3());

  // Shared uniforms for the displacement vertex shader. Patched into
  // MeshPhysicalMaterial via onBeforeCompile so we keep PBR + iridescence.
  const shaderUniforms = useRef<{
    uTime: { value: number };
    uDistort: { value: number };
  }>({
    uTime: { value: 0 },
    uDistort: { value: 0.05 },
  });

  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = shaderUniforms.current.uTime;
    shader.uniforms.uDistort = shaderUniforms.current.uDistort;
    matRef.current = shader as unknown as THREE.ShaderMaterial;
    // Replace the standard vertex shader entirely with our displacement one
    shader.vertexShader = vertexShader;
  };

  useFrame((state) => {
    const sun = useSunStore.getState();
    const t = state.clock.elapsedTime;

    // Update vertex displacement uniforms
    shaderUniforms.current.uTime.value = t;
    const targetDistort = sun.ready ? 0.06 : 0.0;
    shaderUniforms.current.uDistort.value +=
      (targetDistort - shaderUniforms.current.uDistort.value) * 0.04;

    if (groupRef.current) {
      // Float — organic + cursor parallax + scroll descent (sunset)
      const floatX = Math.sin(t * 0.2) * 0.06 + Math.cos(t * 0.13) * 0.04;
      const floatY = Math.cos(t * 0.17) * 0.05 + Math.sin(t * 0.11) * 0.03;
      target.current.set(
        sun.pointer.x * 0.55 + floatX,
        0.05 + sun.pointer.y * 0.25 + floatY - sun.scroll * 1.4,
        0
      );
      current.current.lerp(target.current, 0.045);
      groupRef.current.position.copy(current.current);

      // Slow self-rotation so iridescence shifts continuously
      groupRef.current.rotation.y = t * 0.08 + sun.pointer.x * 0.4;
      groupRef.current.rotation.x = -0.12 + sun.pointer.y * 0.18;

      // Breathing scale + intro grow
      const breathe = 1 + Math.sin(t * 0.6) * 0.018;
      const targetScale = sun.scale * breathe * (sun.ready ? 1 : 0.001);
      const cur = groupRef.current.scale.x;
      const next = cur + (targetScale - cur) * 0.06;
      groupRef.current.scale.setScalar(next);
    }

    // Lights — gold key follows the cursor, cool blue rim opposite
    if (lightRef.current) {
      lightRef.current.position.set(
        2.5 + sun.pointer.x * 1.5,
        2.0 - sun.scroll * 2.0 + sun.pointer.y * 0.8,
        2.0
      );
      lightRef.current.intensity = 1.6 * sun.intensity;
    }
    if (lightRef2.current) {
      lightRef2.current.position.set(
        -2.0 - sun.pointer.x * 0.8,
        -1.0,
        1.4
      );
      lightRef2.current.intensity = 0.5 * sun.intensity;
    }
  });

  return (
    <group renderOrder={5}>
      <InnerGlow />

      {/* Lights */}
      <ambientLight intensity={0.18} color="#33445c" />
      <directionalLight ref={lightRef} color="#FFD08A" position={[3, 2, 2]} />
      <directionalLight ref={lightRef2} color="#5A8FD0" position={[-2, -1, 1.4]} />

      {/* Sphere group (position/scale animated) */}
      <group ref={groupRef}>
        <Float floatIntensity={0.25} rotationIntensity={0.08} speed={0.8}>
          <mesh ref={meshRef} renderOrder={6}>
            <icosahedronGeometry args={[radius, 64]} />
            <meshPhysicalMaterial
              color="#E6B45C"
              metalness={1}
              roughness={0.18}
              clearcoat={1}
              clearcoatRoughness={0.12}
              iridescence={1}
              iridescenceIOR={1.85}
              iridescenceThicknessRange={[120, 720]}
              envMapIntensity={1.6}
              onBeforeCompile={onBeforeCompile}
            />
          </mesh>
        </Float>
      </group>

      {/* Environment for reflections — sunset preset gives warm/cool spread */}
      <Environment preset="sunset" />
    </group>
  );
}
