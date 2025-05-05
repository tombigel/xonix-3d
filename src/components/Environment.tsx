import React from 'react';
import * as THREE from 'three';
import { GRID_WIDTH, GRID_HEIGHT } from '@/utils/GridMath';
import Trail from './Trail'; // Import the Trail component
// import useGameStore from '@/stores/gameStore'; // Needed later for captured areas

// Constants for visual appearance
const BORDER_THICKNESS = 0.2;
const BORDER_COLOR = '#4444ff'; // Blueish border
const CAPTURED_AREA_COLOR = '#005500'; // Dark green captured area

// Calculate world dimensions based on grid size
const worldWidth = GRID_WIDTH;
const worldHeight = GRID_HEIGHT;

const Environment: React.FC = () => {
  // const capturedArea = useGameStore((state) => state.capturedArea); // Get captured areas later

  // --- Create Border Geometry ---
  // We create four segments for the border
  const borderSegments = [
    // Top border
    {
      position: [worldWidth / 2, worldHeight - BORDER_THICKNESS / 2, 0],
      size: [worldWidth, BORDER_THICKNESS, 0.1],
    },
    // Bottom border
    {
      position: [worldWidth / 2, BORDER_THICKNESS / 2, 0],
      size: [worldWidth, BORDER_THICKNESS, 0.1],
    },
    // Left border
    {
      position: [BORDER_THICKNESS / 2, worldHeight / 2, 0],
      size: [BORDER_THICKNESS, worldHeight, 0.1],
    },
    // Right border
    {
      position: [worldWidth - BORDER_THICKNESS / 2, worldHeight / 2, 0],
      size: [BORDER_THICKNESS, worldHeight, 0.1],
    },
  ];

  // --- Create Captured Area Geometry (Placeholder) ---
  // This will be dynamically generated based on gameStore.capturedArea later
  const placeholderCapturedGeometry = new THREE.PlaneGeometry(10, 10); // Example size
  const placeholderCapturedMaterial = new THREE.MeshStandardMaterial({
    color: CAPTURED_AREA_COLOR,
    side: THREE.DoubleSide,
  });

  return (
    <group name="environment">
      {/* Render Borders */}
      {borderSegments.map((seg, index) => (
        <mesh key={`border-${index}`} position={new THREE.Vector3(...seg.position)} receiveShadow>
          <boxGeometry args={seg.size as [number, number, number]} />
          <meshStandardMaterial color={BORDER_COLOR} />
        </mesh>
      ))}

      {/* Render Captured Area (Placeholder) */}
      {/* TODO: Replace with dynamic geometry based on capturedArea state */}
      <mesh
        position={[worldWidth / 2, worldHeight / 2, -0.1]} // Position slightly behind border
        geometry={placeholderCapturedGeometry}
        material={placeholderCapturedMaterial}
        receiveShadow
      />

      {/* Render Player Trail */}
      <Trail />

      {/* Placeholder for Enemies - Add later */}
      {/* <Bouncer position={[...]} /> */}
      {/* <Patroller path={[...]} /> */}
    </group>
  );
};

export default Environment;
