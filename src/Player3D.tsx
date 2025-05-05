import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GameState } from './utils/ClassicGameTypes';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

interface Player3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

export const Player3D: React.FC<Player3DProps> = ({ gameState, cellSize = 1 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const prevPosition = useRef<[number, number, number]>([0, 0, 0]);

  // Calculate player position based on game state
  const position = useMemo(() => {
    if (!gameState) return [0, 0, 0];

    const { player, gridCols, gridRows } = gameState;

    // Center the grid
    const offsetX = (gridCols * cellSize) / 2;
    const offsetZ = (gridRows * cellSize) / 2;

    // Position the player (Y is up in Three.js)
    const posX = player.x * cellSize - offsetX + cellSize / 2;
    const posY = cellSize * 0.3; // Height above the grid
    const posZ = player.y * cellSize - offsetZ + cellSize / 2;

    prevPosition.current = [posX, posY, posZ];
    return [posX, posY, posZ] as [number, number, number];
  }, [gameState, cellSize]);

  // Create spring animation for smooth movement
  const springs = useSpring({
    position: position,
    config: { tension: 120, friction: 14 },
  });

  // Handle player rotation based on movement direction
  useFrame(() => {
    if (!ref.current || !gameState) return;

    const { player } = gameState;

    // Rotate player based on movement direction
    if (player.dx !== 0 || player.dy !== 0) {
      // Calculate angle based on direction
      let angle = 0;
      if (player.dx === 1) angle = 0;
      else if (player.dx === -1) angle = Math.PI;
      else if (player.dy === 1) angle = Math.PI / 2;
      else if (player.dy === -1) angle = -Math.PI / 2;

      // Apply rotation smoothly
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, angle, 0.2);
    }
  });

  return (
    <animated.mesh ref={ref} position={springs.position} castShadow receiveShadow>
      {/* Player cube with inset design */}
      <boxGeometry args={[cellSize * 0.8, cellSize * 0.2, cellSize * 0.8]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.3} />

      {/* Add an inner colored element */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[cellSize * 0.4, cellSize * 0.05, cellSize * 0.4]} />
        <meshStandardMaterial color="#00FFFF" emissive="#007777" />
      </mesh>
    </animated.mesh>
  );
};
