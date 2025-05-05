// src/classic-2d/gameLogic.js

export const GRID_COLS = 64;
export const GRID_ROWS = 48;
export const CELL_SIZE = 10; // Keep for logic potentially? Or move purely to render? Deciding later.

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
let enemies = [];
let gameOverState = false;
let gameRunning = true; // Might not be needed if loop is external
let lastScoreMilestone = 0;

const BASE_ENEMY_COUNT = 2;
const BASE_PATROLLER_COUNT = 1;
const ENEMY_SPEED = 1;
const TARGET_PERCENTAGE = 75;
const LEVEL_BONUS_SCORE = 1000;
const EXTRA_LIFE_SCORE_INTERVAL = 10000;

const PATROLLER_HISTORY_LENGTH = 4;
const STUCK_THRESHOLD = 10;

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

function initializeEnemies(currentLevel) {
  enemies = [];
  const totalEnemies = BASE_ENEMY_COUNT + Math.floor(currentLevel / 2);
  const patrollerCount = BASE_PATROLLER_COUNT + Math.floor(currentLevel / 3);
  const bouncerCount = Math.max(1, totalEnemies - patrollerCount);
  const currentEnemySpeed = Math.max(1, ENEMY_SPEED + Math.floor((currentLevel - 1) / 4));

  // Initialize Patrollers
  for (let i = 0; i < patrollerCount; i++) {
    let startX, startY, startDX, startDY;
    const side = i % 4;
    switch (side) {
      case 0:
        startX = 2;
        startY = 1;
        startDX = currentEnemySpeed;
        startDY = currentEnemySpeed; // Diagonal
        break;
      case 1:
        startX = GRID_COLS - 2;
        startY = 2;
        startDX = -currentEnemySpeed;
        startDY = currentEnemySpeed; // Diagonal
        break;
      case 2:
        startX = GRID_COLS - 3;
        startY = GRID_ROWS - 2;
        startDX = -currentEnemySpeed;
        startDY = -currentEnemySpeed; // Diagonal
        break;
      case 3:
      default:
        startX = 1;
        startY = GRID_ROWS - 3;
        startDX = currentEnemySpeed;
        startDY = -currentEnemySpeed; // Diagonal
        break;
    }
    // Ensure speed component exists if speed > 0
    if (startDX === 0 && startDY === 0 && currentEnemySpeed !== 0) {
      startDX = currentEnemySpeed;
      startDY = currentEnemySpeed;
    }

    enemies.push({
      type: 'patroller',
      x: startX,
      y: startY,
      dx: startDX,
      dy: startDY,
      speed: currentEnemySpeed,
      lastPositions: [],
      stuckCounter: 0,
    });
  }

  // Initialize Bouncers
  for (let i = 0; i < bouncerCount; i++) {
    let enemyX, enemyY;
    let attempts = 0;
    do {
      enemyX = Math.floor(Math.random() * (GRID_COLS - 4)) + 2;
      enemyY = Math.floor(Math.random() * (GRID_ROWS - 4)) + 2;
      attempts++;
      if (attempts > 100) break;
    } while (
      grid[enemyY]?.[enemyX] !== CellState.UNCAPTURED ||
      enemies.some((e) => e.x === enemyX && e.y === enemyY) ||
      (enemyX === player.x && enemyY === player.y)
    );

    const randQuadrant = Math.floor(Math.random() * 4);
    let dx = 0,
      dy = 0;
    if (randQuadrant === 0) {
      dx = currentEnemySpeed;
      dy = currentEnemySpeed;
    } else if (randQuadrant === 1) {
      dx = -currentEnemySpeed;
      dy = currentEnemySpeed;
    } else if (randQuadrant === 2) {
      dx = -currentEnemySpeed;
      dy = -currentEnemySpeed;
    } else {
      dx = currentEnemySpeed;
      dy = -currentEnemySpeed;
    }

    enemies.push({
      type: 'bouncer',
      x: enemyX,
      y: enemyY,
      dx: dx,
      dy: dy,
      speed: currentEnemySpeed,
      lastPositions: [],
      stuckCounter: 0,
    });
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
  enemies.forEach((enemy) => {
    if (enemy.type === 'bouncer') {
      updateBouncer(enemy);
    } else if (enemy.type === 'patroller') {
      updatePatroller(enemy);
    }

    // Check collision with player's current position AFTER enemy potentially moved
    if (enemy.x === player.x && enemy.y === player.y) {
      if (isDrawing) {
        console.log(`${enemy.type} hit player during drawing!`);
        loseLife();
        return; // Stop processing further enemies if life lost
      }
      // If not drawing, player is safe on captured territory or border
    }

    // Check collision with trail AFTER enemy potentially moved
    if (isDrawing && checkTrailAndLoseLife(enemy.x, enemy.y, enemy.type)) {
      // loseLife() is called within checkTrailAndLoseLife
      return; // Stop further processing for this enemy if life lost
    }
  });
}

function updateBouncer(enemy) {
  const { speed } = enemy;
  let currentX = enemy.x;
  let currentY = enemy.y;

  // Update history before moving
  enemy.lastPositions = enemy.lastPositions || [];
  enemy.lastPositions.push({ x: currentX, y: currentY });
  if (enemy.lastPositions.length > PATROLLER_HISTORY_LENGTH) {
    enemy.lastPositions.shift();
  }

  let newDx = enemy.dx;
  let newDy = enemy.dy;
  let bounced = false;

  // Check potential collision with boundaries or CAPTURED cells
  const checkCollision = (cx, cy) => {
    return (
      cx < 0 ||
      cx >= GRID_COLS ||
      cy < 0 ||
      cy >= GRID_ROWS ||
      grid[cy]?.[cx] === CellState.CAPTURED
    );
  };

  // Simulate step-by-step movement if speed > 1
  let nextX = currentX;
  let nextY = currentY;
  for (let step = 0; step < Math.abs(speed); ++step) {
    let stepStartX = nextX;
    let stepStartY = nextY;
    let stepNextX = stepStartX + Math.sign(newDx);
    let stepNextY = stepStartY + Math.sign(newDy);

    // Wall collision checks
    let collisionX = checkCollision(stepNextX, stepStartY);
    let collisionY = checkCollision(stepStartX, stepNextY);
    // Check corner collision slightly differently: if the diagonal move is blocked
    // but cardinal moves from current pos *would* be okay.
    let collisionCorner = checkCollision(stepNextX, stepNextY) && !collisionX && !collisionY;

    if (collisionCorner) {
      // Corner hit: Reverse both components
      console.log(`Bouncer corner collision at ${stepNextX}, ${stepNextY}`);
      newDx *= -1;
      newDy *= -1;
      bounced = true;
      // Don't advance position this step, use new direction next step
      break; // Stop step simulation for this frame after bounce
    } else {
      if (collisionX) {
        console.log(`Bouncer X collision at ${stepNextX}, ${stepStartY}`);
        newDx *= -1;
        bounced = true;
        // Don't advance X this step
        stepNextX = stepStartX;
      }
      if (collisionY) {
        console.log(`Bouncer Y collision at ${stepStartX}, ${stepNextY}`);
        newDy *= -1;
        bounced = true;
        // Don't advance Y this step
        stepNextY = stepStartY;
      }
    }

    // Check for trail collision during the step (at the intended next cell)
    if (isDrawing && checkTrailAndLoseLife(stepNextX, stepNextY, enemy.type)) {
      // Life lost, stop processing this enemy's movement for this frame
      return; // Exit updateBouncer
    }

    // Update position for the next step simulation or final assignment
    nextX = stepNextX;
    nextY = stepNextY;

    if (bounced) {
      // If bounced, recalculate final position based on remaining steps and new direction
      // Simplification for now: stop further steps in this frame after first bounce.
      break;
    }
  }

  // Update enemy direction state
  enemy.dx = newDx;
  enemy.dy = newDy;

  // Update final position
  enemy.x = nextX;
  enemy.y = nextY;

  // --- Stuck Detection --- (Moved after position update)
  if (enemy.lastPositions.length >= PATROLLER_HISTORY_LENGTH) {
    const firstPos = enemy.lastPositions[0];
    if (enemy.x === firstPos.x && enemy.y === firstPos.y) {
      enemy.stuckCounter = (enemy.stuckCounter || 0) + 1;
    } else {
      enemy.stuckCounter = 0;
    }
    if (enemy.stuckCounter >= STUCK_THRESHOLD) {
      console.log(`Bouncer seems stuck at ${enemy.x},${enemy.y}. Reversing.`);
      enemy.dx *= -1;
      enemy.dy *= -1;
      enemy.stuckCounter = 0;
      enemy.lastPositions = [];
    }
  }

  // --- Safety Net: Ensure bouncers stay within UNCAPTURED --- (can be kept)
  if (grid[enemy.y]?.[enemy.x] === CellState.CAPTURED) {
    console.warn(`Bouncer ended up on captured tile at ${enemy.x},${enemy.y}. Moving back.`);
    // Attempt to move back to the last known position
    const lastPos = enemy.lastPositions[enemy.lastPositions.length - 2]; // Position before this move
    if (lastPos && grid[lastPos.y]?.[lastPos.x] !== CellState.CAPTURED) {
      enemy.x = lastPos.x;
      enemy.y = lastPos.y;
    } else {
      // If can't move back (e.g., started on captured), force bounce and hope for the best
      enemy.dx *= -1;
      enemy.dy *= -1;
      // Or consider random placement as before if truly trapped
      console.error(`Bouncer fallback failed, still on captured at ${enemy.x},${enemy.y}`);
    }
  }
}

// --- Reverted Patroller Logic (Mirroring) ---
function updatePatroller(enemy) {
  const { speed } = enemy; // Speed isn't directly used in step check, but for potential magnitude
  let { dx, dy, x, y } = enemy;

  // --- Basic Stuck Detection ---
  enemy.lastPositions = enemy.lastPositions || [];
  enemy.lastPositions.push({ x, y });
  if (enemy.lastPositions.length > PATROLLER_HISTORY_LENGTH) {
    enemy.lastPositions.shift();
  }
  if (enemy.lastPositions.length >= PATROLLER_HISTORY_LENGTH) {
    const firstPos = enemy.lastPositions[0];
    if (x === firstPos.x && y === firstPos.y) {
      enemy.stuckCounter = (enemy.stuckCounter || 0) + 1;
    } else {
      enemy.stuckCounter = 0; // Reset if moved
    }

    if (enemy.stuckCounter >= STUCK_THRESHOLD) {
      console.log(`Patroller stuck at ${x},${y}. Reversing direction.`);
      dx *= -1;
      dy *= -1;
      // Ensure direction is non-zero if speed > 0
      if (dx === 0 && dy === 0 && speed !== 0) {
        dx = speed; // Default right
      }
      enemy.stuckCounter = 0;
      enemy.lastPositions = [];
    }
  }
  // --- End Stuck Detection ---

  // Calculate potential next position (single step)
  const nextX = x + dx;
  const nextY = y + dy;

  // Check for trail collision first
  if (isDrawing && checkTrailAndLoseLife(nextX, nextY, enemy.type)) {
    return; // Stop processing this enemy if life lost
  }

  // Check the state of the target cell and adjacent cells for reflection logic
  const targetState = getCellState(nextX, nextY);
  const wallCheckX = getCellState(x + dx, y);
  const wallCheckY = getCellState(x, y + dy);

  let reflectX = false;
  let reflectY = false;

  // Reflect if the path ahead in X direction is blocked
  if (wallCheckX !== CellState.CAPTURED) {
    reflectX = true;
  }
  // Reflect if the path ahead in Y direction is blocked
  if (wallCheckY !== CellState.CAPTURED) {
    reflectY = true;
  }

  // Apply reflections
  if (reflectX) {
    dx *= -1;
  }
  if (reflectY) {
    dy *= -1;
  }

  // Update the enemy's direction state
  enemy.dx = dx;
  enemy.dy = dy;

  // Check if the *actual* target cell (diagonal) is pathable *after* potential reflection
  const finalTargetState = getCellState(x + dx, y + dy);

  // Move only if the final target cell is CAPTURED path
  if (finalTargetState === CellState.CAPTURED) {
    enemy.x += dx;
    enemy.y += dy;
  } else {
    // If the final target is still blocked even after reflection (e.g., inner corner), don't move.
    console.log(
      `Patroller move blocked at (${x},${y}) to (${x + dx},${y + dy}). State: ${finalTargetState}`
    );
  }

  // --- Safety Net (Optional but recommended) ---
  // Ensure patroller stays on path if something unexpected happened
  if (getCellState(enemy.x, enemy.y) !== CellState.CAPTURED) {
    console.warn(`Patroller ended up off-path at ${enemy.x},${enemy.y}. Moving back.`);
    const lastPos = enemy.lastPositions[enemy.lastPositions.length - 2]; // Use history
    if (lastPos && getCellState(lastPos.x, lastPos.y) === CellState.CAPTURED) {
      enemy.x = lastPos.x;
      enemy.y = lastPos.y;
    } else {
      // Fallback reset if history is also bad
      console.error(`Patroller off-path fallback failed. Resetting.`);
      enemy.x = 1;
      enemy.y = 1;
      enemy.dx = speed;
      enemy.dy = 0;
    }
  }
}
// --- End Reverted Patroller Logic ---

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
    loseLife();
    return true; // Indicate life was lost
  }
  return false;
};

function winGame() {
  console.log(`Level ${level} Complete! Score: ${score}`);
  score += LEVEL_BONUS_SCORE * level; // Award level bonus
  level++;
  startNextLevel(); // Proceed to the next level
}

function startNextLevel() {
  console.log(`Starting Level ${level}`);
  isDrawing = false;
  currentTrail = [];
  initializeGrid(); // Reinitialize grid
  initializeEnemies(level); // Spawn enemies for the new level
  resetPlayerPosition();
  capturedPercentage = calculateCapturedPercentage(); // Recalculate after grid reset
  lastScoreMilestone = Math.floor(score / EXTRA_LIFE_SCORE_INTERVAL) * EXTRA_LIFE_SCORE_INTERVAL;
  gameRunning = true;
  gameOverState = false;
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
    // Don't update enemies if player action caused game over
    updateEnemies();
  }

  // Final checks only if game is still potentially running
  if (!gameOverState) {
    capturedPercentage = calculateCapturedPercentage(); // Update percentage display

    if (lives <= 0) {
      // Check if enemy action caused game over
      gameOverState = true;
      gameRunning = false;
      console.log('Game Over triggered after enemy updates.');
    }
  }
}

// --- Game Initialization Function ---
export function initGame(startLevel = 1) {
  console.log('Initializing game logic...');
  score = 0;
  lives = 3;
  level = startLevel;
  capturedPercentage = 0;
  isDrawing = false;
  currentTrail = [];
  enemies = [];
  gameOverState = false;
  gameRunning = true;
  lastScoreMilestone = 0;

  initializeGrid();
  resetPlayerPosition();
  initializeEnemies(level);
  capturedPercentage = calculateCapturedPercentage();
  console.log('Game logic initialized.');
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
    gameRunning,
    // Constants needed for rendering
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    cellSize: CELL_SIZE,
    targetPercentage: TARGET_PERCENTAGE,
  };
}

// --- Exported Functions (Public API) ---
export {
  updateGame,
  handlePlayerInput,
  checkGameOver,
  // initGame is already exported
};
