'use strict';

// Import necessary functions and constants from the logic module
import {
    initGame,
    updateGame,
    handlePlayerInput,
    getGameState,
    CellState // Import CellState if needed for drawing distinctions
} from './gameLogic.js';

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

  // --- Rendering Constants ---
  // Get grid dimensions and cell size from the logic module after init
  let GRID_COLS, GRID_ROWS, CELL_SIZE;
  let CANVAS_WIDTH, CANVAS_HEIGHT;

  // --- Color Palette (can be customized) ---
  const COLOR_BACKGROUND = '#000000'; // Black for uncaptured
  const COLOR_CAPTURED = '#00AAAA'; // Original Teal/Cyan for captured
  const COLOR_TRAIL = '#FF00FF'; // Original Magenta for trail
  const COLOR_PLAYER_STROKE = '#FFFFFF'; // Original White for player outline
  const COLOR_ENEMY_BOUNCER_FILL = '#FFFFFF'; // Original White for bouncer fill
  const COLOR_ENEMY_PATROLLER_STROKE = '#000000'; // Original Black for patroller outline
  const COLOR_GRID_LINES = '#333333'; // Dark grey for grid lines

  // --- Game Loop State ---
  let lastTime = 0;
  let animationFrameId = null;
  let accumulator = 0;
  const timeStep = 100; // Update logic every 100ms (like original gameSpeed)

  // --- UI Update Function ---
  function updateUI(gameState) {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const capturedEl = document.getElementById('captured');
    const levelEl = document.getElementById('level');
    const targetEl = document.getElementById('target-percentage'); // Assuming an element for target % exists

    if (scoreEl) scoreEl.textContent = gameState.score;
    if (livesEl) livesEl.textContent = gameState.lives;
    if (capturedEl) capturedEl.textContent = gameState.capturedPercentage.toFixed(0);
    if (levelEl) levelEl.textContent = gameState.level;
    if (targetEl) targetEl.textContent = gameState.targetPercentage; // Display target
  }

  // --- Input Handling ---
  function handleKeyDown(event) {
    // Prevent default browser actions for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      // Pass the direction to the game logic module
      handlePlayerInput(event.key);
    }
    // Add key for restarting game after game over
    if (event.key === 'r' || event.key === 'R') {
      const currentState = getGameState();
      if (currentState.gameOver) {
        console.log('Restarting game...');
        startGame();
      }
    }
  }

  // --- Drawing Functions ---
  function drawGrid(gameState) {
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const cellState = gameState.grid[y][x];
        switch (cellState) {
          case CellState.CAPTURED:
            ctx.fillStyle = COLOR_CAPTURED;
            break;
          case CellState.TRAIL:
            ctx.fillStyle = COLOR_TRAIL;
            break;
          case CellState.UNCAPTURED:
          default:
            ctx.fillStyle = COLOR_BACKGROUND;
            break; // Already filled background, but good practice
        }
        // Don't draw over player/enemies here, just the grid state
        if (cellState !== CellState.UNCAPTURED) {
          // Only fill non-background cells for efficiency
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }

        // Optional: Draw grid lines (can be performance intensive)
        // ctx.strokeStyle = COLOR_GRID_LINES;
        // ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  function drawPlayer(gameState) {
    // Draw player as an empty white square with 2px border (original style)
    ctx.strokeStyle = COLOR_PLAYER_STROKE;
    const lineWidth = 2;
    ctx.lineWidth = lineWidth;
    const drawX = gameState.player.x * CELL_SIZE;
    const drawY = gameState.player.y * CELL_SIZE;
    // Offset strokeRect by half the line width to keep the border centered
    ctx.strokeRect(
      drawX + lineWidth / 2,
      drawY + lineWidth / 2,
      CELL_SIZE - lineWidth,
      CELL_SIZE - lineWidth
    );

    // Draw current trail if player is drawing (using updated trail color)
    if (gameState.isDrawing) {
      ctx.fillStyle = COLOR_TRAIL;
      gameState.currentTrail.forEach((p) => {
        // Avoid overdrawing the player's current cell with trail color
        if (!(p.x === gameState.player.x && p.y === gameState.player.y)) {
          ctx.fillRect(p.x * CELL_SIZE, p.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      });
    }
  }

  function drawEnemies(gameState) {
    gameState.enemies.forEach((enemy) => {
      const drawX = enemy.x * CELL_SIZE;
      const drawY = enemy.y * CELL_SIZE;

      if (enemy.type === 'bouncer') {
        // Draw bouncer as a solid white circle (original style)
        ctx.fillStyle = COLOR_ENEMY_BOUNCER_FILL;
        const radius = CELL_SIZE * 0.4; // Adjust radius relative to cell size
        const centerX = drawX + CELL_SIZE / 2;
        const centerY = drawY + CELL_SIZE / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === 'patroller') {
        // Draw patroller as a black outline square (original style)
        ctx.strokeStyle = COLOR_ENEMY_PATROLLER_STROKE;
        const lineWidth = 2;
        ctx.lineWidth = lineWidth;
        // Offset strokeRect by half the line width
        ctx.strokeRect(
          drawX + lineWidth / 2,
          drawY + lineWidth / 2,
          CELL_SIZE - lineWidth,
          CELL_SIZE - lineWidth
        );
      }
    });
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.font = '48px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    ctx.font = '24px Arial';
    ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  // --- Main Render Function ---
  function draw(gameState) {
    // Clear previous frame (or let drawGrid handle it)
    // ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawGrid(gameState);
    drawPlayer(gameState); // Draw player and trail *after* grid background
    drawEnemies(gameState);

    if (gameState.gameOver) {
      drawGameOver();
    }
  }

  // --- Game Loop ---
  function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    accumulator += deltaTime;

    // Update game logic in fixed steps
    while (accumulator >= timeStep) {
      updateGame(); // Call logic update without deltaTime
      accumulator -= timeStep;
    }

    // Get the latest state (after potential logic updates)
    const currentState = getGameState();

    // Render the current state
    draw(currentState);

    // Update HUD/UI
    updateUI(currentState);

    // Continue loop if game is running
    if (!currentState.gameOver) {
      // Check game over state from logic module
      animationFrameId = requestAnimationFrame(gameLoop);
    } else {
      console.log('Game over detected in render loop.');
      // Stop loop handled by not requesting next frame
    }
  }

  // --- Start Game ---
  function startGame() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    initGame(); // Initialize game logic (sets level 1 by default)

    // Get initial state to set up canvas dimensions
    const initialState = getGameState();
    GRID_COLS = initialState.gridCols;
    GRID_ROWS = initialState.gridRows;
    CELL_SIZE = initialState.cellSize;
    CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
    CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    console.log(`Canvas initialized to ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);

    // Remove previous listener if restarting
    document.removeEventListener('keydown', handleKeyDown);
    // Add input listener
    document.addEventListener('keydown', handleKeyDown);

    // Reset timestamp and start loop
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // --- Initial Setup ---
  startGame(); // Start the game when DOM is ready

  console.log('Classic Xonix 2D Initialized (DOM Ready)');
});
