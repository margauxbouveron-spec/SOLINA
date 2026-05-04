"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, OrbitControls } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useSunStore } from "../sun/useSunStore";

type Props = {
  /** Hex color of the primary material. Use product.accent. */
  accent?: string;
  /** Visual silhouette of the piece (mock — real assets would be GLTF) */
  shape?: "ring" | "pendant" | "earring" | "bangle";
};

function Jewel({ accent = "#D4AF37", shape = "ring" }: Props) {
  const group = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const sun = useSunStore.getState();
    const t = state.clock.elapsedTime;
    // Idle rotation + subtle pointer parallax
    group.current.rotation.y = t * 0.18 + sun.pointer.x * 0.4;
    group.current.rotation.x = -0.2 + sun.pointer.y * 0.2;
  });

  const goldMat = (
    <meshPhysicalMaterial
      color={accent}
      metalness={1}
      roughness={0.18}
      reflectivity={1}
      clearcoat={0.5}
      clearcoatRoughness={0.2}
      iridescence={0.15}
      iridescenceIOR={1.6}
      envMapIntensity={1.4}
    />
  );

  return (
    <group ref={group}>
      <Float floatIntensity={0.4} rotationIntensity={0.2} speed={1.2}>
        {shape === "ring" && (
          <mesh ref={meshRef} castShadow receiveShadow>
            <torusGeometry args={[1, 0.22, 64, 200]} />
            {goldMat}
          </mesh>
        )}
        {shape === "pendant" && (
          <group>
            <mesh position={[0, 0.6, 0]} castShadow>
              <torusGeometry args={[0.18, 0.04, 32, 100]} />
              {goldMat}
            </mesh>
            <mesh position={[0, -0.2, 0]} castShadow>
              <sphereGeometry args={[0.55, 64, 64]} />
              {goldMat}
            </mesh>
          </group>
        )}
        {shape === "earring" && (
          <group>
            <mesh position={[-0.6, 0, 0]} castShadow>
              <torusGeometry args={[0.45, 0.06, 32, 120]} />
              {goldMat}
            </mesh>
            <mesh position={[0.6, 0, 0]} castShadow>
              <torusGeometry args={[0.45, 0.06, 32, 120]} />
              {goldMat}
            </mesh>
          </group>
        )}
        {shape === "bangle" && (
          <mesh ref={meshRef} castShadow rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.08, 64, 200]} />
            {goldMat}
          </mesh>
        )}
      </Float>
    </group>
  );
}

function SunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const sun = useSunStore.getState();
    if (!lightRef.current) return;
    lightRef.current.position.set(
      sun.pointer.x * 4 + 2,
      3 - sun.scroll * 4,
      4
    );
    lightRef.current.intensity = 1.2 * sun.intensity;
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[3, 4, 4]}
      castShadow
      color="#FFE9B0"
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
  );
}

export function ProductViewer({ accent, shape }: Props) {
  return (
    <div className="relative h-[80vh] w-full">
      <Canvas
        camera={{ position: [0, 0.3, 4], fov: 38 }}
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      >
        <color attach="background" args={["#070D17"]} />
        <ambientLight intensity={0.45} color="#FFF1D0" />
        <SunLight />
        <Suspense fallback={null}>
          <Jewel accent={accent} shape={shape} />
          <Environment preset="sunset" />
        </Suspense>
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.35}
          scale={6}
          blur={2.2}
          far={4}
          color="#1A1814"
        />
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={2.4}
          maxDistance={6}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
        />
      </Canvas>

      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.42em] text-cream/40">
        glissez pour explorer
      </div>
    </div>
  );
}
