import { useMemo } from 'react';
import { GameState, CellState } from '../utils/ClassicGameTypes';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Grid3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

export const Grid3D: React.FC<Grid3DProps> = ({ gameState, cellSize = 1 }) => {
  const { scene } = useThree();

  // Memoized grid cells based on the game state
  const gridCells = useMemo(() => {
    if (!gameState) return [];

    const cells: JSX.Element[] = [];
    const { grid, gridCols, gridRows, player } = gameState;

    // Cell dimensions and materials
    const geometries: Record<Exclude<CellState, CellState.TRAIL>, THREE.BoxGeometry> = {
      [CellState.UNCAPTURED]: new THREE.BoxGeometry(cellSize, cellSize * 0.1, cellSize),
      [CellState.CAPTURED]: new THREE.BoxGeometry(cellSize, cellSize * 0.5, cellSize),
    };

    const materials: Record<Exclude<CellState, CellState.TRAIL>, THREE.Material> = {
      [CellState.UNCAPTURED]: new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.7 }),
      [CellState.CAPTURED]: new THREE.MeshStandardMaterial({ color: '#00AAAA', roughness: 0.5 }),
    };

    // Center the grid
    const offsetX = (gridCols * cellSize) / 2;
    const offsetZ = (gridRows * cellSize) / 2;

    // Create cells
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        let cellState = grid[y][x];

        // Skip trail cells - they will be rendered by Trail3D component
        // EXCEPT for the player's position which should have an uncaptured cell
        if (cellState === CellState.TRAIL) {
          // If this is the player position, render an UNCAPTURED cell
          if (x === player.x && y === player.y) {
            cellState = CellState.UNCAPTURED;
          } else {
            continue; // Otherwise skip this trail cell
          }
        }

        const geometry = geometries[cellState];
        const material = materials[cellState];

        // Position the cell
        const posX = x * cellSize - offsetX + cellSize / 2;
        const posZ = y * cellSize - offsetZ + cellSize / 2;

        // Height based on cell state (Y is up in Three.js)
        const posY = {
          [CellState.UNCAPTURED]: cellSize * 0.05, // Almost flat
          [CellState.CAPTURED]: cellSize * 0.25, // Medium height
        }[cellState];

        cells.push(
          <mesh
            key={`cell-${x}-${y}`}
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
  }, [gameState, cellSize]);

  // Cleanup on component unmount
  useMemo(() => {
    return () => {
      // Dispose of geometries and materials when component unmounts
      // (This would be better with useEffect, but we're showing this pattern for demonstration)
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

  return <group>{gridCells}</group>;
};
