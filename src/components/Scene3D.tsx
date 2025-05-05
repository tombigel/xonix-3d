import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import { useClassicGameLogic } from '../hooks/useClassicGameLogic';
import { Grid3D } from './Grid3D';
import { Player3D } from './Player3D';
import { Enemies3D } from './Enemies3D';

interface Scene3DProps {
  initialLevel?: number;
  debug?: boolean;
}

export const Scene3D: React.FC<Scene3DProps> = ({ initialLevel = 1, debug = false }) => {
  const { gameState, isInitialized, handleInput, startNextLevel, restartGame, getConstants } =
    useClassicGameLogic(initialLevel);
  const orbitControlsRef = useRef(null);
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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 20, 40]} fov={45} />

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
          position={[10, 20, 15]}
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

        {/* Controls */}
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
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
