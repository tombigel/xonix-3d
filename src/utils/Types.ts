// src/utils/Types.ts
import { Vector3 } from 'three';
// Removed GridPoint import here, as it's imported where needed (e.g., gameStore)
// Make sure GridPoint is exported from GridMath.ts

// This file will contain shared TypeScript interfaces and types for the game.

// --- Game Entities ---
export interface PlayerState {
    position: Vector3; // World position
    gridPosition: import('./GridMath').GridPoint; // Current grid cell
    isDrawing: boolean; // Is the player currently drawing a trail?
    currentTrail: import('./GridMath').GridPoint[]; // Points of the current trail being drawn
    // Add velocity, etc. as needed
}

export interface EnemyState {
    id: string;
    type: 'bouncer' | 'patroller';
    position: Vector3; // World position
    gridPosition: import('./GridMath').GridPoint; // Current grid cell
    // Add velocity, target, etc. as needed
}

// --- Game State (Extending Zustand store) ---

// Define actions for the Zustand store
export interface GameActions {
    setScore: (score: number) => void;
    decreaseLife: () => void;
    setLevel: (level: number) => void;
    setCapturedPercentage: (percentage: number) => void;
    addCapturedArea: (areaPoints: import('./GridMath').GridPoint[]) => void; // Use import() type
    setIsDrawing: (isDrawing: boolean) => void;
    clearTrail: () => void;
    addTrailPoint: (point: import('./GridMath').GridPoint) => void; // Use import() type
    resetLevel: () => void; // Reset player, enemies, captured area for new level/life lost
    toggle3DMode: () => void;
}

// Combine state and actions for the store type
// (Will be used in gameStore.ts)
// export type GameStore = GameState & GameActions;


// --- Input ---
export interface Controls {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
}

export { }; // Ensure this file is treated as a module 