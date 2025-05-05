// src/classic-2d/gameLogic.js
import { initializeEnemies as initEnemiesFromLogic, updateAllEnemies } from './enemyLogic.js'; // Import new functions

export const GRID_COLS = 64;
export const GRID_ROWS = 48;

const PLAYER_START_POS = { x: GRID_COLS / 2, y: GRID_ROWS - 2 };

export const CellState = {
  UNCAPTURED: 0,
  CAPTURED: 1,
  TRAIL: 2,
};

// --- Game State ---
let score = 0;
let lives = 3;
let level = 1;
let capturedPercentage = 0;
let player = { ...PLAYER_START_POS, dx: 0, dy: 0 };
let grid = [];
let currentTrail = [];
let isDrawing = false;
let enemies = []; // State managed here, but initialized and updated via enemyLogic
let gameOverState = false;
let levelCompleteState = false; // New flag
let gameRunning = true;
let lastScoreMilestone = 0;

// --- Constants still needed here ---
const TARGET_PERCENTAGE = 75;
const LEVEL_BONUS_SCORE = 1000;
const EXTRA_LIFE_SCORE_INTERVAL = 10000;

// --- Initialization ---
function initializeGrid() {
  grid = Array(GRID_ROWS)
    .fill(null)
    .map(() => Array(GRID_COLS).fill(CellState.UNCAPTURED));
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (x <= 1 || x >= GRID_COLS - 2 || y <= 1 || y >= GRID_ROWS - 2) {
        grid[y][x] = CellState.CAPTURED;
      }
    }
  }
}

function resetPlayerPosition() {
  player.x = PLAYER_START_POS.x;
  player.y = PLAYER_START_POS.y;
  player.dx = 0;
  player.dy = 0;
}

// --- Core Logic ---

function loseLife() {
  lives--;
  isDrawing = false;
  // Clear logical trail from grid state
  currentTrail.forEach((p) => {
    if (grid[p.y]?.[p.x] === CellState.TRAIL) {
      grid[p.y][p.x] = CellState.UNCAPTURED;
    }
  });
  currentTrail = [];
  resetPlayerPosition();

  if (lives <= 0) {
    gameOverState = true;
    gameRunning = false; // Signal to stop the loop
  }
  // UI update will be handled externally based on state
}

function handlePlayerInput(direction) {
  if (!gameRunning || gameOverState) return; // Don't process input if game over/paused

  switch (direction) {
    case 'ArrowUp':
      player.dx = 0;
      player.dy = -1;
      break;
    case 'ArrowDown':
      player.dx = 0;
      player.dy = 1;
      break;
    case 'ArrowLeft':
      player.dx = -1;
      player.dy = 0;
      break;
    case 'ArrowRight':
      player.dx = 1;
      player.dy = 0;
      break;
  }
}

function floodFill(startX, startY, targetGrid, fillEnemies) {
  const q = [{ x: startX, y: startY }];
  const visited = new Set();
  visited.add(`${startX},${startY}`);
  let count = 0;
  let containsEnemy = false;

  while (q.length > 0) {
    const { x, y } = q.shift();

    // Check if enemy is in this fill zone
    if (fillEnemies.some((e) => e.x === x && e.y === y)) {
      containsEnemy = true;
    }

    count++;

    const neighbors = [
      { x: x + 1, y: y },
      { x: x - 1, y: y },
      { x: x, y: y + 1 },
      { x: x, y: y - 1 },
    ];

    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (
        n.x >= 0 &&
        n.x < GRID_COLS &&
        n.y >= 0 &&
        n.y < GRID_ROWS &&
        !visited.has(key) &&
        targetGrid[n.y]?.[n.x] === CellState.UNCAPTURED // Only fill uncaptured
      ) {
        visited.add(key);
        q.push(n);
      }
    }
  }
  return { count, containsEnemy, visited };
}

function floodFillAndCapture(completedTrail) {
  if (!completedTrail || completedTrail.length === 0) return 0; // Nothing to capture

  const fillGrid = grid.map((row) => [...row]); // Create a copy for filling

  // Mark the completed trail on the fill grid to define boundaries
  completedTrail.forEach((p) => {
    if (fillGrid[p.y]?.[p.x] !== undefined) {
      fillGrid[p.y][p.x] = CellState.CAPTURED; // Treat trail as boundary
    }
  });

  const uncapturedAreas = [];

  // Iterate potential starting points for flood fill (only need to check adjacent to trail)
  const checkedStarts = new Set();
  for (const trailPoint of completedTrail) {
    const neighbors = [
      { x: trailPoint.x + 1, y: trailPoint.y },
      { x: trailPoint.x - 1, y: trailPoint.y },
      { x: trailPoint.x, y: trailPoint.y + 1 },
      { x: trailPoint.x, y: trailPoint.y - 1 },
    ];
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (
        n.x >= 0 &&
        n.x < GRID_COLS &&
        n.y >= 0 &&
        n.y < GRID_ROWS &&
        !checkedStarts.has(key) &&
        fillGrid[n.y]?.[n.x] === CellState.UNCAPTURED
      ) {
        checkedStarts.add(key);
        // Pass current enemies to floodFill
        const fillResult = floodFill(n.x, n.y, fillGrid, enemies);
        // Mark visited cells in fillGrid to avoid re-filling
        fillResult.visited.forEach((visitedKey) => {
          const [vx, vy] = visitedKey.split(',').map(Number);
          if (fillGrid[vy]?.[vx] === CellState.UNCAPTURED) {
            // Avoid marking already captured cells during checks
            fillGrid[vy][vx] = 99; // Temp mark as checked
          }
        });

        uncapturedAreas.push(fillResult);
      }
    }
  }

  if (uncapturedAreas.length === 0) {
    // This might happen if the trail perfectly enclosed nothing new,
    // or only enclosed already captured space.
    console.log('No uncaptured areas found adjacent to trail.');
    return 0;
  }

  // Find the area(s) *without* enemies
  const areasToCapture = uncapturedAreas.filter((area) => !area.containsEnemy);

  if (areasToCapture.length === 0 && uncapturedAreas.some((area) => area.containsEnemy)) {
    // Only area(s) found contained enemies, capture nothing
    console.log('Flood fill areas contained enemies, capturing nothing.');
    return 0;
  } else if (areasToCapture.length === 0) {
    console.log('No areas to capture found.'); // Should be rare
    return 0;
  }

  // Capture ALL enemy-free areas.
  let totalCapturedCount = 0;
  areasToCapture.forEach((area) => {
    area.visited.forEach((key) => {
      const [fx, fy] = key.split(',').map(Number);
      // Check against the *original* grid state before marking
      if (grid[fy]?.[fx] === CellState.UNCAPTURED) {
        grid[fy][fx] = CellState.CAPTURED;
        totalCapturedCount++;
      }
    });
  });

  // Also mark the trail itself as captured on the main grid
  completedTrail.forEach((p) => {
    if (grid[p.y]?.[p.x] === CellState.TRAIL) {
      grid[p.y][p.x] = CellState.CAPTURED;
    }
  });

  return totalCapturedCount; // Return number of newly captured cells
}

function calculateCapturedPercentage() {
  let capturedCount = 0;
  let totalPlayableCount = 0;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      // Count only the inner "playable" area, excluding the initial border
      if (!(x <= 1 || x >= GRID_COLS - 2 || y <= 1 || y >= GRID_ROWS - 2)) {
        totalPlayableCount++;
        if (grid[y][x] === CellState.CAPTURED) {
          // Count captured only (not trail)
          capturedCount++;
        }
      }
    }
  }
  // Avoid division by zero
  return totalPlayableCount > 0 ? (capturedCount / totalPlayableCount) * 100 : 0;
}

function updateEnemies() {
  // Pass necessary state and callbacks to the enemy logic module
  const enemyUpdateResult = updateAllEnemies({
    enemies, // Pass current enemies array
    grid,
    player,
    isDrawing,
    currentTrail,
    // Pass grid dimensions and CellState if needed by enemy logic
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    CellState,
  });

  // Check if the enemy logic reported a collision that caused a life loss
  if (enemyUpdateResult.lifeLost) {
    loseLife();
  }
}

const getCellState = (cx, cy) => {
  if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) {
    return undefined; // Out of bounds
  }
  return grid[cy]?.[cx];
};

const checkTrailAndLoseLife = (targetX, targetY, enemyType) => {
  if (!isDrawing) return false; // Only check if player is actively drawing a trail

  const trailHit = currentTrail.some((p) => p.x === targetX && p.y === targetY);
  if (trailHit) {
    console.log(`${enemyType} hit trail at ${targetX}, ${targetY}!`);
    return true; // Indicate life should be lost
  }
  return false;
};

function winGame() {
  console.log(`Level ${level} Complete! Score: ${score}`);
  score += LEVEL_BONUS_SCORE * level; // Award level bonus
  levelCompleteState = true; // Set the flag
  gameRunning = false; // Pause game updates
  // UI/Button handling will be done in game.js
}

function startNextLevel() {
  console.log(`Starting Level ${level + 1}`); // Level increments *before* this is called now
  isDrawing = false;
  currentTrail = [];
  levelCompleteState = false; // Reset flag
  gameOverState = false;

  level++; // Increment level here

  initializeGrid();
  resetPlayerPosition();
  // Re-initialize enemies for the *new* level
  // Need to pass the base config values again
  enemies = initEnemiesFromLogic({
    level, // Use the incremented level
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    grid,
    player,
    baseEnemyCount: 2, // TODO: Consider storing base config instead of hardcoding here
    basePatrollerCount: 1,
    enemySpeed: 1,
  });

  capturedPercentage = calculateCapturedPercentage();
  lastScoreMilestone = Math.floor(score / EXTRA_LIFE_SCORE_INTERVAL) * EXTRA_LIFE_SCORE_INTERVAL;
  gameRunning = true; // Resume game
}

// New function to be called by the button - Exported directly
export function triggerNextLevelStart() {
  if (levelCompleteState) {
    // Only proceed if we are in the level complete state
    startNextLevel();
  }
}

function checkGameOver() {
  return gameOverState;
}

// --- Game Update Function ---
function updateGame() {
  if (!gameRunning || gameOverState) return;

  // --- Player Movement & Trail Logic ---
  if (player.dx !== 0 || player.dy !== 0) {
    const nextX = player.x + player.dx;
    const nextY = player.y + player.dy;

    if (nextX >= 0 && nextX < GRID_COLS && nextY >= 0 && nextY < GRID_ROWS) {
      // --- Player -> Enemy Collision Check ---
      const enemyCollision = enemies.some((e) => e.x === nextX && e.y === nextY);
      if (enemyCollision) {
        if (isDrawing) {
          console.log(`Player moved into enemy at (${nextX}, ${nextY}) while drawing!`);
          loseLife();
          return; // Stop update if life lost
        } else {
          // Player is safe if they move onto an enemy while on captured ground
          // Stop player movement for this turn, but don't lose life
          console.log(`Player bumped into enemy at (${nextX}, ${nextY}) while safe.`);
          // Don't update player position, effectively stopping them
          // We might want to reset dx/dy here if input isn't keydown-based
          // For now, just preventing the move is sufficient.
          return; // Stop further player move processing this tick
        }
      }
      // --- End Player -> Enemy Collision Check ---

      const nextCellState = getCellState(nextX, nextY);

      if (nextCellState === CellState.CAPTURED) {
        if (isDrawing) {
          // Completed a trail
          console.log('Trail complete!');
          isDrawing = false;
          currentTrail.push({ x: nextX, y: nextY }); // Add final connecting point

          const capturedCount = floodFillAndCapture(currentTrail);
          if (capturedCount > 0) {
            score += capturedCount * 10; // Award score
            console.log(`Captured ${capturedCount} cells. Score: ${score}`);
            // Check for extra life
            if (score >= lastScoreMilestone + EXTRA_LIFE_SCORE_INTERVAL) {
              let livesGained = 0;
              while (score >= lastScoreMilestone + EXTRA_LIFE_SCORE_INTERVAL) {
                lives++;
                livesGained++;
                lastScoreMilestone += EXTRA_LIFE_SCORE_INTERVAL;
              }
              console.log(
                `Extra life(s) awarded: ${livesGained}! Score: ${score}, Lives: ${lives}`
              );
            }
          } else {
            // Ensure trail is marked captured even if fill failed
            currentTrail.forEach((p) => {
              if (grid[p.y]?.[p.x] === CellState.TRAIL) {
                grid[p.y][p.x] = CellState.CAPTURED;
              }
            });
          }
          currentTrail = []; // Clear trail
          capturedPercentage = calculateCapturedPercentage(); // Recalculate

          if (capturedPercentage >= TARGET_PERCENTAGE) {
            winGame();
            return; // Stop update for level change
          }
        }
        // Move player along border or onto captured cell
        player.x = nextX;
        player.y = nextY;
      } else if (nextCellState === CellState.UNCAPTURED) {
        // Moving onto uncaptured territory
        if (!isDrawing) {
          isDrawing = true;
          currentTrail = []; // Start new trail (FIXED: only add first uncaptured cell below)
        }
        currentTrail.push({ x: nextX, y: nextY }); // Add current uncaptured cell
        grid[nextY][nextX] = CellState.TRAIL;
        player.x = nextX;
        player.y = nextY;
      } else if (nextCellState === CellState.TRAIL) {
        // Player hit own trail
        console.log('Player hit own trail!');
        loseLife();
        return; // Stop update if life lost
      }
      // Implicit else: hit wall (out of bounds handled by initial check)
      // Player movement stops if no valid cell transition occurred.
    } // End boundary check
    // Player direction is reset by input handler, not here.
  } // End player movement check

  // --- Update Enemies --- (Run after player moves)
  if (!gameOverState) {
    updateEnemies(); // This now calls the function which delegates to enemyLogic
  }

  // Final checks only if game is still potentially running
  if (!gameOverState) {
    capturedPercentage = calculateCapturedPercentage(); // Update percentage display

    if (lives <= 0) {
      // Check if player or enemy action caused game over
      gameOverState = true;
      gameRunning = false;
      console.log('Game Over triggered.');
    }
  }
}

// --- Game Initialization Function ---
export function initGame(startLevel = 1, config = {}) {
  console.log('Initializing game logic...');
  const { baseEnemyCount = 2, basePatrollerCount = 1, enemySpeed = 1 } = config;

  score = 0;
  lives = 3;
  level = startLevel;
  capturedPercentage = 0;
  isDrawing = false;
  currentTrail = [];
  enemies = []; // Clear enemies before initializing
  gameOverState = false;
  gameRunning = true;
  lastScoreMilestone = 0;

  initializeGrid();
  resetPlayerPosition();
  // MODIFIED: Call imported initializeEnemies, passing received config
  enemies = initEnemiesFromLogic({
    level: startLevel,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    grid,
    player,
    // Pass down the config received by initGame
    baseEnemyCount,
    basePatrollerCount,
    enemySpeed,
  });
  capturedPercentage = calculateCapturedPercentage();
  console.log(`Game logic initialized. ${enemies.length} enemies spawned.`);
}

// --- Getters for State (Interface for Rendering/UI) ---
export function getGameState() {
  return {
    score,
    lives,
    level,
    capturedPercentage,
    player: { ...player }, // Return a copy
    grid: grid.map((row) => [...row]), // Return a deep copy
    enemies: enemies.map((e) => ({ ...e })), // Return copies
    isDrawing,
    currentTrail: currentTrail.map((p) => ({ ...p })), // Return copies
    gameOver: gameOverState,
    levelComplete: levelCompleteState, // Add level complete flag
    gameRunning,
    // Constants needed for rendering
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    targetPercentage: TARGET_PERCENTAGE,
  };
}

// --- Exported Functions (Public API) ---
export {
  updateGame,
  handlePlayerInput,
  checkGameOver,
  // triggerNextLevelStart // REMOVED from block export
  // initGame is already exported
};
