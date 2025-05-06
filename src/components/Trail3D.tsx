import { useMemo } from 'react';
import { GameState, CellState } from '../utils/ClassicGameTypes';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from './ThemeContext';
import { getWaveParameters, calculateHeight } from '../utils/waveUtils';

interface Trail3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

export const Trail3D: React.FC<Trail3DProps> = ({ gameState, cellSize = 1 }) => {
  const { scene } = useThree();
  const { currentTheme } = useTheme();

  // Check if we're using standard theme
  const isStandardTheme = currentTheme.name === 'Standard';

  // Get wave parameters based on current level
  const waveParams = useMemo(() => {
    if (!gameState) return { a: 0.4, b: 0.5, c: 0.4, d: 0.5 }; // Default values
    return getWaveParameters(gameState.level);
  }, [gameState]);

  // Calculate the height at a given x,z coordinate
  const calculateWaveHeight = (x: number, z: number) => {
    return calculateHeight(x, z, waveParams);
  };

  // Memoized trail cells based on the game state
  const trailCells = useMemo(() => {
    if (!gameState) return [];

    const cells: JSX.Element[] = [];
    const { grid, gridCols, gridRows, player } = gameState;
    const { a, b, c, d } = waveParams;

    // Cell dimensions and materials
    const geometry = new THREE.BoxGeometry(
      cellSize,
      cellSize * (isStandardTheme ? 0.3 : 0.2),
      cellSize
    );
    const material = currentTheme.cellMaterials[CellState.TRAIL];

    // Center the grid
    const offsetX = (gridCols * cellSize) / 2;
    const offsetZ = (gridRows * cellSize) / 2;

    // Create trail cells
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        // Only render trail cells
        if (grid[y][x] !== CellState.TRAIL) continue;

        // Skip rendering trail at the player's current position
        // This ensures there's no visual discrepancy and the path ends at the player
        if (x === player.x && y === player.y) continue;

        // Position the cell
        const posX = x * cellSize - offsetX + cellSize / 2;
        const posZ = y * cellSize - offsetZ + cellSize / 2;

        // Apply sinusoidal height function
        const waveHeight = calculateWaveHeight(posX, posZ);

        // Base height for trail cells
        const baseHeight = cellSize * (isStandardTheme ? 0.15 : 0.1); // Slightly raised

        // Combined height
        const posY = baseHeight + waveHeight;

        cells.push(
          <mesh
            key={`trail-${x}-${y}`}
            geometry={geometry}
            material={material}
            position={[posX, posY, posZ]}
            // Rotate the cell to match the gradient of the sinusoidal surface
            rotation={[
              Math.atan(-a * b * Math.cos(b * posX)), // Rotation around Z axis (negative X gradient)
              0,
              Math.atan(-c * d * Math.cos(d * posZ)), // Rotation around X axis (negative Z gradient)
            ]}
            receiveShadow
            castShadow
          />
        );
      }
    }

    return cells;
  }, [gameState, cellSize, currentTheme, isStandardTheme, waveParams]);

  // Cleanup on unmount
  useMemo(() => {
    return () => {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material instanceof THREE.Material) object.material.dispose();
          else if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          }
        }
      });
    };
  }, [scene]);

  return <group>{trailCells}</group>;
};
