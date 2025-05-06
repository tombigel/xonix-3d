import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { GameState } from '../utils/ClassicGameTypes';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

interface Player3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

export const Player3D: React.FC<Player3DProps> = ({ gameState, cellSize = 1 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const prevPosition = useRef<[number, number, number]>([0, 0, 0]);
  const prevPlayerCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate player position based on game state
  const position = useMemo(() => {
    if (!gameState) return [0, 0, 0];

    const { player, gridCols, gridRows } = gameState;

    // Center the grid
    const offsetX = (gridCols * cellSize) / 2;
    const offsetZ = (gridRows * cellSize) / 2;

    // Position the player (Y is up in Three.js)
    const posX = player.x * cellSize - offsetX + cellSize / 2;
    const posY = cellSize * 0.5; // Moderate height - visible but not too high
    const posZ = player.y * cellSize - offsetZ + cellSize / 2;

    // Store previous position
    prevPosition.current = [posX, posY, posZ];

    // Store player coordinates for direction tracking
    prevPlayerCoords.current = { x: player.x, y: player.y };

    return [posX, posY, posZ] as [number, number, number];
  }, [gameState, cellSize]);

  // Create spring animation for smooth movement with improved config
  const { position: springPosition } = useSpring({
    position,
    config: {
      tension: 180, // Higher tension for more responsive movement
      friction: 16, // Balanced friction for smooth stops
      precision: 0.001, // Higher precision for smoother transitions
      mass: 1.2, // Slightly higher mass for more inertia
    },
  });

  // Set render order and material properties for visibility
  useEffect(() => {
    if (ref.current) {
      // Set high renderOrder to ensure the player is visible on top of other elements
      ref.current.renderOrder = 100;

      ref.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (child.material instanceof THREE.Material) {
            // Ensure visibility by disabling depth testing
            child.material.depthTest = false;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, []);

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

      // Apply rotation smoothly with increased interpolation factor for more responsive rotation
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, angle, 0.3);
    }
  });

  return (
    <animated.mesh
      ref={ref}
      position={springPosition as unknown as [number, number, number]}
      castShadow
      receiveShadow
    >
      {/* Player cube with inset design - enhanced for visibility */}
      <boxGeometry args={[cellSize * 1.0, cellSize * 0.3, cellSize * 1.0]} />
      <meshStandardMaterial
        color="#FFFFFF"
        roughness={0.3}
        emissive="#333333"
        transparent={true}
        opacity={0.9}
      />

      {/* Add an inner colored element with enhanced brightness */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[cellSize * 0.5, cellSize * 0.1, cellSize * 0.5]} />
        <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={0.8} />
      </mesh>
    </animated.mesh>
  );
};
