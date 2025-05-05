// src/classic-2d/enemyLogic.js

import { CellState } from './gameLogic.js'; // Import shared CellState

// --- Constants ---
// REMOVED: const BASE_ENEMY_COUNT = 2;
// REMOVED: const BASE_PATROLLER_COUNT = 1;
// REMOVED: const ENEMY_SPEED = 1;
const PATROLLER_HISTORY_LENGTH = 4;
const STUCK_THRESHOLD = 10;

// --- Helper Functions (Internal) ---

const getCellState = (grid, gridCols, gridRows, cx, cy) => {
  if (cx < 0 || cx >= gridCols || cy < 0 || cy >= gridRows) {
    return undefined; // Out of bounds
  }
  return grid[cy]?.[cx];
};

// --- Enemy Update Logic (Internal) ---

function updateBouncer(enemy, grid, gridCols, gridRows, isDrawing, currentTrail) {
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
  let lifeLostInStep = false;

  // Check potential collision with boundaries or CAPTURED cells
  const checkCollision = (cx, cy) => {
    return (
      cx < 0 ||
      cx >= gridCols ||
      cy < 0 ||
      cy >= gridRows ||
      getCellState(grid, gridCols, gridRows, cx, cy) === CellState.CAPTURED
    );
  };

  // Simulate step-by-step movement
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
    let collisionCorner = checkCollision(stepNextX, stepNextY) && !collisionX && !collisionY;

    if (collisionCorner) {
      newDx *= -1;
      newDy *= -1;
      bounced = true;
      break; // Stop step simulation
    } else {
      if (collisionX) {
        newDx *= -1;
        bounced = true;
        stepNextX = stepStartX;
      }
      if (collisionY) {
        newDy *= -1;
        bounced = true;
        stepNextY = stepStartY;
      }
    }

    // Check for trail collision during the step
    if (isDrawing && currentTrail.some((p) => p.x === stepNextX && p.y === stepNextY)) {
      console.log(`Bouncer hit trail at ${stepNextX}, ${stepNextY}!`);
      lifeLostInStep = true;
      break; // Stop simulation, flag for life loss
    }

    nextX = stepNextX;
    nextY = stepNextY;

    if (bounced) {
      break; // Stop step simulation after first bounce
    }
  }

  // Update enemy direction state
  enemy.dx = newDx;
  enemy.dy = newDy;

  // Update final position only if no life was lost during steps
  if (!lifeLostInStep) {
    enemy.x = nextX;
    enemy.y = nextY;
  }

  // --- Stuck Detection ---
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

  // --- Safety Net ---
  if (getCellState(grid, gridCols, gridRows, enemy.x, enemy.y) === CellState.CAPTURED) {
    console.warn(`Bouncer ended on captured tile at ${enemy.x},${enemy.y}. Moving back.`);
    const lastPos = enemy.lastPositions[enemy.lastPositions.length - 2];
    if (
      lastPos &&
      getCellState(grid, gridCols, gridRows, lastPos.x, lastPos.y) !== CellState.CAPTURED
    ) {
      enemy.x = lastPos.x;
      enemy.y = lastPos.y;
    } else {
      enemy.dx *= -1;
      enemy.dy *= -1;
      console.error(`Bouncer fallback failed at ${enemy.x},${enemy.y}`);
    }
  }
  return lifeLostInStep; // Return whether this enemy caused a life loss
}

function updatePatroller(enemy, grid, gridCols, gridRows, isDrawing, currentTrail) {
  const { speed } = enemy;
  let { dx, dy, x, y } = enemy;
  let lifeLostInStep = false;

  // Update history before moving
  enemy.lastPositions = enemy.lastPositions || [];
  enemy.lastPositions.push({ x, y });
  if (enemy.lastPositions.length > PATROLLER_HISTORY_LENGTH) {
    enemy.lastPositions.shift();
  }

  // Helper to check if a cell is a valid path (CAPTURED)
  const isPath = (cx, cy) => {
    return (
      cx >= 0 &&
      cx < gridCols &&
      cy >= 0 &&
      cy < gridRows &&
      getCellState(grid, gridCols, gridRows, cx, cy) === CellState.CAPTURED
    );
  };

  // --- Basic Stuck Detection ---
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
      if (dx === 0 && dy === 0 && speed !== 0) {
        dx = speed;
      }
      enemy.stuckCounter = 0;
      enemy.lastPositions = [];
    }
  }
  // --- End Stuck Detection ---

  // Calculate potential next position (single step based on current dx, dy)
  const nextX = x + dx;
  const nextY = y + dy;

  // Check for trail collision first
  if (isDrawing && currentTrail.some((p) => p.x === nextX && p.y === nextY)) {
    console.log(`Patroller hit trail at ${nextX}, ${nextY}!`);
    return true; // Life lost
  }

  // Check the state of the target cell and adjacent cells for reflection logic
  const targetState = getCellState(grid, gridCols, gridRows, nextX, nextY);
  const wallCheckX = getCellState(grid, gridCols, gridRows, x + dx, y);
  const wallCheckY = getCellState(grid, gridCols, gridRows, x, y + dy);

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

  // Check if the *actual* target cell is pathable *after* potential reflection
  const finalTargetState = getCellState(grid, gridCols, gridRows, x + dx, y + dy);

  // Move only if the final target cell is CAPTURED path
  if (finalTargetState === CellState.CAPTURED) {
    enemy.x += dx;
    enemy.y += dy;
  } else {
    console.log(
      `Patroller move blocked at (${x},${y}) to (${x + dx},${y + dy}). State: ${finalTargetState}`
    );
  }

  // --- Safety Net ---
  if (getCellState(grid, gridCols, gridRows, enemy.x, enemy.y) !== CellState.CAPTURED) {
    console.warn(`Patroller ended on off-path tile at ${enemy.x},${enemy.y}. Moving back.`);
    const lastPos = enemy.lastPositions[enemy.lastPositions.length - 2];
    if (
      lastPos &&
      getCellState(grid, gridCols, gridRows, lastPos.x, lastPos.y) === CellState.CAPTURED
    ) {
      enemy.x = lastPos.x;
      enemy.y = lastPos.y;
    } else {
      console.error(`Patroller off-path fallback failed at ${enemy.x},${enemy.y}`);
      enemy.x = 1;
      enemy.y = 1;
      enemy.dx = speed;
      enemy.dy = 0;
    }
  }
  return false; // No life lost by this specific move/check
}

// --- Exported Functions ---

export function initializeEnemies(config) {
  const {
    level,
    gridCols,
    gridRows,
    grid,
    player,
    baseEnemyCount,
    basePatrollerCount,
    enemySpeed,
  } = config;
  let newEnemies = [];
  const totalEnemies = baseEnemyCount + Math.floor(level / 2);
  const patrollerCount = basePatrollerCount + Math.floor(level / 3);
  const bouncerCount = Math.max(1, totalEnemies - patrollerCount);
  const currentEnemySpeed = Math.max(1, enemySpeed + Math.floor((level - 1) / 4));

  // Initialize Patrollers
  for (let i = 0; i < patrollerCount; i++) {
    let startX, startY, startDX, startDY;
    const side = i % 4;
    switch (side) {
      case 0:
        startX = 2;
        startY = 1;
        startDX = currentEnemySpeed;
        startDY = currentEnemySpeed;
        break;
      case 1:
        startX = gridCols - 2;
        startY = 2;
        startDX = -currentEnemySpeed;
        startDY = currentEnemySpeed;
        break;
      case 2:
        startX = gridCols - 3;
        startY = gridRows - 2;
        startDX = -currentEnemySpeed;
        startDY = -currentEnemySpeed;
        break;
      default:
        startX = 1;
        startY = gridRows - 3;
        startDX = currentEnemySpeed;
        startDY = -currentEnemySpeed;
        break;
    }
    if (startDX === 0 && startDY === 0 && currentEnemySpeed !== 0) {
      startDX = currentEnemySpeed;
      startDY = currentEnemySpeed;
    }
    newEnemies.push({
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
      enemyX = Math.floor(Math.random() * (gridCols - 4)) + 2;
      enemyY = Math.floor(Math.random() * (gridRows - 4)) + 2;
      attempts++;
      if (attempts > 100) break;
    } while (
      getCellState(grid, gridCols, gridRows, enemyX, enemyY) !== CellState.UNCAPTURED ||
      newEnemies.some((e) => e.x === enemyX && e.y === enemyY) ||
      (player && enemyX === player.x && enemyY === player.y) // Check player position if available
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

    newEnemies.push({
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
  return newEnemies;
}

export function updateAllEnemies(config) {
  const { enemies, grid, player, isDrawing, currentTrail, gridCols, gridRows } = config;
  let lifeLost = false;

  for (const enemy of enemies) {
    let enemyCausedLifeLoss = false;
    if (enemy.type === 'bouncer') {
      enemyCausedLifeLoss = updateBouncer(enemy, grid, gridCols, gridRows, isDrawing, currentTrail);
    } else if (enemy.type === 'patroller') {
      enemyCausedLifeLoss = updatePatroller(
        enemy,
        grid,
        gridCols,
        gridRows,
        isDrawing,
        currentTrail
      );
    }

    if (enemyCausedLifeLoss) {
      lifeLost = true;
      break; // Stop processing other enemies if one caused life loss
    }

    // Check collision with player's current position AFTER enemy potentially moved
    if (player && enemy.x === player.x && enemy.y === player.y) {
      if (isDrawing) {
        console.log(`${enemy.type} hit player during drawing!`);
        lifeLost = true;
        break; // Stop processing other enemies
      }
    }
  }

  // Return the result
  // Note: enemies array is modified in-place within updateBouncer/updatePatroller
  return { lifeLost };
}
