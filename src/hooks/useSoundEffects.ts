import { useEffect, useRef } from 'react';
import { GameState } from '../utils/ClassicGameTypes';
import { useSoundStore } from '../stores/soundStore';

/**
 * A specialized hook for managing game sound effects based on game state changes
 */
export const useSoundEffects = (gameState: GameState | null) => {
    const { playSound } = useSoundStore();

    // References to track previous game state
    const prevGameStateRef = useRef<GameState | null>(null);
    const prevIsDrawingRef = useRef<boolean | null>(null);

    // Play appropriate sound effects based on game state changes
    useEffect(() => {
        if (!gameState) return;

        // Get previous state for comparison
        const prevState = prevGameStateRef.current;
        const prevIsDrawing = prevIsDrawingRef.current;

        // Player movement sound
        if (
            prevState &&
            (prevState.player.x !== gameState.player.x ||
                prevState.player.y !== gameState.player.y) &&
            !gameState.isDrawing
        ) {
            playSound('player_move');
        }

        // Trail start sound (when player starts drawing)
        if (prevIsDrawing === false && gameState.isDrawing === true) {
            playSound('trail_start');
        }

        // Enemy collision sound
        if (prevState && prevState.lives > gameState.lives) {
            playSound('enemy_collision');
        }

        // Capture completion sound
        if (
            prevState &&
            prevIsDrawing === true &&
            gameState.isDrawing === false &&
            prevState.capturedPercentage < gameState.capturedPercentage
        ) {
            playSound('capture_complete');
        }

        // Level complete sound
        if (prevState && !prevState.levelComplete && gameState.levelComplete) {
            playSound('level_complete');
        }

        // Game over sound
        if (prevState && !prevState.gameOver && gameState.gameOver) {
            playSound('game_over');
        }

        // Update refs for next comparison
        prevGameStateRef.current = gameState;
        prevIsDrawingRef.current = gameState.isDrawing;
    }, [gameState, playSound]);
}; 