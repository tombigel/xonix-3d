import { useMemo } from 'react';
import { GameState, CellState } from '../utils/ClassicGameTypes';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from './ThemeContext';
import { getWaveParameters, calculateHeight } from '../utils/waveUtils';

interface Grid3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

export const Grid3D: React.FC<Grid3DProps> = ({ gameState, cellSize = 1 }) => {
  const { scene } = useThree();
  const { currentTheme } = useTheme();

  // Tron-like themes have grid lines
  const showGridLines = currentTheme.name !== 'Standard';

  // Get wave parameters based on current level
  const waveParams = useMemo(() => {
    if (!gameState) return { a: 0.4, b: 0.5, c: 0.4, d: 0.5 }; // Default values
    return getWaveParameters(gameState.level);
  }, [gameState]);

  // Calculate the height at a given x,z coordinate (coordinates in world space)
  const calculateWaveHeight = (x: number, z: number) => {
    return calculateHeight(x, z, waveParams);
  };

  // Memoized grid cells based on the game state
  const gridCells = useMemo(() => {
    if (!gameState) return [];

    const cells: JSX.Element[] = [];
    const { grid, gridCols, gridRows, player } = gameState;
    const { a, b, c, d } = waveParams;

    // Use the theme materials
    const materials = currentTheme.cellMaterials;

    // Cell dimensions
    const geometries: Record<Exclude<CellState, CellState.TRAIL>, THREE.BoxGeometry> = {
      [CellState.UNCAPTURED]: new THREE.BoxGeometry(cellSize, cellSize * 0.1, cellSize),
      [CellState.CAPTURED]: new THREE.BoxGeometry(
        cellSize,
        cellSize * (currentTheme.name === 'Standard' ? 0.5 : 0.4),
        cellSize
      ),
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

        // Apply sinusoidal height function
        const waveHeight = calculateWaveHeight(posX, posZ);

        // Base height based on cell state (Y is up in Three.js)
        const baseHeight = {
          [CellState.UNCAPTURED]: cellSize * 0.05, // Almost flat
          [CellState.CAPTURED]: cellSize * (currentTheme.name === 'Standard' ? 0.25 : 0.2), // Medium height
        }[cellState];

        // Combined height
        const posY = baseHeight + waveHeight;

        cells.push(
          <mesh
            key={`cell-${x}-${y}`}
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

    // Add grid lines for non-standard themes
    if (showGridLines) {
      // Create grid lines that follow the sinusoidal surface
      for (let x = 0; x <= gridCols; x++) {
        const posX = x * cellSize - offsetX;

        // Create a line with multiple points to follow the sinusoidal curve
        const linePoints = [];
        for (let zIdx = 0; zIdx <= gridRows; zIdx += 0.5) {
          const posZ = zIdx * cellSize - offsetZ;
          const posY = calculateWaveHeight(posX, posZ) + 0.05; // Slightly above the surface
          linePoints.push(new THREE.Vector3(posX, posY, posZ));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

        cells.push(
          <primitive
            key={`grid-line-x-${x}`}
            object={new THREE.Line(lineGeometry, currentTheme.gridMaterial)}
          />
        );
      }

      for (let z = 0; z <= gridRows; z++) {
        const posZ = z * cellSize - offsetZ;

        // Create a line with multiple points to follow the sinusoidal curve
        const linePoints = [];
        for (let xIdx = 0; xIdx <= gridCols; xIdx += 0.5) {
          const posX = xIdx * cellSize - offsetX;
          const posY = calculateWaveHeight(posX, posZ) + 0.05; // Slightly above the surface
          linePoints.push(new THREE.Vector3(posX, posY, posZ));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);

        cells.push(
          <primitive
            key={`grid-line-z-${z}`}
            object={new THREE.Line(lineGeometry, currentTheme.gridMaterial)}
          />
        );
      }
    }

    return cells;
  }, [gameState, cellSize, currentTheme, showGridLines, waveParams]);

  // Cleanup on component unmount
  useMemo(() => {
    return () => {
      // Dispose of geometries and materials when component unmounts
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
