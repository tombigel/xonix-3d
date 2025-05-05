// src/utils/GridMath.ts

// --- Constants ---

// Define the grid dimensions (conceptual units, not pixels initially)
// These can be scaled later for rendering
export const GRID_WIDTH = 64; // e.g., 64 units wide
export const GRID_HEIGHT = 48; // e.g., 48 units high

// --- Types ---

export interface GridPoint {
    x: number;
    y: number;
}

// --- Utility Functions ---

/**
 * Checks if a point is within the grid boundaries.
 * Excludes the outer border.
 * @param point The point to check.
 * @returns True if the point is inside the playable area.
 */
export function isInsideGrid(point: GridPoint): boolean {
    return point.x > 0 && point.x < GRID_WIDTH - 1 && point.y > 0 && point.y < GRID_HEIGHT - 1;
}

/**
 * Checks if a point is on the grid border.
 * @param point The point to check.
 * @returns True if the point is on the border.
 */
export function isOnBorder(point: GridPoint): boolean {
    return point.x === 0 || point.x === GRID_WIDTH - 1 || point.y === 0 || point.y === GRID_HEIGHT - 1;
}

/**
 * Converts world coordinates (used by Three.js/Cannon.js) to grid coordinates.
 * Assumes the grid origin (0,0) corresponds to a specific world point.
 * TODO: Define the mapping based on scene setup.
 * @param worldX World X coordinate.
 * @param worldY World Y coordinate (or Z depending on orientation).
 * @returns GridPoint coordinates.
 */
export function worldToGrid(worldX: number, worldY: number): GridPoint {
    // Placeholder - needs actual implementation based on scene scale and origin
    const gridX = Math.floor(worldX); // Example mapping
    const gridY = Math.floor(worldY); // Example mapping
    return { x: gridX, y: gridY };
}

/**
 * Converts grid coordinates to world coordinates.
 * TODO: Define the mapping based on scene setup.
 * @param gridPoint GridPoint coordinates.
 * @returns World coordinates { x, y } (or z).
 */
export function gridToWorld(gridPoint: GridPoint): { x: number; y: number } {
    // Placeholder - needs actual implementation based on scene scale and origin
    const worldX = gridPoint.x + 0.5; // Center in grid cell
    const worldY = gridPoint.y + 0.5; // Center in grid cell
    return { x: worldX, y: worldY };
}

// --- Area Calculation (Placeholder) ---

// Represents the state of each grid cell
export enum CellState {
    Uncaptured,
    Captured,
    Trail,
}

// Placeholder for the main grid data structure
// This might be a 2D array: CellState[][] 
// We'll define this more formally when implementing capture logic.

/**
 * Placeholder function for the flood fill algorithm.
 * @param startPoint The point where the player finished drawing the trail.
 * @param gridState The current state of the grid.
 * @param enemies List of enemy positions to avoid filling.
 * @returns The set of points representing the captured area.
 */
export function calculateCapturedArea(
    startPoint: GridPoint,
    gridState: CellState[][], // Assuming a 2D array representation
    enemies: GridPoint[]
): GridPoint[] {
    // TODO: Implement flood fill algorithm
    // 1. Get the path the player just drew.
    // 2. Identify potential areas enclosed by the path and existing borders/captured areas.
    // 3. For each potential area, perform flood fill starting from a point inside.
    // 4. During flood fill, check for boundary conditions (path, borders, captured).
    // 5. Check if the filled area contains any enemies. If not, it's captured.
    // 6. Return the points of the smallest valid captured area(s).
    console.warn("calculateCapturedArea not implemented", { startPoint, gridState, enemies });
    return [];
} 