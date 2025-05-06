import { useMemo, useEffect, useRef } from 'react';
import { GameState, Enemy } from '../utils/ClassicGameTypes';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { useTheme } from './ThemeContext';
import { getWaveParameters, calculateHeight } from '../utils/waveUtils';

interface Enemies3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

// Define the type for wave parameters inline or import if available and correctly named
interface WaveParamsType {
  a: number;
  b: number;
  c: number;
  d: number;
}

interface Enemy3DPropsInternal {
  enemy: Enemy;
  gridCols: number;
  gridRows: number;
  cellSize: number;
  waveParams: WaveParamsType; // Use the defined type
}

// Individual Enemy component with animation
const Enemy3D: React.FC<Enemy3DPropsInternal> = ({
  enemy,
  gridCols,
  gridRows,
  cellSize,
  waveParams, // waveParams will be of WaveParamsType
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { currentTheme } = useTheme();
  const { a, b, c, d } = waveParams;

  // Check if we're using standard theme
  const isStandardTheme = currentTheme.name === 'Standard';

  // Center the grid
  const offsetX = (gridCols * cellSize) / 2;
  const offsetZ = (gridRows * cellSize) / 2;

  // Calculate target position and rotation including wave height
  const targetPositionAndRotation = useMemo(() => {
    const posX = enemy.x * cellSize - offsetX + cellSize / 2;
    const posZ = enemy.y * cellSize - offsetZ + cellSize / 2;

    const waveHeight = calculateHeight(posX, posZ, waveParams);
    const baseHeight = enemy.type === 'bouncer' ? cellSize * 0.45 : cellSize * 0.65; // Adjusted base heights
    const posY = baseHeight + waveHeight;

    // Calculate rotation based on terrain slope, consistent with Grid3D/Trail3D
    const rotX = Math.atan(-c * d * Math.cos(d * posZ));
    const rotZ = Math.atan(-a * b * Math.cos(b * posX));
    // Enemies typically don't have a facing direction like the player, so Y rotation is 0

    return {
      position: [posX, posY, posZ] as [number, number, number],
      rotation: [rotX, 0, rotZ] as [number, number, number],
    };
  }, [enemy, gridCols, gridRows, cellSize, waveParams, a, b, c, d, offsetX, offsetZ]);

  // Use spring for smooth movement and rotation
  const { position, rotation } = useSpring({
    to: targetPositionAndRotation, // Spring will animate to both position and rotation
    config: { tension: 180, friction: 14, precision: 0.001 }, // Adjusted friction
    // Adding a key that changes when enemy ID or type changes might help reset for new enemies if needed
    // key: `enemy-${enemy.id}-${enemy.type}` (if enemy has a stable id)
  });

  // Set render order to ensure proper collision visibility
  useEffect(() => {
    if (meshRef.current) {
      // Use a high renderOrder to ensure enemies are visible
      meshRef.current.renderOrder = 90; // Just below player's 100
    }
  }, []);

  // Get outline color based on theme
  const outlineColor = isStandardTheme
    ? '#FFFFFF'
    : currentTheme.name === 'Tron'
      ? '#FF5555'
      : currentTheme.enemyMaterial.color;

  // Render different visuals based on enemy type
  return enemy.type === 'bouncer' ? (
    // Bouncer - sphere
    <animated.mesh
      ref={meshRef}
      position={position as unknown as [number, number, number]}
      rotation={rotation as unknown as [number, number, number]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[cellSize * 0.4, 16, 16]} />
      <meshStandardMaterial
        {...(isStandardTheme
          ? {
              color: '#FFFFFF',
              roughness: 0.3,
              metalness: 0.5,
            }
          : {
              color: currentTheme.enemyMaterial.color,
              emissive: currentTheme.enemyMaterial.emissive,
              roughness: currentTheme.enemyMaterial.roughness,
              metalness: currentTheme.enemyMaterial.metalness,
              envMapIntensity: 3.0,
            })}
      />
    </animated.mesh>
  ) : (
    // Patroller - cube with outline
    <animated.mesh
      ref={meshRef}
      position={position as unknown as [number, number, number]}
      rotation={rotation as unknown as [number, number, number]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[cellSize * 0.7, cellSize * 0.3, cellSize * 0.7]} />
      <meshStandardMaterial
        {...(isStandardTheme
          ? {
              color: '#000000',
              roughness: 0.7,
              metalness: 0,
            }
          : {
              color: currentTheme.enemyMaterial.color,
              emissive: currentTheme.enemyMaterial.emissive,
              roughness: currentTheme.enemyMaterial.roughness,
              metalness: currentTheme.enemyMaterial.metalness,
              envMapIntensity: 3.0,
            })}
      />
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(cellSize * 0.75, cellSize * 0.35, cellSize * 0.75)]}
        />
        <lineBasicMaterial color={outlineColor} linewidth={2} />
      </lineSegments>
    </animated.mesh>
  );
};

export const Enemies3D: React.FC<Enemies3DProps> = ({ gameState, cellSize = 1 }) => {
  // Get wave parameters based on current level
  const waveParams = useMemo(() => {
    if (!gameState) return { a: 0, b: 0, c: 0, d: 0 }; // Default to flat
    return getWaveParameters(gameState.level);
  }, [gameState]);

  // Memoize enemy components based on the game state
  const enemyComponents = useMemo(() => {
    if (!gameState) return [];

    const { enemies, gridCols, gridRows } = gameState;

    return enemies.map((enemy, index) => (
      <Enemy3D
        key={`enemy-${index}-${enemy.x}-${enemy.y}`}
        enemy={enemy}
        gridCols={gridCols}
        gridRows={gridRows}
        cellSize={cellSize}
        waveParams={waveParams}
      />
    ));
  }, [gameState, cellSize, waveParams]);

  return <group>{enemyComponents}</group>;
};
