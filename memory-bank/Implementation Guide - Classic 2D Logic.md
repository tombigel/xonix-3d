# Implementation Guide for Xonix-like Game Logic

This guide outlines the required interfaces and functionalities for the core game logic (`gameLogic.js`), enemy behavior (`enemyLogic.js`), and shared constants (`constants.js`) based on their usage in the provided `game.js` rendering/UI layer. Adhering to this structure will allow different rendering implementations to interact with the core game mechanics consistently.

## 1. `constants.js`

This module should export constants used for game configuration, rendering, and timing.

**Required Exports:**

- **Configuration:**
  - `BASE_ENEMY_COUNT`: (Number) Initial number of 'bouncer' type enemies at level 1.
  - `BASE_PATROLLER_COUNT`: (Number) Initial number of 'patroller' type enemies at level 1.
  - `BASE_ENEMY_SPEED`: (Number) Base speed factor for enemies at level 1.
- **Rendering/Grid:**
  - `CELL_SIZE`: (Number) The pixel dimension of a single grid cell. Used by the rendering layer to calculate canvas size and draw elements.
- **Colors:** (Strings - hex codes or CSS color names)
  - `COLOR_BACKGROUND`: Background color of empty/uncaptured grid cells.
  - `COLOR_CAPTURED`: Color of captured grid cells.
  - `COLOR_TRAIL`: Color of the player's temporary trail.
  - `COLOR_PLAYER_STROKE`: Color for drawing the player outline/stroke.
  - `COLOR_ENEMY_BOUNCER_FILL`: Fill color for 'bouncer' type enemies.
  - `COLOR_ENEMY_PATROLLER_STROKE`: Stroke color for 'patroller' type enemies.
  - _(Optional but recommended)_ `COLOR_GRID_LINES`: Color for drawing grid lines (if implemented).
- **Timing:**
  - `TIME_STEP`: (Number) The interval in milliseconds at which the core game logic (`updateGame`) should be called for fixed-step updates.

## 2. `gameLogic.js`

This module manages the core game state, player actions, grid state, scoring, lives, levels, and win/loss conditions. It orchestrates updates and interacts with `enemyLogic.js`.

**Required Exports:**

- **Enums/Types:**
  - `CellState`: An enum or object defining states for grid cells (e.g., `UNCAPTURED`, `CAPTURED`, `TRAIL`). The rendering layer uses this to determine cell colors.
- **Functions:**

  - `initGame(startLevel: number, config: { baseEnemyCount: number, basePatrollerCount: number, enemySpeed: number })`:
    - Resets and initializes the entire game state for a given starting level.
    - Uses the provided `config` values (derived from `constants.js`) to configure the initial enemy setup via `enemyLogic.js`.
    - Sets up the initial grid, player position, score, lives, etc.
    - Must internally call `enemyLogic.initializeEnemies`.
  - `updateGame()`:
    - Advances the game state by one `TIME_STEP`.
    - Handles player movement based on current direction (`dx`, `dy`).
    - Manages trail creation (`isDrawing`, `currentTrail`), state changes on the grid (`CellState.TRAIL`).
    - Detects trail completion when the player reaches a `CAPTURED` cell while `isDrawing`.
    - Triggers flood-fill logic upon trail completion to capture areas.
    - Updates score based on captured area.
    - Checks for extra lives based on score milestones.
    - Calls `enemyLogic.updateAllEnemies` to update enemy positions and check for collisions.
    - Handles life loss logic (player hitting own trail, player collision with enemy, enemy hitting trail).
    - Checks for level completion (target percentage captured).
    - Checks for game over condition (lives <= 0).
    - Updates internal state flags (`gameOverState`, `levelCompleteState`, `gameRunning`).
  - `handlePlayerInput(direction: string)`:
    - Takes a direction indicator (e.g., 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight').
    - Updates the player's intended movement direction (`player.dx`, `player.dy`). Should only set one axis to non-zero at a time.
    - Should prevent input processing if `gameRunning` is false or `gameOverState` is true.
  - `getGameState()`:

    - Returns an object representing the _current_ state of the game. This object is read by the rendering layer each frame.
    - **Required State Object Structure:**

            ```typescript
            interface GameState {
              score: number;
              lives: number;
              level: number;
              capturedPercentage: number; // 0-100
              player: { x: number; y: number; dx: number; dy: number }; // Current position and direction
              grid: number[][]; // 2D array representing cell states (using CellState enum values)
              enemies: { x: number; y: number; type: string /* 'bouncer' | 'patroller' */, /* ... other enemy-specific state needed for drawing? */ }[]; // Array of enemy objects
              isDrawing: boolean; // Is the player currently leaving a trail?
              currentTrail: { x: number; y: number }[]; // Array of points in the player's active trail
              gameOver: boolean; // Is the game over?
              levelComplete: boolean; // Has the current level been completed?
              gameRunning: boolean; // Is the game logic actively updating? (false if paused, level complete, or game over)
              gridCols: number; // Number of columns in the grid
              gridRows: number; // Number of rows in the grid
              targetPercentage: number; // The percentage required to win the level (e.g., 75)
            }
            ```

    - Crucially, this function should return _copies_ of mutable state (like `grid`, `enemies`, `player`, `currentTrail`) to prevent the rendering layer from accidentally modifying the core game state.

  - `triggerNextLevelStart()`:
    - Called externally (e.g., by a button click or key press) when `levelComplete` is true.
    - Increments the level.
    - Resets the grid, player position, and trail state.
    - Calls `enemyLogic.initializeEnemies` for the new level.
    - Resets `levelCompleteState` to `false` and sets `gameRunning` to `true`.

- **Constants (derived or passed through):**
  - `GRID_COLS`: (Number) Width of the game grid in cells.
  - `GRID_ROWS`: (Number) Height of the game grid in cells.

## 3. `enemyLogic.js`

This module encapsulates the behavior, movement, and collision detection specific to different enemy types.

**Required Exports:**

- **Functions:**
  - `initializeEnemies(config: { level: number, gridCols: number, gridRows: number, grid: number[][], player: { x: number, y: number }, baseEnemyCount: number, basePatrollerCount: number, enemySpeed: number })`:
    - Creates and returns an array of enemy objects based on the current `level` and base configuration values.
    - Calculates the number and speed of each enemy type for the given level.
    - Determines valid starting positions for each enemy, considering the grid state (`CAPTURED` vs. `UNCAPTURED`), grid boundaries, and potentially the player's starting position. Patrollers must start on `CAPTURED` cells, Bouncers must start on `UNCAPTURED` cells.
    - Sets initial movement vectors (`dx`, `dy`) for each enemy.
    - Returns an array of enemy objects. Each enemy object _must_ include at least `{ x: number, y: number, type: string /* 'bouncer' | 'patroller' */ }` for the rendering layer and internal state like `{ dx: number, dy: number, speed: number, ... }` for its own logic.
  - `updateAllEnemies(config: { enemies: any[], grid: number[][], player: { x: number, y: number }, isDrawing: boolean, currentTrail: { x: number, y: number }[], gridCols: number, gridRows: number, CellState: any })`:
    - Takes the current list of `enemies`, the `grid` state, `player` state, `isDrawing` flag, `currentTrail`, dimensions, and `CellState` enum.
    - Iterates through each enemy in the `enemies` array.
    - **Collision Detection (Life Loss):**
      - Checks if an enemy starts its turn on the player's cell (Patroller always kills, Bouncer kills only if `isDrawing`).
      - Checks if an enemy's _intended move_ would hit the player's `currentTrail` (kills if `isDrawing`).
      - Checks if an enemy _ends_ its move on the player's cell (Patroller always kills, Bouncer kills only if `isDrawing`).
    - **Movement Logic:**
      - Updates the `x`, `y`, `dx`, `dy` properties of each enemy based on its type:
        - **Bouncer:** Moves within `UNCAPTURED` space, bouncing off `CAPTURED` cells and grid boundaries. Needs logic to handle diagonal bounces and potentially get unstuck.
        - **Patroller:** Moves only along `CAPTURED` cells (the border/filled areas). Needs logic to follow the path and turn corners appropriately. Needs logic to get unstuck.
    - **Return Value:** Returns an object indicating if any enemy action during this update cycle resulted in a life loss: `{ lifeLost: boolean }`. `gameLogic.js` uses this return value to trigger the `loseLife` sequence.

By implementing these three modules according to this guide, you can create different visual front-ends or even variations of the game mechanics while maintaining a consistent core structure.
