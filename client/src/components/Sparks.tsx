import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

// Extend JSX to include Three.js elements
extend({ Points: THREE.Points });

function Sparks() {
  const sparksRef = useRef<THREE.Points>(null);
  const count = 400;

  // تحميل صورة الشرر
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("https://threejs.org/examples/textures/sprites/spark1.png");
  }, []);

  // مواقع الشرر
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      arr[i * 3] = side * 5; // X (يمين/شمال)
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6; // Y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2; // Z
    }
    return arr;
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const material = new THREE.PointsMaterial({
    map: texture,
    color: "#ff9933",
    size: 0.4,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  useFrame(() => {
    if (sparksRef.current) {
      const pos = sparksRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += (Math.random() - 0.5) * 0.05; // حركة جانبية
        pos[i * 3 + 1] += 0.1; // الشرر يطلع لفوق
        if (pos[i * 3 + 1] > 3) {
          pos[i * 3 + 1] = -3; // إعادة الشرر من تحت
        }
      }
      sparksRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return <points ref={sparksRef} geometry={geometry} material={material} />;
}

export default function SparksCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 5]} intensity={1.5} color="#ffaa33" />
      <Sparks />
    </Canvas>
  );
}
