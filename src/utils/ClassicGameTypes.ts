/**
 * Type definitions for the classic 2D game logic
 * This file provides TypeScript interfaces for the JavaScript modules in src/classic-2d/
 */

// Define CellState enum matching the one in gameLogic.js
export enum CellState {
    UNCAPTURED = 0,
    CAPTURED = 1,
    TRAIL = 2,
}

// Player type definition
export interface Player {
    x: number;
    y: number;
    dx: number;
    dy: number;
}

// Enemy type definition
export interface Enemy {
    x: number;
    y: number;
    dx: number;
    dy: number;
    type: 'bouncer' | 'patroller';
    speed: number;
    lastPositions?: { x: number; y: number }[];
    stuckCounter?: number;
}

// Trail segment type
export interface TrailSegment {
    x: number;
    y: number;
}

// Game state definition matching the return value of getGameState()
export interface GameState {
    score: number;
    lives: number;
    level: number;
    capturedPercentage: number;
    player: Player;
    grid: CellState[][];
    enemies: Enemy[];
    isDrawing: boolean;
    currentTrail: TrailSegment[];
    gameOver: boolean;
    levelComplete: boolean;
    gameRunning: boolean;
    gridCols: number;
    gridRows: number;
    targetPercentage: number;
}

// Enemy configuration interface
export interface EnemyConfig {
    baseEnemyCount: number;
    basePatrollerCount: number;
    enemySpeed: number;
}

// Game initialization options
export interface GameInitOptions {
    startLevel?: number;
    config?: EnemyConfig;
}

// Game logic interface - representing the functions exported from gameLogic.js
export interface GameLogic {
    initGame: (startLevel?: number, config?: EnemyConfig) => void;
    updateGame: () => void;
    handlePlayerInput: (direction: string) => void;
    getGameState: () => GameState;
    triggerNextLevelStart: () => void;
    CellState: typeof CellState;
}

// Constants interface - representing the values exported from constants.js
export interface GameConstants {
    BASE_ENEMY_COUNT: number;
    BASE_PATROLLER_COUNT: number;
    BASE_ENEMY_SPEED: number;
    CELL_SIZE: number;
    COLOR_BACKGROUND: string;
    COLOR_CAPTURED: string;
    COLOR_TRAIL: string;
    COLOR_PLAYER_STROKE: string;
    COLOR_ENEMY_BOUNCER_FILL: string;
    COLOR_ENEMY_PATROLLER_STROKE: string;
    COLOR_GRID_LINES: string;
    TIME_STEP: number;
}

// EnemyLogic interface - representing the functions exported from enemyLogic.js
export interface EnemyLogic {
    initializeEnemies: (config: {
        level: number;
        gridCols: number;
        gridRows: number;
        grid: CellState[][];
        player: Player;
        baseEnemyCount: number;
        basePatrollerCount: number;
        enemySpeed: number;
    }) => Enemy[];

    updateAllEnemies: (config: {
        enemies: Enemy[];
        grid: CellState[][];
        player: Player;
        isDrawing: boolean;
        currentTrail: TrailSegment[];
        gridCols: number;
        gridRows: number;
        CellState: typeof CellState;
    }) => { lifeLost: boolean };
} 