import { useEffect, useRef } from 'react';
import { GameState } from '../utils/ClassicGameTypes';
import { useSoundStore } from '../stores/soundStore';

export const useGameSounds = (gameState: GameState | null) => {
    // Get sound functions from the store
    const {
        initSounds,
        playSound,
        stopSound,
        toggleSounds,
        toggleMusic,
        setSoundVolume,
        setMusicVolume,
        soundsEnabled,
        musicEnabled,
        soundVolume,
        musicVolume
    } = useSoundStore();

    // References to track previous game state for sound triggers
    const prevGameStateRef = useRef<GameState | null>(null);
    const prevIsDrawingRef = useRef<boolean | null>(null);
    const hasInitializedRef = useRef<boolean>(false);

    // Initialize sounds
    useEffect(() => {
        if (!hasInitializedRef.current) {
            initSounds();
            hasInitializedRef.current = true;

            // Force start background music (browsers sometimes block autoplay)
            setTimeout(() => {
                if (musicEnabled) {
                    playSound('background_music');
                }
            }, 1000);
        }
    }, [initSounds, musicEnabled, playSound]);

    // Handle game state changes for sound triggers
    useEffect(() => {
        if (!gameState) return;

        // Make local copies for comparison
        const prevGameState = prevGameStateRef.current;
        const prevIsDrawing = prevIsDrawingRef.current;

        // Player movement sound
        if (
            prevGameState &&
            (prevGameState.player.x !== gameState.player.x ||
                prevGameState.player.y !== gameState.player.y) &&
            !gameState.isDrawing
        ) {
            playSound('player_move');
        }

        // Trail start sound (when player starts drawing)
        if (prevIsDrawing === false && gameState.isDrawing === true) {
            playSound('trail_start');
        }

        // Enemy collision sound
        if (prevGameState && prevGameState.lives > gameState.lives) {
            playSound('enemy_collision');
        }

        // Capture complete sound
        if (
            prevGameState &&
            prevGameState.capturedPercentage < gameState.capturedPercentage &&
            prevIsDrawing === true &&
            gameState.isDrawing === false
        ) {
            playSound('capture_complete');
        }

        // Level complete sound
        if (prevGameState && !prevGameState.levelComplete && gameState.levelComplete) {
            playSound('level_complete');
        }

        // Game over sound
        if (prevGameState && !prevGameState.gameOver && gameState.gameOver) {
            playSound('game_over');
        }

        // Update refs for next comparison
        prevGameStateRef.current = gameState;
        prevIsDrawingRef.current = gameState.isDrawing;
    }, [gameState, playSound]);

    // Return sound controls to be used in components
    return {
        playSound,
        stopSound,
        toggleSounds,
        toggleMusic,
        setSoundVolume,
        setMusicVolume,
        soundsEnabled,
        musicEnabled,
        soundVolume,
        musicVolume
    };
}; 