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

  const PLAYER_START_POS = { x: GRID_COLS / 2, y: GRID_ROWS - 1 };

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
    // Initialize border as captured (or a distinct border state if needed)
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (x === 0 || x === GRID_COLS - 1 || y === 0 || y === GRID_ROWS - 1) {
          grid[y][x] = CellState.CAPTURED; // Treat border as captured initially
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
      // Distribute starting positions more evenly if many patrollers
      const side = i % 4;
      switch (side) {
        case 0: // Top, moving right
          startX = 1;
          startY = 0;
          startDX = currentEnemySpeed;
          startDY = 0;
          break;
        case 1: // Right, moving down
          startX = GRID_COLS - 1;
          startY = 1;
          startDX = 0;
          startDY = currentEnemySpeed;
          break;
        case 2: // Bottom, moving left
          startX = GRID_COLS - 2;
          startY = GRID_ROWS - 1;
          startDX = -currentEnemySpeed;
          startDY = 0;
          break;
        case 3: // Left, moving up
          startX = 0;
          startY = GRID_ROWS - 2;
          startDX = 0;
          startDY = -currentEnemySpeed;
          break;
      }

      enemies.push({
        type: 'patroller',
        x: startX,
        y: startY,
        dx: startDX,
        dy: startDY,
        speed: currentEnemySpeed,
      });
    }

    // Initialize Bouncers
    for (let i = 0; i < bouncerCount; i++) {
      let enemyX, enemyY;
      let attempts = 0;
      do {
        enemyX = Math.floor(Math.random() * (GRID_COLS - 2)) + 1;
        enemyY = Math.floor(Math.random() * (GRID_ROWS - 2)) + 1;
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
        // Count only the inner area, not the border
        if (x > 0 && x < GRID_COLS - 1 && y > 0 && y < GRID_ROWS - 1) {
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
    enemies.forEach((enemy) => {
      if (enemy.type === 'bouncer') {
        updateBouncer(enemy);
      } else if (enemy.type === 'patroller') {
        updatePatroller(enemy);
      }
    });
  }

  function updateBouncer(enemy) {
    // Use enemy's speed, ensure dx/dy represent direction * speed
    // If dx/dy only store direction (-1, 0, 1), multiply by speed here.
    // Assuming dx/dy already incorporate speed from initialization for now.
    const nextX = enemy.x + enemy.dx;
    const nextY = enemy.y + enemy.dy;
    let bounced = false;

    // Bouncer collision with Trail
    if (grid[nextY]?.[nextX] === CellState.TRAIL) {
      console.log('Bouncer hit trail!');
      loseLife();
      return; // Stop processing this enemy
    }

    // Bouncer collision with Walls/Captured Area
    let collidedX = false;
    let collidedY = false;

    // Check X collision (simplified: check target cell)
    if (nextX <= 0 || nextX >= GRID_COLS - 1 || grid[enemy.y]?.[nextX] === CellState.CAPTURED) {
      enemy.dx *= -1;
      collidedX = true;
      bounced = true;
    }
    // Check Y collision (simplified: check target cell)
    if (nextY <= 0 || nextY >= GRID_ROWS - 1 || grid[nextY]?.[enemy.x] === CellState.CAPTURED) {
      enemy.dy *= -1;
      collidedY = true;
      bounced = true;
    }

    // If it bounced diagonally off a corner, ensure it continues away
    if (collidedX && collidedY) {
      // Already reversed both dx and dy
    } else if (collidedX) {
      // If only X collided, check if the original nextY is valid before moving
      if (nextY > 0 && nextY < GRID_ROWS - 1 && grid[nextY]?.[enemy.x] !== CellState.CAPTURED) {
        // Okay to move vertically
      } else {
        // Hit a vertical wall while moving horizontally, reverse Y too? Or just stop Y?
        // For simplicity, let's assume it can still move vertically if the path is clear
      }
    } else if (collidedY) {
      // If only Y collided, check if the original nextX is valid before moving
      if (nextX > 0 && nextX < GRID_COLS - 1 && grid[enemy.y]?.[nextX] !== CellState.CAPTURED) {
        // Okay to move horizontally
      } else {
        // Hit a horizontal wall while moving vertically, reverse X too? Or stop X?
      }
    }

    // Recalculate final position after bounce adjustments
    // Assuming dx/dy include speed
    const finalNextX = enemy.x + enemy.dx;
    const finalNextY = enemy.y + enemy.dy;

    // Final check before moving
    if (
      finalNextX > 0 &&
      finalNextX < GRID_COLS - 1 &&
      finalNextY > 0 &&
      finalNextY < GRID_ROWS - 1 &&
      grid[finalNextY]?.[finalNextX] !== CellState.CAPTURED &&
      grid[finalNextY]?.[finalNextX] !== CellState.TRAIL
    ) {
      // Double check trail
      enemy.x = finalNextX;
      enemy.y = finalNextY;
    } else {
      // If still stuck after bounce logic (e.g. corner), maybe just stop?
      // Or try another bounce? For now, it might just oscillate if logic isn't perfect.
      // Let's try reversing again if it didn't move
      if (!bounced) {
        // Prevent infinite loops if bounce logic failed
        enemy.dx *= -1;
        enemy.dy *= -1;
      }
    }
  }

  function updatePatroller(enemy) {
    const { x, y, dx, dy } = enemy;
    // Assuming dx/dy incorporate speed
    const forwardX = x + dx;
    const forwardY = y + dy;

    // Calculate relative right turn direction
    // Note: dx/dy might be > 1 if speed > 1. We need normalized direction for turning.
    const normDX = Math.sign(dx);
    const normDY = Math.sign(dy);

    const rightNormDX = -normDY;
    const rightNormDY = normDX;
    const rightX = x + rightNormDX * enemy.speed;
    const rightY = y + rightNormDY * enemy.speed;

    // Calculate relative left turn direction
    const leftNormDX = normDY;
    const leftNormDY = -normDX;
    const leftX = x + leftNormDX * enemy.speed;
    const leftY = y + leftNormDY * enemy.speed;

    // Helper to check if a cell is safe (captured or border)
    const isSafe = (cx, cy) =>
      cx >= 0 &&
      cx < GRID_COLS &&
      cy >= 0 &&
      cy < GRID_ROWS &&
      grid[cy]?.[cx] === CellState.CAPTURED;

    // Helper to check for trail collision
    const checkTrailCollision = (cx, cy) => {
      if (grid[cy]?.[cx] === CellState.TRAIL) {
        console.log('Patroller hit trail!');
        loseLife();
        return true;
      }
      return false;
    };

    // Check for trail collision immediately ahead
    if (checkTrailCollision(forwardX, forwardY)) return;

    // --- Movement Logic ---
    let moved = false;

    // 1. Check cell to the right: If it's NOT safe (uncaptured), turn right and move there.
    // Need to check the cell *at the turn direction*, not the full distance move
    const checkRightX = x + rightNormDX;
    const checkRightY = y + rightNormDY;
    if (!isSafe(checkRightX, checkRightY)) {
      // Check trail collision at the *target* position after turning right
      if (checkTrailCollision(rightX, rightY)) return;
      enemy.dx = rightNormDX * enemy.speed;
      enemy.dy = rightNormDY * enemy.speed;
      enemy.x = rightX;
      enemy.y = rightY;
      moved = true;
    }

    // 2. If not turned right, check cell forward: If it IS safe, move forward.
    // Need to check the cell *immediately* forward
    const checkForwardX = x + normDX;
    const checkForwardY = y + normDY;
    if (!moved && isSafe(checkForwardX, checkForwardY)) {
      // Check trail at target position
      if (checkTrailCollision(forwardX, forwardY)) return;
      enemy.x = forwardX;
      enemy.y = forwardY;
      moved = true;
    }

    // 3. If not moved right or forward, turn left (must be a wall ahead).
    if (!moved) {
      enemy.dx = leftNormDX * enemy.speed;
      enemy.dy = leftNormDY * enemy.speed;
      // Don't move this turn, just change direction for the next turn.
    }
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
    if (enemies.some((enemy) => enemy.x === nextX && enemy.y === nextY)) {
      console.log('Player collided with enemy!');
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
        ctx.fillStyle = '#000'; // Default: Uncaptured (black)
        if (grid[y][x] === CellState.CAPTURED) {
          ctx.fillStyle = '#005500'; // Captured (dark green)
        } else if (grid[y][x] === CellState.TRAIL) {
          ctx.fillStyle = '#FFFFFF'; // Trail (white)
        }
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  function drawPlayer() {
    ctx.fillStyle = '#FFFFFF'; // Player color (white)
    ctx.fillRect(player.x * CELL_SIZE, player.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  function drawEnemies() {
    ctx.fillStyle = '#FF0000'; // Enemy color (red)
    enemies.forEach((enemy) => {
      ctx.fillRect(enemy.x * CELL_SIZE, enemy.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw components
    drawGrid();
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
