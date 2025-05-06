import { useMemo, useRef, useEffect } from 'react';
import { GameState } from '../utils/ClassicGameTypes';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { useTheme } from './ThemeContext';
import { getWaveParameters, calculateHeight } from '../utils/waveUtils';

interface Player3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

export const Player3D: React.FC<Player3DProps> = ({ gameState, cellSize = 1 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const prevPlayerCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { currentTheme } = useTheme();
  const intendedYAngle = useRef(0); // Store the intended Y angle for direction

  const waveParams = useMemo(() => {
    if (!gameState) return { a: 0, b: 0, c: 0, d: 0 }; // Default to flat if no game state
    return getWaveParameters(gameState.level);
  }, [gameState]);

  // Calculate player target position AND rotation including wave height and direction
  const targetPositionAndRotation = useMemo(() => {
    if (!gameState)
      return {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, intendedYAngle.current, 0] as [number, number, number], // Use current intendedYAngle
      };

    const { player, gridCols, gridRows } = gameState;
    const { a, b, c, d } = waveParams;

    // Update intendedYAngle based on player movement
    if (player.dx !== 0 || player.dy !== 0) {
      if (player.dx === 1)
        intendedYAngle.current = 0; // Right
      else if (player.dx === -1)
        intendedYAngle.current = Math.PI; // Left
      else if (player.dy === 1)
        intendedYAngle.current = Math.PI / 2; // Down (positive Z)
      else if (player.dy === -1) intendedYAngle.current = -Math.PI / 2; // Up (negative Z)
    }

    // Center the grid
    const offsetX = (gridCols * cellSize) / 2;
    const offsetZ = (gridRows * cellSize) / 2;

    // Position the player (Y is up in Three.js)
    const posX = player.x * cellSize - offsetX + cellSize / 2;
    const posZ = player.y * cellSize - offsetZ + cellSize / 2;

    // Calculate height based on wave function
    const waveHeight = calculateHeight(posX, posZ, waveParams);
    const playerBaseY = cellSize * 0.65; // Adjusted base Y for better visibility on waves
    const posY = playerBaseY + waveHeight;

    // Store player coordinates for direction tracking
    prevPlayerCoords.current = { x: player.x, y: player.y };

    // Calculate rotation based on terrain slope, consistent with Grid3D/Trail3D
    // rotX is rotation around X-axis (pitch), based on slope in Z direction (params c, d)
    // rotZ is rotation around Z-axis (roll), based on slope in X direction (params a, b)
    const rotX = Math.atan(-c * d * Math.cos(d * posZ));
    const rotZ = Math.atan(-a * b * Math.cos(b * posX));

    return {
      position: [posX, posY, posZ] as [number, number, number],
      rotation: [rotX, intendedYAngle.current, rotZ] as [number, number, number],
    };
  }, [gameState, cellSize, waveParams]);

  // Create spring animation for smooth movement and rotation
  const [springProps /*, springApi */] = useSpring(
    () => ({
      // Spring will animate from current values to the new 'to' values
      to: {
        position: targetPositionAndRotation.position,
        rotation: targetPositionAndRotation.rotation, // This now includes the target Y-axis rotation
      },
      config: {
        tension: 180, // Higher tension for more responsive movement
        friction: 16, // Balanced friction for smooth stops
        precision: 0.001, // Higher precision for smoother transitions
        mass: 1.2, // Slightly higher mass for more inertia
      },
      // Reset spring if player coordinates change instantly (e.g. new level, game reset)
      reset:
        prevPlayerCoords.current.x !== gameState?.player.x ||
        prevPlayerCoords.current.y !== gameState?.player.y,
    }),
    [targetPositionAndRotation]
  );

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

  // Check if we're using a custom theme
  const isStandardTheme = currentTheme.name === 'Standard';

  return (
    <animated.mesh
      ref={ref}
      position={springProps.position as unknown as [number, number, number]}
      rotation={springProps.rotation as unknown as [number, number, number]} // Drive rotation directly from spring
      castShadow
      receiveShadow
    >
      {/* Player cube */}
      <boxGeometry args={[cellSize * 1.0, cellSize * 0.3, cellSize * 1.0]} />
      <meshStandardMaterial
        {...(isStandardTheme
          ? {
              color: '#FFFFFF',
              roughness: 0.3,
              emissive: '#333333',
              transparent: true,
              opacity: 0.9,
            }
          : {
              color: currentTheme.playerMaterial.color,
              emissive: currentTheme.playerMaterial.emissive,
              roughness: currentTheme.playerMaterial.roughness,
              metalness: currentTheme.playerMaterial.metalness,
              envMapIntensity: 3.0,
            })}
      />

      {/* Add an inner colored element */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[cellSize * 0.5, cellSize * 0.1, cellSize * 0.5]} />
        <meshStandardMaterial
          color={isStandardTheme ? '#00FFFF' : '#FFFF00'}
          emissive={isStandardTheme ? '#00FFFF' : '#FFAA00'}
          emissiveIntensity={isStandardTheme ? 0.8 : 1.2}
        />
      </mesh>
    </animated.mesh>
  );
};
