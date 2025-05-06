import { useMemo } from 'react';
import { GameState, CellState } from '../utils/ClassicGameTypes';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from './ThemeContext';

interface Trail3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

export const Trail3D: React.FC<Trail3DProps> = ({ gameState, cellSize = 1 }) => {
  const { scene } = useThree();
  const { currentTheme } = useTheme();

  // Check if we're using standard theme
  const isStandardTheme = currentTheme.name === 'Standard';

  // Memoized trail cells based on the game state
  const trailCells = useMemo(() => {
    if (!gameState) return [];

    const cells: JSX.Element[] = [];
    const { grid, gridCols, gridRows, player } = gameState;

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

        // Height for trail cells
        const posY = cellSize * (isStandardTheme ? 0.15 : 0.1); // Slightly raised

        cells.push(
          <mesh
            key={`trail-${x}-${y}`}
            geometry={geometry}
            material={material}
            position={[posX, posY, posZ]}
            receiveShadow
            castShadow
          />
        );
      }
    }

    return cells;
  }, [gameState, cellSize, currentTheme, isStandardTheme]);

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
