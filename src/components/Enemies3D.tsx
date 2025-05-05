import { useMemo } from 'react';
import { GameState, Enemy } from '../utils/ClassicGameTypes';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

interface Enemies3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

// Individual Enemy component with animation
const Enemy3D: React.FC<{
  enemy: Enemy;
  gridCols: number;
  gridRows: number;
  cellSize: number;
}> = ({ enemy, gridCols, gridRows, cellSize }) => {
  // Center the grid
  const offsetX = (gridCols * cellSize) / 2;
  const offsetZ = (gridRows * cellSize) / 2;

  // Position the enemy (Y is up in Three.js)
  const initialPosition: [number, number, number] = [
    enemy.x * cellSize - offsetX + cellSize / 2,
    cellSize * (enemy.type === 'bouncer' ? 0.25 : 0.4), // Height above grid
    enemy.y * cellSize - offsetZ + cellSize / 2,
  ];

  // Use spring for smooth movement
  const { position } = useSpring({
    position: initialPosition,
    config: { tension: 180, friction: 12 },
  });

  // Render different visuals based on enemy type
  return enemy.type === 'bouncer' ? (
    // Bouncer - sphere
    <animated.mesh
      // @ts-expect-error - react-spring types are not fully compatible with r3f
      position={position}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[cellSize * 0.4, 16, 16]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.5} />
    </animated.mesh>
  ) : (
    // Patroller - cube with outline
    <animated.mesh
      // @ts-expect-error - react-spring types are not fully compatible with r3f
      position={position}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[cellSize * 0.7, cellSize * 0.3, cellSize * 0.7]} />
      <meshStandardMaterial color="#000000" roughness={0.7} metalness={0} />
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(cellSize * 0.75, cellSize * 0.35, cellSize * 0.75)]}
        />
        <lineBasicMaterial color="#FFFFFF" linewidth={2} />
      </lineSegments>
    </animated.mesh>
  );
};

export const Enemies3D: React.FC<Enemies3DProps> = ({ gameState, cellSize = 1 }) => {
  // Memoize enemy components based on the game state
  const enemyComponents = useMemo(() => {
    if (!gameState) return [];

    const { enemies, gridCols, gridRows } = gameState;

    return enemies.map((enemy, index) => (
      <Enemy3D
        key={`enemy-${index}`}
        enemy={enemy}
        gridCols={gridCols}
        gridRows={gridRows}
        cellSize={cellSize}
      />
    ));
  }, [gameState, cellSize]);

  return <group>{enemyComponents}</group>;
};
