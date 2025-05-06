import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import { useClassicGameLogic } from '../hooks/useClassicGameLogic';
import { Grid3D } from './Grid3D';
import { Player3D } from './Player3D';
import { Enemies3D } from './Enemies3D';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

interface Scene3DProps {
  initialLevel?: number;
  debug?: boolean;
}

export const Scene3D: React.FC<Scene3DProps> = ({ initialLevel = 1, debug = false }) => {
  const { gameState, isInitialized, handleInput, startNextLevel, restartGame, getConstants } =
    useClassicGameLogic(initialLevel);
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [cellSize, setCellSize] = useState(1);

  // Calculate appropriate cell size based on grid dimensions
  useEffect(() => {
    if (gameState) {
      const constants = getConstants();
      const scaleFactor = 0.8;

      // If we have constants from the classic game, use them
      if (constants?.CELL_SIZE) {
        setCellSize((constants.CELL_SIZE / 10) * scaleFactor); // Scale down to 3D units
      } else {
        // Otherwise calculate based on grid size
        const maxDimension = Math.max(gameState.gridCols, gameState.gridRows);
        // Determine cell size inversely proportional to grid size
        const calculatedSize = (40 / maxDimension) * scaleFactor;
        setCellSize(calculatedSize);
      }
    }
  }, [gameState, getConstants]);

  // Set camera to top-down view on init
  useEffect(() => {
    if (cameraRef.current && orbitControlsRef.current) {
      // Position camera directly above the scene
      setTimeout(() => {
        const controls = orbitControlsRef.current;
        if (controls && typeof controls.setPolarAngle === 'function') {
          // Set to top-down view (polar angle of 0 is top-down)
          controls.setPolarAngle(0.01); // Almost 0, but slightly offset to avoid gimbal lock
          controls.setAzimuthalAngle(0);
          controls.update();
        }
      }, 100);
    }
  }, [cameraRef, orbitControlsRef, isInitialized]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isInitialized || !gameState) return;

      // Game controls
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault();
          handleInput(event.key);
          break;
        case 'r':
        case 'R':
          if (gameState.gameOver) {
            restartGame();
          }
          break;
        case ' ':
        case 'Enter':
          if (gameState.levelComplete) {
            startNextLevel();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, isInitialized, handleInput, startNextLevel, restartGame]);

  if (!isInitialized) {
    return <div>Loading game...</div>;
  }

  // Calculate camera height based on grid size
  const calculateCameraHeight = () => {
    if (!gameState) return 40;

    const maxDimension = Math.max(gameState.gridCols, gameState.gridRows);
    return maxDimension * cellSize * 1.2; // Adjust multiplier as needed
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[0, calculateCameraHeight(), 0]}
          fov={45}
          up={[0, 1, 0]} // Standard up vector for free rotation
        />

        {/* Debug helpers */}
        {debug && (
          <>
            <axesHelper args={[5]} />
            <gridHelper args={[50, 50]} />
            <Stats />
          </>
        )}

        {/* Environment and lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[0, calculateCameraHeight() * 0.8, 0]}
          intensity={1}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Environment preset="city" />

        {/* Game elements */}
        <group position={[0, 0, 0]}>
          <Grid3D gameState={gameState} cellSize={cellSize} />
          <Player3D gameState={gameState} cellSize={cellSize} />
          <Enemies3D gameState={gameState} cellSize={cellSize} />
        </group>

        {/* Controls with full rotation freedom */}
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={calculateCameraHeight() * 2}
          minPolarAngle={0} // Allow top-down view
          maxPolarAngle={Math.PI} // Allow bottom-up view
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Game UI overlays */}
      <div
        style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontFamily: 'monospace' }}
      >
        <div>Score: {gameState?.score}</div>
        <div>Lives: {gameState?.lives}</div>
        <div>Level: {gameState?.level}</div>
        <div>Captured: {gameState?.capturedPercentage.toFixed(0)}%</div>
        <div>Target: {gameState?.targetPercentage}%</div>
      </div>

      {/* Game over screen */}
      {gameState?.gameOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '20px',
            borderRadius: '10px',
            color: 'white',
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          <h2>GAME OVER</h2>
          <p>Score: {gameState.score}</p>
          <button onClick={restartGame}>Restart (R)</button>
        </div>
      )}

      {/* Level complete screen */}
      {gameState?.levelComplete && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '20px',
            borderRadius: '10px',
            color: 'white',
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          <h2>LEVEL {gameState.level} COMPLETE!</h2>
          <p>Score: {gameState.score}</p>
          <button onClick={startNextLevel}>Next Level (Enter)</button>
        </div>
      )}
    </div>
  );
};
