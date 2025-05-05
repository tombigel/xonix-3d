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

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // --- Game State (placeholders) ---
  let score = 0;
  let lives = 3;
  let capturedPercentage = 0;
  let player = { x: GRID_COLS / 2, y: GRID_ROWS - 1, dx: 0, dy: 0 }; // Start on border
  let grid = []; // 2D array for grid state
  let currentTrail = [];
  let isDrawing = false;
  let enemies = [];

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

  function updateUI() {
    // Add checks for element existence
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const capturedEl = document.getElementById('captured');
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (capturedEl) capturedEl.textContent = capturedPercentage.toFixed(0);
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
    return actualPointsAdded;
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

  function update() {
    if (player.dx === 0 && player.dy === 0) return; // No movement input

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

    // --- Collision Detection (Basic) ---
    if (willHitOwnTrail) {
      console.log('Collision with own trail!');
      // TODO: Handle life loss
      // resetPlayerPosition();
      isDrawing = false;
      // Clear visual trail (need to revert grid state too)
      currentTrail.forEach((p) => {
        if (grid[p.y]?.[p.x] === CellState.TRAIL) grid[p.y][p.x] = CellState.UNCAPTURED;
      });
      currentTrail = [];
      player.dx = 0; // Stop movement
      player.dy = 0;
      return;
    }
    // TODO: Add enemy collision check later

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
        grid[nextY][nextX] = CellState.TRAIL; // Mark final trail point
        currentTrail.push({ x: nextX, y: nextY });
        const pointsCaptured = floodFillAndCapture(currentTrail);
        console.log(`Capture function returned ${pointsCaptured} points captured.`); // Log result
        capturedPercentage = calculateCapturedPercentage(); // Update percentage
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
    // TODO: Draw enemies
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
  const gameSpeed = 100; // Slightly faster update loop

  function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;

    if (deltaTime > gameSpeed) {
      update();
      draw();
      updateUI();
      lastTime = timestamp;
    }

    requestAnimationFrame(gameLoop);
  }

  // --- Initialization ---
  document.addEventListener('keydown', handleInput);
  initializeGrid();
  updateUI(); // Initial UI update
  requestAnimationFrame(gameLoop); // Start the loop

  console.log('Classic Xonix 2D Initialized (DOM Ready)');
});
