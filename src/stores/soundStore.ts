import { create } from 'zustand';

// Define the sound types
export type SoundType =
    | 'background_music'
    | 'player_move'
    | 'trail_start'
    | 'enemy_collision'
    | 'capture_complete'
    | 'power_up'
    | 'level_complete'
    | 'game_over'
    | 'menu_select';

// Sound store state interface
interface SoundState {
    // Audio elements
    sounds: Record<SoundType, HTMLAudioElement | null>;
    // Settings
    soundsEnabled: boolean;
    musicEnabled: boolean;
    soundVolume: number;
    musicVolume: number;
    // Actions
    initSounds: () => void;
    playSound: (sound: SoundType) => void;
    stopSound: (sound: SoundType) => void;
    toggleSounds: () => void;
    toggleMusic: () => void;
    setSoundVolume: (volume: number) => void;
    setMusicVolume: (volume: number) => void;
}

// Create the sound store
export const useSoundStore = create<SoundState>((set, get) => ({
    // Initial state
    sounds: {
        background_music: null,
        player_move: null,
        trail_start: null,
        enemy_collision: null,
        capture_complete: null,
        power_up: null,
        level_complete: null,
        game_over: null,
        menu_select: null,
    },
    soundsEnabled: true,
    musicEnabled: true,
    soundVolume: 1.0,
    musicVolume: 0.33, // Music at 1/3 volume of sound effects

    // Initialize sounds
    initSounds: () => {
        const soundFiles: Record<SoundType, string> = {
            background_music: '/sounds/background_music.mp3',
            player_move: '/sounds/player_move.mp3',
            trail_start: '/sounds/trail_start.mp3',
            enemy_collision: '/sounds/enemy_collision.mp3',
            capture_complete: '/sounds/capture_complete.mp3',
            power_up: '/sounds/power_up.mp3',
            level_complete: '/sounds/level_complete.mp3',
            game_over: '/sounds/game_over.mp3',
            menu_select: '/sounds/menu_select.mp3',
        };

        const loadedSounds: Record<SoundType, HTMLAudioElement> = {
            background_music: new Audio(soundFiles.background_music),
            player_move: new Audio(soundFiles.player_move),
            trail_start: new Audio(soundFiles.trail_start),
            enemy_collision: new Audio(soundFiles.enemy_collision),
            capture_complete: new Audio(soundFiles.capture_complete),
            power_up: new Audio(soundFiles.power_up),
            level_complete: new Audio(soundFiles.level_complete),
            game_over: new Audio(soundFiles.game_over),
            menu_select: new Audio(soundFiles.menu_select),
        };

        // Configure audio elements
        loadedSounds.background_music.loop = true;

        // Get current state
        const state = get();

        // Set volumes and apply mute settings
        Object.keys(loadedSounds).forEach((key) => {
            const soundKey = key as SoundType;
            const audio = loadedSounds[soundKey];

            if (soundKey === 'background_music') {
                audio.volume = state.musicVolume;
                // Set muted state based on musicEnabled
                audio.muted = !state.musicEnabled;
            } else {
                audio.volume = state.soundVolume;
                // Set muted state based on soundsEnabled
                audio.muted = !state.soundsEnabled;
            }
        });

        set({ sounds: loadedSounds });

        // Start background music if enabled
        if (state.musicEnabled) {
            loadedSounds.background_music.play().catch((error) => {
                console.warn('Background music autoplay prevented:', error);
            });
        }
    },

    // Play a sound
    playSound: (sound: SoundType) => {
        const { sounds, soundsEnabled, musicEnabled } = get();

        // Skip if the specific sound doesn't exist
        if (!sounds[sound]) return;

        // Handle background music
        if (sound === 'background_music') {
            // Only play if music is enabled
            if (musicEnabled && sounds.background_music) {
                sounds.background_music.play().catch(err => console.warn('Error playing music:', err));
            }
            return;
        }

        // For other sound effects - only play if sound effects are enabled
        if (soundsEnabled) {
            const audio = sounds[sound];
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(err => console.warn(`Error playing sound ${sound}:`, err));
            }
        }
    },

    // Stop a sound
    stopSound: (sound: SoundType) => {
        const { sounds } = get();
        if (sounds[sound]) {
            sounds[sound]?.pause();
            if (sound !== 'background_music' && sounds[sound]) {
                // Reset position for sound effects
                sounds[sound].currentTime = 0;
            }
        }
    },

    // Toggle all sound effects
    toggleSounds: () => {
        set(state => {
            const newSoundsEnabled = !state.soundsEnabled;

            // Update muted state for all sound effects
            Object.keys(state.sounds).forEach((key) => {
                const soundKey = key as SoundType;
                // Don't affect background music, which is controlled separately
                if (soundKey !== 'background_music' && state.sounds[soundKey]) {
                    const sound = state.sounds[soundKey];
                    if (sound) {
                        sound.muted = !newSoundsEnabled;
                        // If muting, also stop current sounds
                        if (!newSoundsEnabled) {
                            sound.pause();
                            sound.currentTime = 0;
                        }
                    }
                }
            });

            return { soundsEnabled: newSoundsEnabled };
        });
    },

    // Toggle background music
    toggleMusic: () => {
        set(state => {
            const newMusicEnabled = !state.musicEnabled;

            // Get the music audio element
            const backgroundMusic = state.sounds.background_music;

            // Update muted state and play/pause as needed
            if (backgroundMusic) {
                backgroundMusic.muted = !newMusicEnabled;

                if (newMusicEnabled) {
                    // If we're enabling music and it's not already playing, start it
                    if (backgroundMusic.paused) {
                        backgroundMusic.play().catch(err => console.warn('Error playing music:', err));
                    }
                } else {
                    // If specifically requested in browser UX guidelines, we could pause here
                    // backgroundMusic.pause();
                    // But generally just muting is better for background music
                }
            }

            return { musicEnabled: newMusicEnabled };
        });
    },

    // Set sound volume
    setSoundVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));

        // Update all sound effects volumes except music
        Object.keys(get().sounds).forEach((key) => {
            const soundKey = key as SoundType;
            const sound = get().sounds[soundKey];
            if (soundKey !== 'background_music' && sound) {
                sound.volume = clampedVolume;
            }
        });

        set({ soundVolume: clampedVolume });
    },

    // Set music volume
    setMusicVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));

        // Update only background music volume
        const backgroundMusic = get().sounds.background_music;
        if (backgroundMusic) {
            backgroundMusic.volume = clampedVolume;
        }

        set({ musicVolume: clampedVolume });
    },
})); 