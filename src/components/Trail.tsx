import React from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import useGameStore from '@/stores/gameStore';
import { gridToWorld, GridPoint } from '@/utils/GridMath';

const TRAIL_COLOR = '#ffffff';
const TRAIL_WIDTH = 2;

const Trail: React.FC = () => {
  const trailPoints = useGameStore((state) => state.currentTrail);

  // Log the points received from the store
  console.log('Trail component rendering with points:', JSON.stringify(trailPoints));

  // Convert grid points to world coordinates (Vector3)
  // Ensure Z is slightly above the main plane to avoid z-fighting
  const worldPoints = trailPoints.map((p: GridPoint) => {
    const worldPos = gridToWorld(p);
    return new THREE.Vector3(worldPos.x, worldPos.y, 0.1); // Elevate slightly
  });

  // Don't render if less than 2 points
  if (worldPoints.length < 2) {
    console.log('Trail component: Not enough points to render.');
    return null;
  }

  return (
    <Line
      points={worldPoints}
      color={TRAIL_COLOR}
      lineWidth={TRAIL_WIDTH}
      dashed={false} // Solid line for the trail
    />
  );
};

export default Trail;
