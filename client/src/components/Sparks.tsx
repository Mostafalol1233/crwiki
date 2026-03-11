import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

const Sparks = ({ count = 200 }) => {
  const mesh = useRef<any>(null);
  const light = useRef<any>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

      temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;

    particles.forEach((particle, i) => {
      let { factor, speed, x, y, z } = particle;

      const t = (particle.time += speed);

      dummy.position.set(
        x + Math.cos(t) * (factor + Math.sin(t * 1) * factor),
        y + Math.sin(t) * (factor + Math.cos(t * 2) * factor),
        z + Math.cos(t) * (factor + Math.sin(t * 3) * factor)
      );

      const s = Math.cos(t);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();

      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <pointLight ref={light} distance={40} intensity={8} color="orange" />
      <instancedMesh ref={mesh as any} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </instancedMesh>
    </>
  );
};

const SparksCanvas = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ fov: 100, position: [0, 0, 30] }}>
        <ambientLight intensity={0.5} />
        <Sparks />
      </Canvas>
    </div>
  );
};

export default SparksCanvas;