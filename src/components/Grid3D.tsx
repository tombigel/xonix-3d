import { useMemo, useRef, useEffect } from 'react';
import { GameState, CellState, TrailSegment } from '../utils/ClassicGameTypes';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Grid3DProps {
  gameState: GameState | null;
  cellSize?: number;
}

// Component that renders the player's trail as a continuous path
const TrailRenderer: React.FC<{
  gameState: GameState;
  cellSize: number;
  gridCols: number;
  gridRows: number;
}> = ({ gameState, cellSize, gridCols, gridRows }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastTrailLength = useRef<number>(0);
  const material = useRef<THREE.MeshStandardMaterial>(
    new THREE.MeshStandardMaterial({
      color: '#FF00FF',
      roughness: 0.3,
      emissive: '#550055',
      transparent: true,
    })
  );

  // Center offset for grid
  const offsetX = (gridCols * cellSize) / 2;
  const offsetZ = (gridRows * cellSize) / 2;

  // Create a smooth continuous trail when the game state updates
  useEffect(() => {
    if (!gameState.isDrawing || !gameState.currentTrail.length) return;

    // If trail length hasn't changed, don't rebuild the geometry
    if (lastTrailLength.current === gameState.currentTrail.length && meshRef.current) return;
    lastTrailLength.current = gameState.currentTrail.length;

    // Create a trail geometry
    const trailGeometry = createTrailGeometry(
      gameState.currentTrail,
      cellSize,
      offsetX,
      offsetZ,
      gameState.player
    );

    // Update the mesh with new geometry
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = trailGeometry;
    }
  }, [gameState, cellSize, gridCols, gridRows]);

  // Reset geometry when trail is cleared
  useEffect(() => {
    if (!gameState.isDrawing && lastTrailLength.current > 0) {
      lastTrailLength.current = 0;
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        meshRef.current.geometry = new THREE.BufferGeometry();
      }
    }
  }, [gameState.isDrawing]);

  // Create trail geometry from trail segments
  const createTrailGeometry = (
    trail: TrailSegment[],
    cellSize: number,
    offsetX: number,
    offsetZ: number,
    player: { x: number; y: number; dx: number; dy: number }
  ) => {
    // No trail to render
    if (trail.length === 0) return new THREE.BufferGeometry();

    // Create a shape for the trail
    const shape = new THREE.Shape();

    // Start path at the first trail point
    const startX = trail[0].x * cellSize - offsetX;
    const startZ = trail[0].y * cellSize - offsetZ;
    shape.moveTo(startX, startZ);

    // Add each trail segment to the path
    for (let i = 1; i < trail.length; i++) {
      const x = trail[i].x * cellSize - offsetX;
      const z = trail[i].y * cellSize - offsetZ;
      shape.lineTo(x, z);
    }

    // Add the current player position to complete the trail
    const playerX = player.x * cellSize - offsetX;
    const playerZ = player.y * cellSize - offsetZ;
    shape.lineTo(playerX, playerZ);

    // Create an extrusion with width equal to cell size
    const extrudeSettings = {
      steps: 1,
      depth: cellSize * 0.3, // Height of trail
      bevelEnabled: false,
    };

    // Create geometry from the extruded shape
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Rotate to lie flat on XZ plane
    geometry.rotateX(-Math.PI / 2);

    // Center vertically
    geometry.translate(0, cellSize * 0.15, 0);

    return geometry;
  };

  return (
    <mesh ref={meshRef} material={material.current} receiveShadow castShadow renderOrder={10}>
      {/* Empty geometry initially, will be replaced in effect */}
      <bufferGeometry />
    </mesh>
  );
};

export const Grid3D: React.FC<Grid3DProps> = ({ gameState, cellSize = 1 }) => {
  const { scene } = useThree();

  // Memoized grid cells based on the game state
  const gridCells = useMemo(() => {
    if (!gameState) return [];

    const cells: JSX.Element[] = [];
    const { grid, gridCols, gridRows } = gameState;

    // Cell dimensions and materials
    const geometries: Record<CellState, THREE.BoxGeometry> = {
      [CellState.UNCAPTURED]: new THREE.BoxGeometry(cellSize, cellSize * 0.1, cellSize),
      [CellState.CAPTURED]: new THREE.BoxGeometry(cellSize, cellSize * 0.5, cellSize),
      [CellState.TRAIL]: new THREE.BoxGeometry(cellSize, cellSize * 0.01, cellSize), // Make trail cells nearly invisible
    };

    const materials: Record<CellState, THREE.Material> = {
      [CellState.UNCAPTURED]: new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.7 }),
      [CellState.CAPTURED]: new THREE.MeshStandardMaterial({ color: '#00AAAA', roughness: 0.5 }),
      [CellState.TRAIL]: new THREE.MeshStandardMaterial({
        color: '#FF00FF',
        roughness: 0.3,
        emissive: '#550055',
        transparent: true,
        opacity: 0, // Make the cells fully transparent - we'll render the trail separately
      }),
    };

    // Center the grid
    const offsetX = (gridCols * cellSize) / 2;
    const offsetZ = (gridRows * cellSize) / 2;

    // Create cells
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const cellState = grid[y][x];

        // Skip rendering trail cells - we'll render them with TrailRenderer
        if (cellState === CellState.TRAIL) continue;

        const geometry = geometries[cellState];
        const material = materials[cellState];

        // Position the cell
        const posX = x * cellSize - offsetX + cellSize / 2;
        const posZ = y * cellSize - offsetZ + cellSize / 2;

        // Height based on cell state (Y is up in Three.js)
        const posY = {
          [CellState.UNCAPTURED]: cellSize * 0.05, // Almost flat
          [CellState.CAPTURED]: cellSize * 0.25, // Medium height
          [CellState.TRAIL]: cellSize * 0.15, // Slightly raised
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
  useEffect(() => {
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

  return (
    <group>
      {gridCells}
      {gameState && gameState.isDrawing && (
        <TrailRenderer
          gameState={gameState}
          cellSize={cellSize}
          gridCols={gameState.gridCols}
          gridRows={gameState.gridRows}
        />
      )}
    </group>
  );
};
