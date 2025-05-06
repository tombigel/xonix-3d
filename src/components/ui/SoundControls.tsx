import React from 'react';
import { useSoundStore } from '../../stores/soundStore';

export const SoundControls: React.FC = () => {
  const {
    soundsEnabled,
    musicEnabled,
    soundVolume,
    musicVolume,
    toggleSounds,
    toggleMusic,
    setSoundVolume,
    setMusicVolume,
  } = useSoundStore();

  // Handle sound volume change
  const handleSoundVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoundVolume(parseFloat(e.target.value));
  };

  // Handle music volume change
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMusicVolume(parseFloat(e.target.value));
  };

  return (
    <div className="sound-controls absolute top-10 right-10 z-10 rounded-md bg-black/30 p-3 text-white backdrop-blur-sm">
      <div className="flex min-w-[200px] flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <span>Sound Effects</span>
            <button
              onClick={toggleSounds}
              className={`flex h-8 w-8 items-center justify-center rounded p-1 ${
                soundsEnabled ? 'bg-green-500' : 'bg-red-500'
              }`}
              aria-label={soundsEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            >
              {soundsEnabled ? <span>🔊</span> : <span>🔇</span>}
            </button>
          </label>
          {soundsEnabled && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={soundVolume}
              onChange={handleSoundVolumeChange}
              className="ml-2 w-24"
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <span>Music</span>
            <button
              onClick={toggleMusic}
              className={`flex h-8 w-8 items-center justify-center rounded p-1 ${
                musicEnabled ? 'bg-green-500' : 'bg-red-500'
              }`}
              aria-label={musicEnabled ? 'Mute music' : 'Unmute music'}
            >
              {musicEnabled ? <span>🎵</span> : <span>🔇</span>}
            </button>
          </label>
          {musicEnabled && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={handleMusicVolumeChange}
              className="ml-2 w-24"
            />
          )}
        </div>
      </div>
    </div>
  );
};
