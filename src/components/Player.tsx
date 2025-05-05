import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useControls from '@/hooks/useControls';
// Removed imports for Rapier, gameStore, GridMath for now

const PLAYER_SPEED = 5; // Keep speed constant

const Player: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null); // Ref for the visual mesh
  const controls = useControls();

  // Initialize position (optional, can start at 0,0,0)
  useEffect(() => {
    if (meshRef.current) {
      // Start slightly above the ground plane
      meshRef.current.position.set(0, 0.5, 0);
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // --- Determine Movement Direction based on Controls ---
    const moveDirection = new THREE.Vector3(0, 0, 0);
    // Simple movement on XZ plane for now (typical 3D movement)
    if (controls.forward) moveDirection.z -= 1;
    if (controls.backward) moveDirection.z += 1;
    if (controls.left) moveDirection.x -= 1;
    if (controls.right) moveDirection.x += 1;

    moveDirection.normalize().multiplyScalar(PLAYER_SPEED * delta);

    // Directly update position
    meshRef.current.position.add(moveDirection);

    // You could add simple boundary checks here later if needed
    // e.g., meshRef.current.position.x = Math.max(-5, Math.min(5, meshRef.current.position.x));
  });

  // Return only the visual representation
  return (
    <mesh ref={meshRef} castShadow position={[0, 0.5, 0]} /* Initial position */>
      <boxGeometry args={[0.8, 0.8, 0.8]} /> {/* Make it a cube */}
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
};

export default Player;
