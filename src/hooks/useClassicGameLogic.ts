import { useEffect, useState, useRef, useCallback } from 'react';
import {
    GameState,
    EnemyConfig,
    CellState,
    GameLogic,
    GameConstants
} from '../utils/ClassicGameTypes';

/**
 * A hook that interfaces with the classic 2D game logic
 * and provides a React-friendly API to the game state and functions.
 */
export const useClassicGameLogic = (initialLevel = 1, enemyConfig?: EnemyConfig) => {
    // Dynamic imports for the classic game logic modules
    const gameLogicRef = useRef<GameLogic | null>(null);
    const gameConstantsRef = useRef<GameConstants | null>(null);

    // Game state from the classic logic
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const accumulatorRef = useRef<number>(0);

    // Initialize the game logic by dynamically importing the classic modules
    useEffect(() => {
        const initializeLogic = async () => {
            try {
                // Import the classic game logic modules
                const gameLogicModule = await import('../classic-2d/gameLogic.js');
                const constantsModule = await import('../classic-2d/constants.js');

                // Store references to the imported modules
                gameLogicRef.current = gameLogicModule as unknown as GameLogic;
                gameConstantsRef.current = constantsModule as unknown as GameConstants;

                // Initialize the game with the provided options
                const config = enemyConfig || {
                    baseEnemyCount: gameConstantsRef.current.BASE_ENEMY_COUNT,
                    basePatrollerCount: gameConstantsRef.current.BASE_PATROLLER_COUNT,
                    enemySpeed: gameConstantsRef.current.BASE_ENEMY_SPEED,
                };

                gameLogicRef.current.initGame(initialLevel, config);

                // Get initial state
                const initialState = gameLogicRef.current.getGameState();
                setGameState(initialState);
                setIsInitialized(true);

                // Start the game loop
                startGameLoop();
            } catch (error) {
                console.error('Failed to initialize classic game logic:', error);
            }
        };

        initializeLogic();

        // Cleanup function to cancel animation frame on unmount
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [initialLevel, enemyConfig]);

    // Game loop using requestAnimationFrame
    const gameLoop = useCallback((timestamp: number) => {
        if (!gameLogicRef.current) return;

        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // Get the latest state to check game flags
        const currentState = gameLogicRef.current.getGameState();

        // Only update logic if game is running
        if (currentState.gameRunning) {
            accumulatorRef.current += deltaTime;
            const TIME_STEP = gameConstantsRef.current?.TIME_STEP || 100;

            while (accumulatorRef.current >= TIME_STEP) {
                gameLogicRef.current.updateGame();
                accumulatorRef.current -= TIME_STEP;
            }

            // Update state for rendering
            setGameState(gameLogicRef.current.getGameState());
        }

        // Continue the loop unless game is over or level is complete
        if (!currentState.gameOver && !currentState.levelComplete) {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
        } else {
            console.log('Game loop paused (Game Over or Level Complete).');
        }
    }, []);

    const startGameLoop = useCallback(() => {
        lastTimeRef.current = performance.now();
        accumulatorRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gameLoop]);

    // Function to handle player input
    const handleInput = useCallback((direction: string) => {
        if (gameLogicRef.current) {
            gameLogicRef.current.handlePlayerInput(direction);
        }
    }, []);

    // Function to start the next level
    const startNextLevel = useCallback(() => {
        if (gameLogicRef.current && gameState?.levelComplete) {
            gameLogicRef.current.triggerNextLevelStart();

            // Restart the game loop
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            startGameLoop();
        }
    }, [gameState?.levelComplete, startGameLoop]);

    // Function to restart the game
    const restartGame = useCallback(() => {
        if (gameLogicRef.current && gameConstantsRef.current) {
            const config = enemyConfig || {
                baseEnemyCount: gameConstantsRef.current.BASE_ENEMY_COUNT,
                basePatrollerCount: gameConstantsRef.current.BASE_PATROLLER_COUNT,
                enemySpeed: gameConstantsRef.current.BASE_ENEMY_SPEED,
            };

            gameLogicRef.current.initGame(initialLevel, config);

            // Restart the game loop
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            startGameLoop();
        }
    }, [initialLevel, enemyConfig, startGameLoop]);

    // Get constants for 3D visualization
    const getConstants = useCallback(() => {
        return gameConstantsRef.current;
    }, []);

    return {
        gameState,
        isInitialized,
        handleInput,
        startNextLevel,
        restartGame,
        getConstants,
        CellState
    };
}; 