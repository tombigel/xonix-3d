import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Physics, RigidBody } from '@react-three/rapier';
import Player from './Player';

// Main Scene Canvas
const SceneCanvas: React.FC = () => {
  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      shadows
      camera={{ position: [3, 3, 5], fov: 50 }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />

      {/* Physics World */}
      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]}>
          {/* Ground Plane */}
          <RigidBody type="fixed" colliders="cuboid" friction={1.0}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[10, 10]} />
              <meshStandardMaterial color="#cccccc" side={THREE.DoubleSide} />
            </mesh>
          </RigidBody>

          {/* Player Component (contains its own RigidBody now) */}
          <Player />
        </Physics>
      </Suspense>

      {/* Helpers */}
      <Stats />
      <OrbitControls />
      <Preload all />
    </Canvas>
  );
};

export default SceneCanvas;
