import React from 'react';
import useGameStore from '@/stores/gameStore';
import { Heart, Percent, Star } from 'lucide-react'; // Icons for display

const HUD: React.FC = () => {
  // Select individual state pieces. Zustand optimizes this automatically.
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const capturedPercentage = useGameStore((state) => state.capturedPercentage);

  return (
    <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between bg-black/30 p-4 text-white backdrop-blur-sm">
      {/* Left Side: Score */}
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-400" />
        <span className="text-lg font-bold">{score.toLocaleString()}</span>
      </div>

      {/* Right Side: Lives and Percentage */}
      <div className="flex items-center gap-6">
        {/* Captured Percentage */}
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-green-400" />
          <span className="text-lg font-bold">{capturedPercentage.toFixed(0)}%</span>
          {/* Optional: Progress Bar */}
          {/* <div className="h-2 w-20 bg-gray-600 rounded-full overflow-hidden"> */}
          {/*   <div className="h-full bg-green-400" style={{ width: `${capturedPercentage}%` }} /> */}
          {/* </div> */}
        </div>
        {/* Lives */}
        <div className="flex items-center gap-1.5">
          {[...Array(lives)].map((_, i) => (
            <Heart key={i} className="h-5 w-5 fill-current text-red-500" />
          ))}
          {[...Array(Math.max(0, 3 - lives))].map(
            (
              _,
              i // Show empty hearts up to 3 total
            ) => (
              <Heart key={`empty-${i}`} className="h-5 w-5 text-gray-600" />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default HUD;
