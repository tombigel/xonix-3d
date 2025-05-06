import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import { useClassicGameLogic } from '../hooks/useClassicGameLogic';
import { Grid3D } from './Grid3D';
import { Player3D } from './Player3D';
import { Enemies3D } from './Enemies3D';
import { Trail3D } from './Trail3D';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { GameState } from '../utils/ClassicGameTypes';
import { ThemeProvider, useTheme } from './ThemeContext';

// Third-person camera component that follows the player
const ThirdPersonCamera = ({
  active,
  gameState,
  cellSize,
  distance,
  cameraRef,
}: {
  active: boolean;
  gameState: GameState | null;
  cellSize: number;
  distance: number;
  cameraRef: React.RefObject<THREE.PerspectiveCamera>;
}) => {
  // Store previous direction to maintain camera position when not moving
  const prevDirection = useRef<{ dx: number; dy: number }>({ dx: 0, dy: -1 });

  // Store last position for smoother interpolation
  const lastPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastTarget = useRef<THREE.Vector3>(new THREE.Vector3());

  // Store last time stamp for smooth movement
  const lastTime = useRef<number>(0);

  // Use frame to update camera position every frame
  useFrame((state) => {
    if (!active || !gameState || !cameraRef.current) return;

    const { player, gridCols, gridRows } = gameState;

    // Calculate delta time for smoother interpolation
    const now = state.clock.getElapsedTime();
    const deltaTime = Math.min(0.1, now - lastTime.current); // Cap to avoid jumps after pauses
    lastTime.current = now;

    // Calculate player position
    const offsetX = (gridCols * cellSize) / 2;
    const offsetZ = (gridRows * cellSize) / 2;
    const playerX = player.x * cellSize - offsetX + cellSize / 2;
    const playerY = cellSize * 0.5; // Same height as player
    const playerZ = player.y * cellSize - offsetZ + cellSize / 2;

    // Update the previous direction if player is moving
    if (player.dx !== 0 || player.dy !== 0) {
      prevDirection.current = { dx: player.dx, dy: player.dy };
    }

    // Use the current or previous direction to position camera
    const dx = prevDirection.current.dx;
    const dy = prevDirection.current.dy;

    // Position camera behind player based on movement direction
    const cameraX = playerX - dx * distance;
    const cameraY = playerY + distance * 0.4; // Slightly above player
    const cameraZ = playerZ - dy * distance;

    // Calculate look-ahead point (in front of player)
    const lookAheadX = playerX + dx * (distance * 0.3); // Look slightly ahead
    const lookAheadY = playerY; // Same height as player
    const lookAheadZ = playerZ + dy * (distance * 0.3);

    // Target camera position and look-at point
    const targetPosition = new THREE.Vector3(cameraX, cameraY, cameraZ);
    const targetLookAt = new THREE.Vector3(lookAheadX, lookAheadY, lookAheadZ);

    // Initialize last positions if not set
    if (lastPosition.current.lengthSq() === 0) {
      lastPosition.current.copy(targetPosition);
    }
    if (lastTarget.current.lengthSq() === 0) {
      lastTarget.current.copy(targetLookAt);
    }

    // Calculate movement speed based on player movement
    const isMoving = player.dx !== 0 || player.dy !== 0;
    const smoothFactor = isMoving ? 5.0 : 3.0; // Higher value = faster response

    // Calculate smooth lerp factor based on delta time
    const lerpFactor = 1.0 - Math.exp(-smoothFactor * deltaTime);

    // Update camera position with proper smoothing (time-based)
    lastPosition.current.lerp(targetPosition, lerpFactor);
    lastTarget.current.lerp(targetLookAt, lerpFactor);

    // Apply the smoothed positions
    cameraRef.current.position.copy(lastPosition.current);
    cameraRef.current.lookAt(lastTarget.current);
  });

  return null;
};

interface Scene3DProps {
  initialLevel?: number;
  debug?: boolean;
}

// Scene content separated to be wrapped with ThemeProvider
const SceneContent: React.FC<Scene3DProps> = ({ initialLevel = 1, debug = false }) => {
  const { gameState, isInitialized, handleInput, startNextLevel, restartGame, getConstants } =
    useClassicGameLogic(initialLevel);
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const thirdPersonCameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { currentTheme, cycleTheme, themeIndex } = useTheme();

  // Camera state
  const [activeCamera, setActiveCamera] = useState<'main' | 'thirdPerson'>('main');
  const [thirdPersonDistance, setThirdPersonDistance] = useState(5);
  const [cellSize, setCellSize] = useState(1);

  // Track previous direction for third-person controls
  const prevDirection = useRef<{ dx: number; dy: number }>({ dx: 0, dy: -1 });

  // Update previous direction when player moves
  useEffect(() => {
    if (gameState && (gameState.player.dx !== 0 || gameState.player.dy !== 0)) {
      prevDirection.current = {
        dx: gameState.player.dx,
        dy: gameState.player.dy,
      };
    }
  }, [gameState]);

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

  // Function to reset camera to top-down view
  const resetCameraToTopDown = useCallback(() => {
    if (orbitControlsRef.current && typeof orbitControlsRef.current.setPolarAngle === 'function') {
      // Reset to top-down view
      orbitControlsRef.current.setPolarAngle(0.01); // Almost 0, slightly offset to avoid gimbal lock
      orbitControlsRef.current.setAzimuthalAngle(0);
      orbitControlsRef.current.update();

      // Show visual feedback that the view has been reset
      console.log('Camera view reset to top-down');
    }
  }, [orbitControlsRef]);

  // Function to switch to main camera
  const switchToMainCamera = useCallback(() => {
    setActiveCamera('main');
    console.log('Switched to main camera');
  }, []);

  // Function to switch to third-person camera
  const switchToThirdPersonCamera = useCallback(() => {
    setActiveCamera('thirdPerson');
    console.log('Switched to third-person camera');
  }, []);

  // Function to adjust third-person camera distance
  const adjustThirdPersonDistance = useCallback((amount: number) => {
    setThirdPersonDistance((prev) => {
      const newDistance = Math.max(2, Math.min(20, prev + amount));
      console.log(`Third-person camera distance: ${newDistance}`);
      return newDistance;
    });
  }, []);

  // Function to handle third-person controls
  const handleThirdPersonInput = useCallback(
    (key: string) => {
      if (!gameState) return;

      // Get current direction
      const currentDx = gameState.player.dx;
      const currentDy = gameState.player.dy;

      // If player is not moving, use the last known direction
      const dx = currentDx || (gameState.isDrawing ? 0 : prevDirection.current?.dx || 0);
      const dy = currentDy || (gameState.isDrawing ? 0 : prevDirection.current?.dy || 0);

      let newDirection = { dx: 0, dy: 0 };

      switch (key) {
        case 'ArrowUp':
          // Move forward in current direction if not moving, otherwise keep current direction
          if (currentDx === 0 && currentDy === 0) {
            newDirection = { dx, dy };
          } else {
            newDirection = { dx: currentDx, dy: currentDy };
          }
          break;
        case 'ArrowLeft':
          // Rotate 90 degrees counterclockwise
          newDirection = { dx: dy, dy: -dx };
          break;
        case 'ArrowRight':
          // Rotate 90 degrees clockwise
          newDirection = { dx: -dy, dy: dx };
          break;
        case 'ArrowDown':
          // Reverse direction
          newDirection = { dx: -dx, dy: -dy };
          break;
      }

      // Only update if there's a valid direction
      if (newDirection.dx !== 0 || newDirection.dy !== 0) {
        // Convert direction to the corresponding arrow key
        let inputKey = '';
        if (newDirection.dx === 1) inputKey = 'ArrowRight';
        else if (newDirection.dx === -1) inputKey = 'ArrowLeft';
        else if (newDirection.dy === 1) inputKey = 'ArrowDown';
        else if (newDirection.dy === -1) inputKey = 'ArrowUp';

        if (inputKey) {
          handleInput(inputKey);
        }
      }
    },
    [gameState, handleInput]
  );

  // Set camera to top-down view on init
  useEffect(() => {
    if (cameraRef.current && orbitControlsRef.current) {
      // Position camera directly above the scene
      setTimeout(() => {
        resetCameraToTopDown();
      }, 100);
    }
  }, [cameraRef, orbitControlsRef, isInitialized, resetCameraToTopDown]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Camera control keys work even when game is not initialized
      switch (event.key) {
        case '0':
          event.preventDefault();
          resetCameraToTopDown();
          return;
        case '1':
          event.preventDefault();
          switchToMainCamera();
          return;
        case '2':
          event.preventDefault();
          switchToThirdPersonCamera();
          return;
        case '3':
          event.preventDefault();
          cycleTheme(); // Cycle through available themes
          return;
        case '+':
        case '=': // Same key as + without shift
          event.preventDefault();
          adjustThirdPersonDistance(-1); // Decrease distance (zoom in)
          return;
        case '-':
        case '_': // Same key as - without shift
          event.preventDefault();
          adjustThirdPersonDistance(1); // Increase distance (zoom out)
          return;
      }

      if (!isInitialized || !gameState) return;

      // Process game controls differently based on camera mode
      if (
        activeCamera === 'thirdPerson' &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
      ) {
        event.preventDefault();
        handleThirdPersonInput(event.key);
      } else {
        // Use standard controls for main camera mode
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    gameState,
    isInitialized,
    handleInput,
    handleThirdPersonInput,
    startNextLevel,
    restartGame,
    resetCameraToTopDown,
    switchToMainCamera,
    switchToThirdPersonCamera,
    adjustThirdPersonDistance,
    activeCamera,
    cycleTheme, // Add to dependency array
  ]);

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
        {/* Main Camera */}
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault={activeCamera === 'main'}
          position={[0, calculateCameraHeight(), 0]}
          fov={45}
          up={[0, 1, 0]} // Standard up vector for free rotation
        />

        {/* Third Person Camera */}
        <PerspectiveCamera
          ref={thirdPersonCameraRef}
          makeDefault={activeCamera === 'thirdPerson'}
          fov={60}
          near={0.1}
          far={1000}
          position={[0, 5, 5]} // Initial position, will be updated by ThirdPersonCamera component
        />

        {/* Third Person Camera Controller */}
        <ThirdPersonCamera
          active={activeCamera === 'thirdPerson'}
          gameState={gameState}
          cellSize={cellSize}
          distance={thirdPersonDistance}
          cameraRef={thirdPersonCameraRef}
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
        <ambientLight intensity={currentTheme.lightIntensity.ambient} />
        <directionalLight
          castShadow
          position={[0, calculateCameraHeight() * 0.8, 0]}
          intensity={currentTheme.lightIntensity.directional}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Environment preset={currentTheme.environmentPreset} />

        {/* Game elements */}
        <group position={[0, 0, 0]}>
          <Grid3D gameState={gameState} cellSize={cellSize} />
          <Trail3D gameState={gameState} cellSize={cellSize} />
          <Player3D gameState={gameState} cellSize={cellSize} />
          <Enemies3D gameState={gameState} cellSize={cellSize} />
        </group>

        {/* Controls with full rotation freedom - only for main camera */}
        {activeCamera === 'main' && (
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
        )}
      </Canvas>

      {/* Game UI overlays */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: currentTheme.uiColors.text,
          fontFamily: 'monospace',
          textShadow: currentTheme.uiColors.textShadow || 'none',
        }}
      >
        <div>Score: {gameState?.score}</div>
        <div>Lives: {gameState?.lives}</div>
        <div>Level: {gameState?.level}</div>
        <div>Captured: {gameState?.capturedPercentage.toFixed(0)}%</div>
        <div>Target: {gameState?.targetPercentage}%</div>
        <div style={{ marginTop: '10px', opacity: 0.7 }}>Camera Controls:</div>
        <div style={{ opacity: 0.7 }}>0: Reset to top-down</div>
        <div style={{ opacity: 0.7 }}>
          1: Main camera {activeCamera === 'main' ? '(active)' : ''}
        </div>
        <div style={{ opacity: 0.7 }}>
          2: Third-person {activeCamera === 'thirdPerson' ? '(active)' : ''}
        </div>
        <div style={{ opacity: 0.7 }}>
          3: Theme: {currentTheme.name} ({themeIndex + 1}/3)
        </div>
        <div style={{ opacity: 0.7 }}>+/-: Adjust third-person distance</div>
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
            color: currentTheme.uiColors.text,
            textAlign: 'center',
            fontFamily: 'monospace',
            border: currentTheme.uiColors.buttonBorder || 'none',
            boxShadow: currentTheme.uiColors.buttonShadow || 'none',
          }}
        >
          <h2>GAME OVER</h2>
          <p>Score: {gameState.score}</p>
          <button
            onClick={restartGame}
            style={{
              background: currentTheme.uiColors.buttonBackground || '#333',
              color: currentTheme.uiColors.buttonText || 'white',
              border: currentTheme.uiColors.buttonBorder || '1px solid #666',
              padding: '8px 16px',
              cursor: 'pointer',
              boxShadow: currentTheme.uiColors.buttonShadow || 'none',
            }}
          >
            Restart (R)
          </button>
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
            color: currentTheme.uiColors.text,
            textAlign: 'center',
            fontFamily: 'monospace',
            border: currentTheme.uiColors.buttonBorder || 'none',
            boxShadow: currentTheme.uiColors.buttonShadow || 'none',
          }}
        >
          <h2>LEVEL {gameState.level} COMPLETE!</h2>
          <p>Score: {gameState.score}</p>
          <button
            onClick={startNextLevel}
            style={{
              background: currentTheme.uiColors.buttonBackground || '#333',
              color: currentTheme.uiColors.buttonText || 'white',
              border: currentTheme.uiColors.buttonBorder || '1px solid #666',
              padding: '8px 16px',
              cursor: 'pointer',
              boxShadow: currentTheme.uiColors.buttonShadow || 'none',
            }}
          >
            Next Level (Enter)
          </button>
        </div>
      )}
    </div>
  );
};

// Wrap the scene with ThemeProvider
export const Scene3D: React.FC<Scene3DProps> = (props) => {
  return (
    <ThemeProvider>
      <SceneContent {...props} />
    </ThemeProvider>
  );
};
