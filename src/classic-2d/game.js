'use strict';

// Wait for the DOM to be fully loaded before running the game script
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get 2D context!');
    return;
  }

  // --- Game Constants (adjust as needed) ---
  const GRID_COLS = 64; // Number of columns
  const GRID_ROWS = 48; // Number of rows
  const CELL_SIZE = 10; // Size of each grid cell in pixels

  const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
  const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

  const PLAYER_START_POS = { x: GRID_COLS / 2, y: GRID_ROWS - 2 }; // Start on inner edge of 2-cell border

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // --- Game State (placeholders) ---
  let score = 0;
  let lives = 3;
  let level = 1; // Start at level 1
  let capturedPercentage = 0;
  let player = { ...PLAYER_START_POS, dx: 0, dy: 0 }; // Use constant
  let grid = []; // 2D array for grid state
  let currentTrail = [];
  let isDrawing = false;
  let enemies = [];
  let gameOverState = false; // Game over flag
  let gameRunning = true; // To pause the loop
  let lastScoreMilestone = 0; // For awarding extra lives

  const BASE_ENEMY_COUNT = 2;
  const BASE_PATROLLER_COUNT = 1;
  const ENEMY_SPEED = 1; // Base speed
  const TARGET_PERCENTAGE = 75; // Win condition
  const LEVEL_BONUS_SCORE = 1000;
  const EXTRA_LIFE_SCORE_INTERVAL = 10000; // Points needed for an extra life

  const PATROLLER_HISTORY_LENGTH = 4;
  const STUCK_THRESHOLD = 10;

  // --- Cell States Enum (Simple JS version) ---
  const CellState = {
    UNCAPTURED: 0,
    CAPTURED: 1,
    TRAIL: 2,
  };

  // --- Helper Functions (placeholders) ---
  function initializeGrid() {
    grid = Array(GRID_ROWS)
      .fill(null)
      .map(() => Array(GRID_COLS).fill(CellState.UNCAPTURED));
    // Initialize a 2-cell thick border as captured
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (x <= 1 || x >= GRID_COLS - 2 || y <= 1 || y >= GRID_ROWS - 2) {
          // Check <= 1 and >= GRID_* - 2
          grid[y][x] = CellState.CAPTURED;
        }
      }
    }
    console.log('Grid initialized');
  }

  function initializeEnemies(currentLevel) {
    enemies = [];
    // --- Difficulty Scaling ---
    const totalEnemies = BASE_ENEMY_COUNT + Math.floor(currentLevel / 2);
    const patrollerCount = BASE_PATROLLER_COUNT + Math.floor(currentLevel / 3);
    const bouncerCount = Math.max(1, totalEnemies - patrollerCount);
    // Increase speed slightly per level, ensure it's at least 1
    const currentEnemySpeed = Math.max(1, ENEMY_SPEED + Math.floor((currentLevel - 1) / 4));

    console.log(
      `Level ${currentLevel}: Spawning ${patrollerCount} patrollers, ${bouncerCount} bouncers. Speed: ${currentEnemySpeed}`
    );

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
          startX = GRID_COLS - 2;
          startY = 2;
          startDX = -currentEnemySpeed;
          startDY = currentEnemySpeed;
          break;
        case 2:
          startX = GRID_COLS - 3;
          startY = GRID_ROWS - 2;
          startDX = -currentEnemySpeed;
          startDY = -currentEnemySpeed;
          break;
        case 3:
          startX = 1;
          startY = GRID_ROWS - 3;
          startDX = currentEnemySpeed;
          startDY = -currentEnemySpeed;
          break;
      }
      if (startDX === 0 || startDY === 0) {
        startDX = (Math.random() > 0.5 ? 1 : -1) * currentEnemySpeed;
        startDY = (Math.random() > 0.5 ? 1 : -1) * currentEnemySpeed;
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
        if (attempts > 100) {
          // Prevent infinite loop if grid is full
          console.warn('Could not place bouncer easily, placing randomly.');
          break;
        }
      } while (
        grid[enemyY]?.[enemyX] !== CellState.UNCAPTURED ||
        enemies.some((e) => e.x === enemyX && e.y === enemyY) ||
        (enemyX === player.x && enemyY === player.y)
      );

      const angle = Math.random() * Math.PI * 2;
      let dx = Math.round(Math.cos(angle) * currentEnemySpeed);
      let dy = Math.round(Math.sin(angle) * currentEnemySpeed);
      if (dx === 0 && dy === 0) {
        dx = Math.random() > 0.5 ? currentEnemySpeed : -currentEnemySpeed;
        dy = 0; // Default to horizontal if no movement
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
    console.log('Enemies initialized:', enemies);
  }

  function resetPlayerPosition() {
    player.x = PLAYER_START_POS.x;
    player.y = PLAYER_START_POS.y;
    player.dx = 0;
    player.dy = 0;
  }

  function loseLife() {
    lives--;
    console.log(`Life lost! Lives remaining: ${lives}`);
    isDrawing = false;
    // Clear visual trail from grid
    currentTrail.forEach((p) => {
      if (grid[p.y]?.[p.x] === CellState.TRAIL) {
        grid[p.y][p.x] = CellState.UNCAPTURED;
      }
    });
    currentTrail = [];
    resetPlayerPosition();
    updateUI();

    if (lives <= 0) {
      // TODO: Implement Game Over logic
      console.log('GAME OVER');
      alert('Game Over!'); // Simple alert for now
      // Optionally reset game or stop loop
    }
  }

  function updateUI() {
    // Add checks for element existence
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const capturedEl = document.getElementById('captured');
    const levelEl = document.getElementById('level'); // Get level element
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (capturedEl) capturedEl.textContent = capturedPercentage.toFixed(0);
    if (levelEl) levelEl.textContent = level; // Update level display
  }

  function handleInput(event) {
    console.log('Key pressed:', event.key);
    // Prevent default browser actions for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
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

  /**
   * Performs a flood fill starting from a point.
   * Returns the filled area and whether an enemy was found.
   * @param startX Starting X grid coordinate.
   * @param startY Starting Y grid coordinate.
   * @param targetGrid The grid state to fill on (usually a temporary copy).
   * @param enemies Current enemy grid positions.
   * @returns {{filledPoints: {x: number, y: number}[], enemyFound: boolean}}
   */
  function floodFill(startX, startY, targetGrid, enemies) {
    const filledPoints = [];
    let enemyFound = false;
    const queue = [{ x: startX, y: startY }];
    const visited = new Set(); // Keep track of visited cells to prevent infinite loops
    visited.add(`${startX},${startY}`);

    // Check if the starting point itself is valid for filling
    if (
      startX < 0 ||
      startX >= GRID_COLS ||
      startY < 0 ||
      startY >= GRID_ROWS ||
      targetGrid[startY][startX] !== CellState.UNCAPTURED
    ) {
      return { filledPoints, enemyFound: false }; // Cannot start fill here
    }

    // Check for enemy at start point
    if (enemies.some((e) => e.x === startX && e.y === startY)) {
      return { filledPoints, enemyFound: true };
    }

    filledPoints.push({ x: startX, y: startY });

    while (queue.length > 0) {
      const { x, y } = queue.shift();

      // Check neighbors (Up, Down, Left, Right)
      const neighbors = [
        { nx: x, ny: y - 1 },
        { nx: x, ny: y + 1 },
        { nx: x - 1, ny: y },
        { nx: x + 1, ny: y },
      ];

      for (const neighbor of neighbors) {
        const { nx, ny } = neighbor;
        const visitedKey = `${nx},${ny}`;

        // Check boundaries and if already visited
        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS || visited.has(visitedKey)) {
          continue;
        }

        visited.add(visitedKey); // Mark as visited
        const cellState = targetGrid[ny][nx];

        if (cellState === CellState.UNCAPTURED) {
          // Check for enemies in this new cell
          if (enemies.some((e) => e.x === nx && e.y === ny)) {
            enemyFound = true;
            // Continue filling to find the whole area, but mark enemy presence
          }
          filledPoints.push({ x: nx, y: ny });
          queue.push({ x: nx, y: ny });
        }
        // Do not cross TRAIL or CAPTURED boundaries during fill
      }
    }

    return { filledPoints, enemyFound };
  }

  /**
   * Processes the completed trail, performs flood fill, and updates the main grid.
   * @param completedTrail Array of points in the trail.
   */
  function floodFillAndCapture(completedTrail) {
    console.log('floodFillAndCapture called with trail length:', completedTrail.length);
    if (completedTrail.length < 3) return 0;

    const tempGrid = grid.map((row) => [...row]);
    completedTrail.forEach((p) => {
      if (tempGrid[p.y]?.[p.x] !== undefined && tempGrid[p.y][p.x] !== CellState.CAPTURED) {
        tempGrid[p.y][p.x] = CellState.TRAIL;
      }
    });

    const potentialFillStarts = new Set();
    completedTrail.forEach((trailPoint) => {
      const neighbors = [
        { nx: trailPoint.x, ny: trailPoint.y - 1 },
        { nx: trailPoint.x, ny: trailPoint.y + 1 },
        { nx: trailPoint.x - 1, ny: trailPoint.y },
        { nx: trailPoint.x + 1, ny: trailPoint.y },
      ];
      neighbors.forEach(({ nx, ny }) => {
        if (
          nx >= 0 &&
          nx < GRID_COLS &&
          ny >= 0 &&
          ny < GRID_ROWS &&
          tempGrid[ny][nx] === CellState.UNCAPTURED
        ) {
          potentialFillStarts.add(`${nx},${ny}`);
        }
      });
    });
    console.log('Potential fill starts:', Array.from(potentialFillStarts));

    const validFilledAreas = []; // Store only areas without enemies
    potentialFillStarts.forEach((startKey) => {
      const [startX, startY] = startKey.split(',').map(Number);
      if (tempGrid[startY][startX] === CellState.UNCAPTURED) {
        // Check if not already filled in this cycle
        console.log(`Starting flood fill from: (${startX}, ${startY})`);
        const fillResult = floodFill(startX, startY, tempGrid, enemies);
        console.log(
          `Fill result from (${startX}, ${startY}): Points=${fillResult.filledPoints.length}, EnemyFound=${fillResult.enemyFound}`
        );
        if (fillResult.filledPoints.length > 0) {
          // Mark filled area on temp grid to prevent re-filling starting from the same area
          fillResult.filledPoints.forEach((p) => (tempGrid[p.y][p.x] = CellState.CAPTURED));
          if (!fillResult.enemyFound) {
            validFilledAreas.push(fillResult.filledPoints);
          }
        }
      }
    });

    let actualPointsAdded = 0;
    if (validFilledAreas.length > 0) {
      // Find the minimum size among valid areas
      let minSize = Infinity;
      validFilledAreas.forEach((area) => {
        minSize = Math.min(minSize, area.length);
      });
      console.log(`Found ${validFilledAreas.length} valid areas. Minimum size: ${minSize}`);

      // Capture all valid areas that have the minimum size
      validFilledAreas.forEach((area) => {
        if (area.length === minSize) {
          console.log(`Updating main grid for area size: ${area.length}`);
          area.forEach((p) => {
            if (grid[p.y][p.x] !== CellState.CAPTURED) {
              grid[p.y][p.x] = CellState.CAPTURED;
              actualPointsAdded++;
            }
          });
        }
      });
    } else {
      console.log('No valid areas found to capture (all contained enemies or were empty).');
    }

    // Clean up trail path on the main grid
    console.log('Cleaning up trail path on main grid');
    completedTrail.forEach((p) => {
      if (grid[p.y]?.[p.x] === CellState.TRAIL) {
        grid[p.y][p.x] = CellState.CAPTURED;
      }
    });

    console.log('floodFillAndCapture finished.');
    // Check win condition AFTER updating the grid and recalculating
    capturedPercentage = calculateCapturedPercentage();
    updateUI(); // Update UI immediately after capture
    if (capturedPercentage >= TARGET_PERCENTAGE) {
      winGame();
    }

    // --- Scoring --- Calculate points based on cells captured
    const POINTS_PER_CELL = 10; // Example score value per captured cell
    score += actualPointsAdded * POINTS_PER_CELL;
    console.log(`Score updated: ${score}`);

    // --- Extra Life Check ---
    if (score >= lastScoreMilestone + EXTRA_LIFE_SCORE_INTERVAL) {
      lives++;
      lastScoreMilestone += EXTRA_LIFE_SCORE_INTERVAL;
      console.log(`Extra Life! Score: ${score}, Lives: ${lives}`);
      // Optional: Add a visual/audio cue here
      updateUI(); // Update UI immediately to show new life
    }

    return actualPointsAdded; // Return captured count for scoring maybe?
  }

  function calculateCapturedPercentage() {
    let capturedCount = 0;
    let totalPlayable = 0;
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        // Count only the inner area, excluding the 2-cell border
        if (x > 1 && x < GRID_COLS - 2 && y > 1 && y < GRID_ROWS - 2) {
          totalPlayable++;
          if (grid[y][x] === CellState.CAPTURED) {
            capturedCount++;
          }
        }
      }
    }
    return totalPlayable > 0 ? (capturedCount / totalPlayable) * 100 : 0;
  }

  function updateEnemies() {
    console.log(`Update Tick - Enemies Count: ${enemies.length}`, enemies);
    enemies.forEach((enemy, index) => {
      if (enemy.type === 'bouncer') {
        updateBouncer(enemy);
      } else if (enemy.type === 'patroller') {
        updatePatroller(enemy);
      }
    });
  }

  function updateBouncer(enemy) {
    const currentX = enemy.x;
    const currentY = enemy.y;
    let nextDX = enemy.dx;
    let nextDY = enemy.dy;
    let nextX = currentX + nextDX;
    let nextY = currentY + nextDY;

    let bounced = false;
    let collidedX = false;
    let collidedY = false;

    // Check intended next cell state
    const nextCellState = grid[nextY]?.[nextX];

    // --- Bouncer Collision Logic ---
    // Bounce off Trail, Captured, or out-of-bounds
    if (nextCellState === CellState.TRAIL) {
      console.log('Bouncer hit trail!');
      loseLife();
      return; // Stop processing this enemy
    }

    // Check X collision (against Captured or Bounds within playable area)
    const xTargetState = grid[currentY]?.[nextX];
    // Bouncer bounces off inner edge (x=1, x=GRID_COLS-2)
    if (nextX <= 1 || nextX >= GRID_COLS - 2 || xTargetState === CellState.CAPTURED) {
      nextDX *= -1;
      collidedX = true;
      bounced = true;
    }
    // Check Y collision (against Captured or Bounds within playable area)
    const yTargetState = grid[nextY]?.[currentX];
    // Bouncer bounces off inner edge (y=1, y=GRID_ROWS-2)
    if (nextY <= 1 || nextY >= GRID_ROWS - 2 || yTargetState === CellState.CAPTURED) {
      nextDY *= -1;
      collidedY = true;
      bounced = true;
    }

    // --- Add Bounce Randomness (if bounced) ---
    if (bounced) {
      const magnitude = enemy.speed;
      let angle = Math.atan2(nextDY / magnitude, nextDX / magnitude);
      angle += (Math.random() - 0.5) * 0.5;
      nextDX = Math.round(Math.cos(angle) * magnitude);
      nextDY = Math.round(Math.sin(angle) * magnitude);
      if (nextDX === 0 && nextDY === 0) {
        if (collidedX && !collidedY) nextDY = Math.random() > 0.5 ? magnitude : -magnitude;
        else if (!collidedX && collidedY) nextDX = Math.random() > 0.5 ? magnitude : -magnitude;
        else {
          nextDX = Math.random() > 0.5 ? magnitude : -magnitude;
          nextDY = 0;
        }
      }
    }

    // Update enemy direction for next frame regardless of move success
    enemy.dx = nextDX;
    enemy.dy = nextDY;

    // --- Final Movement Check ---
    // Calculate final potential position based on potentially updated direction
    const finalNextX = currentX + nextDX;
    const finalNextY = currentY + nextDY;
    const finalCellState = grid[finalNextY]?.[finalNextX];

    // Can only move if the final target cell is UNCAPTURED and within inner bounds
    if (
      finalNextX > 1 &&
      finalNextX < GRID_COLS - 2 &&
      finalNextY > 1 &&
      finalNextY < GRID_ROWS - 2 &&
      finalCellState === CellState.UNCAPTURED
    ) {
      enemy.x = finalNextX;
      enemy.y = finalNextY;
    } else {
      // Cannot move into wall/captured/trail, stays put this frame
      // Direction might have changed due to bounce/randomization for next frame
      // console.log("Bouncer movement blocked");
    }
  }

  function updatePatroller(enemy) {
    const { x, y, speed } = enemy;
    let { dx, dy } = enemy; // Current direction vector

    const logPrefix = `Patroller (${x},${y} | dx:${dx},dy:${dy}) spd:${speed} -`;
    // console.log(`${logPrefix} START TICK`); // Keep internal logs commented for now unless needed

    // --- Stuck Detection ---
    enemy.lastPositions.push({ x, y });
    if (enemy.lastPositions.length > PATROLLER_HISTORY_LENGTH) {
      enemy.lastPositions.shift();
    }

    let isStuck = false;
    if (enemy.lastPositions.length === PATROLLER_HISTORY_LENGTH) {
      const firstPos = enemy.lastPositions[0];
      isStuck = enemy.lastPositions.every((p) => p.x === firstPos.x && p.y === firstPos.y);
    }

    if (isStuck) {
      enemy.stuckCounter++;
      // console.log(`${logPrefix} Stuck Check: Counter = ${enemy.stuckCounter}`);
    } else {
      enemy.stuckCounter = 0;
    }

    if (enemy.stuckCounter >= STUCK_THRESHOLD) {
      console.log(`${logPrefix} STUCK! Randomizing direction.`);
      const angle = Math.random() * Math.PI * 2;
      enemy.dx = Math.round(Math.cos(angle) * speed) || (Math.random() > 0.5 ? speed : -speed);
      enemy.dy = Math.round(Math.sin(angle) * speed) || (Math.random() > 0.5 ? speed : -speed);
      dx = enemy.dx;
      dy = enemy.dy;
      enemy.stuckCounter = 0;
      enemy.lastPositions = [];
    }

    // --- Movement Logic ---
    const normDX = Math.sign(dx);
    const normDY = Math.sign(dy);

    const getCellState = (cx, cy) => {
      if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS) return null;
      return grid[cy]?.[cx];
    };

    const checkTrailAndLoseLife = (targetX, targetY, enemyType) => {
      if (getCellState(targetX, targetY) === CellState.TRAIL) {
        console.log(`${enemyType} hit trail!`);
        loseLife();
        return true;
      }
      return false;
    };

    // Calculate potential next position
    const nextX = x + dx;
    const nextY = y + dy;

    // Check for trail collision at the target
    if (checkTrailAndLoseLife(nextX, nextY, 'Patroller')) {
      return; // Stop processing if trail is hit
    }

    const targetState = getCellState(nextX, nextY);
    // console.log(`${logPrefix} Target (${nextX},${nextY}) State: ${targetState}`);

    let reflectX = false;
    let reflectY = false;

    // Check for reflection conditions based on *adjacent* cells in path direction
    const horizontalCheckX = x + normDX * speed;
    const verticalCheckY = y + normDY * speed;

    if (getCellState(horizontalCheckX, y) !== CellState.CAPTURED) {
      reflectX = true;
      // console.log(`${logPrefix} Reflect X based on (${horizontalCheckX}, ${y})`);
    }
    if (getCellState(x, verticalCheckY) !== CellState.CAPTURED) {
      reflectY = true;
      // console.log(`${logPrefix} Reflect Y based on (${x}, ${verticalCheckY})`);
    }

    let reflected = false;
    if (reflectX) {
      enemy.dx *= -1;
      reflected = true;
    }
    if (reflectY) {
      enemy.dy *= -1;
      reflected = true;
    }

    // --- Execute Move ---
    // Only move if the original target cell was CAPTURED and we didn't reflect.
    if (!reflected && targetState === CellState.CAPTURED) {
      enemy.x = nextX;
      enemy.y = nextY;
      // console.log(`${logPrefix} Moved to (${nextX}, ${nextY})`);
      enemy.stuckCounter = 0; // Reset stuck counter on successful move
      enemy.lastPositions = []; // Clear history on successful move
    } else if (reflected) {
      // console.log(`${logPrefix} Reflected. New dir dx:${enemy.dx}, dy:${enemy.dy}. No move this tick.`);
    } else {
      // console.log(`${logPrefix} Move blocked/invalid. Target state: ${targetState}`);
    }
    // console.log(`${logPrefix} END TICK - Next frame dx:${enemy.dx}, dy:${enemy.dy}`);
  }

  function winGame() {
    console.log('LEVEL COMPLETE!');
    score += LEVEL_BONUS_SCORE;
    level++;
    console.log(`Advancing to Level ${level}. Score: ${score}`);
    alert(`Level ${level - 1} Complete! Bonus: ${LEVEL_BONUS_SCORE}\nStarting Level ${level}`);
    startNextLevel();
  }

  function startNextLevel() {
    console.log('Setting up Level', level);
    capturedPercentage = 0;
    isDrawing = false;
    currentTrail = [];
    initializeGrid(); // Reset grid to initial state
    resetPlayerPosition();
    initializeEnemies(level); // Spawn enemies for the new level
    updateUI();
    // Ensure game loop continues if it was stopped by win/loss
    if (!gameRunning) {
      gameRunning = true;
      requestAnimationFrame(gameLoop);
    }
  }

  function gameOver() {
    gameOverState = true;
    gameRunning = false;
    console.log('GAME OVER - FINAL SCORE:', score);
    // Display Game Over message on canvas (simple example)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = '40px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    // Maybe add instructions to refresh/restart
  }

  function update() {
    if (!gameRunning || gameOverState) return; // Stop updates if game over or paused

    updateEnemies(); // Update enemies first

    if (player.dx === 0 && player.dy === 0) return; // No player movement input

    const currentX = player.x;
    const currentY = player.y;
    const nextX = currentX + player.dx;
    const nextY = currentY + player.dy;

    // Check boundaries
    if (nextX < 0 || nextX >= GRID_COLS || nextY < 0 || nextY >= GRID_ROWS) {
      // Hit edge, stop movement (or handle differently if needed)
      player.dx = 0;
      player.dy = 0;
      return;
    }

    const wasInSafeArea = grid[currentY][currentX] === CellState.CAPTURED;
    const nextCellState = grid[nextY][nextX];
    const willBeInSafeArea = nextCellState === CellState.CAPTURED;
    const willBeInUncaptured = nextCellState === CellState.UNCAPTURED;
    const willHitOwnTrail = nextCellState === CellState.TRAIL;

    // --- Collision Detection ---
    if (willHitOwnTrail) {
      console.log('Collision with own trail!');
      loseLife(); // Use the new function
      return; // Stop player movement processing
    }

    // Player vs Enemy Collision
    const playerNextPosKey = `${nextX},${nextY}`;
    const playerCurrentPosKey = `${currentX},${currentY}`;
    let collidedWithEnemy = false;
    let collidingEnemy = null;

    for (const enemy of enemies) {
      const enemyCurrentPosKey = `${enemy.x},${enemy.y}`;
      // Did player move into enemy's current spot?
      if (enemyCurrentPosKey === playerNextPosKey) {
        collidedWithEnemy = true;
        collidingEnemy = enemy;
        break;
      }
      // Did enemy move onto player's current spot?
      // This catches swaps and enemies hitting a stationary player.
      if (enemyCurrentPosKey === playerCurrentPosKey) {
        collidedWithEnemy = true;
        collidingEnemy = enemy;
        break;
      }
    }

    if (collidedWithEnemy) {
      console.log(
        `Player collided with enemy type: ${collidingEnemy?.type} at (${collidingEnemy?.x}, ${collidingEnemy?.y})! Player trying to move from (${currentX},${currentY}) to (${nextX},${nextY})`
      );
      loseLife();
      return; // Stop player movement processing
    }

    // --- Trail Logic ---
    if (wasInSafeArea && willBeInUncaptured) {
      // Moved from safe zone into uncaptured: Start drawing
      console.log('Start drawing trail');
      isDrawing = true;
      currentTrail = []; // Clear previous trail
      currentTrail.push({ x: currentX, y: currentY }); // Add starting point (on border)
      currentTrail.push({ x: nextX, y: nextY }); // Add first point inside
      grid[nextY][nextX] = CellState.TRAIL; // Mark cell as trail
    } else if (isDrawing && willBeInUncaptured) {
      // Continuing drawing in uncaptured area
      currentTrail.push({ x: nextX, y: nextY });
      grid[nextY][nextX] = CellState.TRAIL;
    } else if (isDrawing && willBeInSafeArea) {
      // Finish drawing & Capture
      console.log('Player returned to safe area. Checking trail...'); // Log check
      if (currentTrail.length > 0) {
        // Add final point only if trail exists
        console.log('Trail has points. Attempting capture...'); // Log attempt
        // grid[nextY][nextX] = CellState.TRAIL; // Mark final trail point - handled by floodFillAndCapture cleanup
        // currentTrail.push({ x: nextX, y: nextY }); // Add final point - Handled by floodFillAndCapture cleanup if needed
        const pointsCapturedCount = floodFillAndCapture(currentTrail);
        console.log(`Capture function returned ${pointsCapturedCount} points captured.`); // Log result

        // --- Scoring --- Calculate points based on cells captured
        const POINTS_PER_CELL = 10; // Example score value per captured cell
        score += pointsCapturedCount * POINTS_PER_CELL;
        console.log(`Score updated: ${score}`);

        // Percentage is calculated within floodFillAndCapture now
        // capturedPercentage = calculateCapturedPercentage(); // Update percentage - done in floodFillAndCapture
        // updateUI(); // Update UI - done in floodFillAndCapture
      } else {
        console.log('Trail was empty, no capture needed.');
      }
      isDrawing = false;
      currentTrail = [];
    }

    // Update player position
    player.x = nextX;
    player.y = nextY;

    // Optional: Reset direction after one step for turn-based feel
    // If continuous movement is desired while key held, remove these lines
    // and potentially handle keyup events in handleInput.
    // player.dx = 0;
    // player.dy = 0;
  }

  function drawGrid() {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        // Draw Captured/Uncaptured state for inner cells AND border fill
        let fillColor = '#000000'; // Default: Uncaptured (Black)
        if (grid[y][x] === CellState.CAPTURED) {
          fillColor = '#AFEEEE'; // Captured & Border Fill (Pale Turquoise)
        } else if (grid[y][x] === CellState.TRAIL) {
          fillColor = '#FFFFFF'; // Trail (White)
        }
        ctx.fillStyle = fillColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  function drawBorder() {
    // Draw outline around the playable area (inside the 2-cell border)
    ctx.strokeStyle = '#00008B'; // Outline color (Dark Blue)
    ctx.lineWidth = 1; // Thin line
    // Offset by 2 cell sizes inwards from the canvas edge
    const offsetX = 2 * CELL_SIZE;
    const offsetY = 2 * CELL_SIZE;
    ctx.strokeRect(offsetX, offsetY, CANVAS_WIDTH - 2 * offsetX, CANVAS_HEIGHT - 2 * offsetY);
  }

  function drawPlayer() {
    ctx.fillStyle = '#FFFFFF'; // Player color (white)
    ctx.fillRect(player.x * CELL_SIZE, player.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  function drawEnemies() {
    enemies.forEach((enemy) => {
      // Reset variables for each enemy
      let drawX = enemy.x * CELL_SIZE;
      let drawY = enemy.y * CELL_SIZE;
      let drawSize = CELL_SIZE;
      let offsetX = 0;
      let offsetY = 0;

      if (enemy.type === 'bouncer') {
        ctx.fillStyle = '#FF00FF'; // Bouncer (Magenta)
      } else if (enemy.type === 'patroller') {
        ctx.fillStyle = '#FF0000'; // Patroller (Red)
        // Revert: Draw patroller full size again
        // const inset = 2;
        // drawSize = Math.max(1, CELL_SIZE - inset * 2);
        // offsetX = inset;
        // offsetY = inset;
      }
      ctx.fillRect(drawX + offsetX, drawY + offsetY, drawSize, drawSize); // Use variables
    });
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw components
    drawGrid();
    drawBorder(); // Draw border outline over the grid
    drawPlayer();
    drawEnemies();
  }

  // --- Game Loop ---
  let lastTime = 0;
  const gameSpeed = 100; // Update frequency

  function gameLoop(timestamp) {
    if (!gameRunning) return; // Stop loop if paused

    const deltaTime = timestamp - lastTime;

    if (deltaTime > gameSpeed) {
      update();
      draw(); // Draw even if game over to show message
      if (!gameOverState) {
        updateUI(); // Only update UI if not game over
      }
      lastTime = timestamp;
    }

    requestAnimationFrame(gameLoop);
  }

  // --- Initialization ---
  document.addEventListener('keydown', handleInput);
  initializeGrid();
  initializeEnemies(level); // Initialize enemies for level 1
  updateUI(); // Initial UI update
  requestAnimationFrame(gameLoop); // Start the loop

  console.log('Classic Xonix 2D Initialized (DOM Ready)');
});
