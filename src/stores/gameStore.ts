import { create } from 'zustand';
import { GameActions } from '@/utils/Types';
import { GridPoint } from '@/utils/GridMath'; // Import GridPoint directly from its source
import { immer } from 'zustand/middleware/immer'; // Use immer for easier state updates

// Define the state structure
interface GameState {
    score: number;
    lives: number;
    level: number;
    capturedPercentage: number;
    isDrawing: boolean; // Added from Player component logic
    currentTrail: GridPoint[]; // Use the imported GridPoint
    is3DMode: boolean;
    // TODO: Add grid state (captured areas) here later
}

// Combine state and actions for the store type
type GameStore = GameState & GameActions;

// Create the store with Immer middleware for easier immutable updates
const useGameStore = create<GameStore>()(
    immer((set) => ({
        // --- Initial State ---
        score: 0,
        lives: 3,
        level: 1,
        capturedPercentage: 0,
        isDrawing: false,
        currentTrail: [],
        is3DMode: false,

        // --- Actions ---
        setScore: (newScore) =>
            set((state) => {
                state.score = newScore;
            }),

        decreaseLife: () =>
            set((state) => {
                if (state.lives > 0) {
                    state.lives -= 1;
                }
                // TODO: Add logic for game over or level reset when lives reach 0
            }),

        setLevel: (newLevel) =>
            set((state) => {
                state.level = newLevel;
                // TODO: Reset other relevant state for new level?
            }),

        setCapturedPercentage: (percentage) =>
            set((state) => {
                state.capturedPercentage = Math.min(100, Math.max(0, percentage)); // Clamp between 0-100
                // TODO: Check for level completion here (e.g., >= 80%)
            }),

        // Placeholder - will need actual grid state later
        addCapturedArea: (areaPoints) =>
            set((state) => {
                console.log('Adding captured area points:', areaPoints.length);
                // TODO: Update grid state and recalculate captured percentage
                // state.capturedPercentage = calculateNewPercentage(...)
                state.currentTrail = []; // Clear trail after capture
                state.isDrawing = false;
            }),

        setIsDrawing: (isDrawing) =>
            set((state) => {
                state.isDrawing = isDrawing;
            }),

        clearTrail: () =>
            set((state) => {
                state.currentTrail = [];
            }),

        addTrailPoint: (point) =>
            set((state) => {
                console.log('Attempting to add trail point:', point);
                const lastPoint = state.currentTrail[state.currentTrail.length - 1];
                if (!lastPoint || lastPoint.x !== point.x || lastPoint.y !== point.y) {
                    state.currentTrail.push(point);
                    console.log('Current trail:', JSON.stringify(state.currentTrail)); // Log the updated trail
                }
            }),

        // Placeholder
        resetLevel: () =>
            set((state) => {
                console.log('Resetting level state...');
                // TODO: Reset player position, clear trail, reset captured area, potentially reset enemies
                state.isDrawing = false;
                state.currentTrail = [];
                // Don't reset score or lives here usually
            }),

        toggle3DMode: () =>
            set((state) => {
                state.is3DMode = !state.is3DMode;
            }),
    }))
);

export default useGameStore;
