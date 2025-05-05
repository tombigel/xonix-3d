import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload, Stats } from '@react-three/drei';
import * as THREE from 'three';
import Player from './Player'; // Import the simplified Player

const SceneCanvas: React.FC = () => {
  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      shadows // Keep shadows enabled
      camera={{ position: [3, 3, 5], fov: 50 }} // Adjusted camera for simple cube
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
      {/* Removed Simple Test Mesh */}
      {/* <mesh castShadow receiveShadow position={[0, 0.5, 0]}> */}
      {/*   <boxGeometry args={[1, 1, 1]} /> */}
      {/*   <meshStandardMaterial color="orange" /> */}
      {/* </mesh> */}
      {/* Simple Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#cccccc" side={THREE.DoubleSide} />
      </mesh>
      {/* Add Player */}
      <Suspense fallback={null}>
        {' '}
        {/* Keep Suspense for potential future lazy loading */}
        <Player />
      </Suspense>
      {/* Helpers - Keep for now */}
      {/* <Environment /> */} {/* Removed */}
      {/* Removed Physics wrapper */}
      <Stats />
      <OrbitControls />
      <Preload all />
    </Canvas>
  );
};

export default SceneCanvas;
