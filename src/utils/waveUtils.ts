/**
 * Utility functions for calculating wave parameters for the sinusoidal board surface
 */

// Base amplitudes and frequencies
const BASE_AMPLITUDE_X = 0.2;
const BASE_AMPLITUDE_Y = 0.2;
const BASE_FREQUENCY_X = 0.3;
const BASE_FREQUENCY_Y = 0.3;

// Growth factors per level (small to keep the game playable)
const AMPLITUDE_GROWTH = 0.15;
const FREQUENCY_GROWTH = 0.12;

// Maximum values to prevent extreme waves that might make the game unplayable
const MAX_AMPLITUDE = 10.0;
const MAX_FREQUENCY = 10.0;

/**
 * Calculate wave parameters (a, b, c, d) based on the current level
 * @param level Current game level
 * @returns Object containing a, b, c, d wave parameters
 */
export const getWaveParameters = (level: number) => {
  // Ensure level is at least 1
  const adjustedLevel = Math.max(1, level);

  // Calculate parameters with growth based on level
  // Clamp values to prevent extreme waves
  const a = Math.min(BASE_AMPLITUDE_X + (adjustedLevel - 1) * AMPLITUDE_GROWTH, MAX_AMPLITUDE);
  const b = Math.min(BASE_FREQUENCY_X + (adjustedLevel - 1) * FREQUENCY_GROWTH, MAX_FREQUENCY);
  const c = Math.min(BASE_AMPLITUDE_Y + (adjustedLevel - 1) * AMPLITUDE_GROWTH, MAX_AMPLITUDE);
  const d = Math.min(BASE_FREQUENCY_Y + (adjustedLevel - 1) * FREQUENCY_GROWTH, MAX_FREQUENCY);

  return { a, b, c, d };
};

/**
 * Calculate the height at a given x,z coordinate using wave parameters
 * @param x X coordinate
 * @param z Z coordinate
 * @param waveParams Wave parameters object {a, b, c, d}
 * @returns Height value
 */
export const calculateHeight = (
  x: number,
  z: number,
  waveParams: { a: number; b: number; c: number; d: number }
) => {
  const { a, b, c, d } = waveParams;
  return a * Math.sin(b * x) + c * Math.sin(d * z);
};
