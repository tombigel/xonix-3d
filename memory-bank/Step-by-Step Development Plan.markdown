# Step-by-Step Development Plan for Xonix 3D Evolution

## Overview

This plan outlines the development approach for a 10-level Xonix game that evolves from a faithful recreation of the classic 2D mechanics to an innovative 3D experience. The implementation uses React, TypeScript, Three.js (via `@react-three/fiber` and `@react-three/drei`), Cannon.js, Vite, and Tailwind CSS. The game will maintain the core capture mechanics of the original Xonix while introducing dimension-shifting gameplay in later levels.

## Project Context

- Dependencies: React, TypeScript, Three.js, Cannon.js, Tailwind CSS, with supporting libraries for UI primitives and state management
- UI Components: Custom shadcn/ui-style using `@radix-ui/react-slot`, `class-variance-authority`, and `lucide-react`
- Structure: Components, hooks, systems, stores, utils, UI, shaders, loaders

## Development Steps

### Step 1: Project Structure and Base Setup

- **Tasks**:
  - Create the directory structure (`src/` with subdirectories for components, hooks, systems, stores, utils, UI, shaders)
  - Set up Three.js canvas in `SceneCanvas.tsx` using `@react-three/fiber`
  - Configure `App.tsx` with Tailwind styling
  - Create a custom Button component for UI elements
  - Initialize Zustand store for game state
  - Define type interfaces for game entities
- **Output**: Project skeleton with rendering pipeline and basic state management
- **Notes**: Ensure the canvas correctly handles responsive sizing for various screens

### Step 1.5: Classic Xonix 2D JavaScript Implementation

- **Tasks**:
  - Create basic HTML/CSS/JS file structure in `src/classic-2d/`.
  - Implement Canvas setup and rendering loop using `requestAnimationFrame`
  - Build grid representation with cell states (Uncaptured, Captured, Trail)
  - Create player movement with 4-directional controls
  - Implement trail drawing and area capture logic with flood fill
  - Add enemy types (bouncers and patrollers) with distinct behaviors
  - Develop collision detection system for player, enemies, and trails
  - Add lives and scoring system with visual display
  - Define core constants (`constants.js`) adhering to `Implementation Guide - Classic 2D Logic.md` (e.g., `CELL_SIZE`, colors, timing, `BASE_ENEMY_COUNT`).
  - Implement core game logic (`gameLogic.js`) based on the guide, including:
    - `CellState` enum, grid management, player state/movement (`handlePlayerInput`).
    - Trail logic (`isDrawing`, `currentTrail`), flood fill for area capture.
    - Scoring, lives, level management (`initGame`, `updateGame`, `triggerNextLevelStart`).
    - `getGameState()` function providing the defined state structure.
  - Implement enemy logic (`enemyLogic.js`) based on the guide, including:
    - `initializeEnemies(config)` function for level-based setup.
    - `updateAllEnemies(config)` function handling movement and collision checks (Bouncer/Patroller behaviors).
    - Returning `{ lifeLost: boolean }` from `updateAllEnemies`.
  - Implement the rendering/UI layer (`game.js`) to:
    - Initialize the canvas and run the game loop (`requestAnimationFrame`).
    - Call `gameLogic.initGame` and `gameLogic.updateGame` appropriately.
    - Read state using `gameLogic.getGameState()` for drawing the grid, player, enemies, and trail.
    - Handle user input (keyboard) and call `gameLogic.handlePlayerInput`.
    - Display HUD info (score, lives, etc.) from game state.
    - Manage UI state for game over/level complete screens.
- **Output**: Standalone classic Xonix implementation using vanilla JavaScript, structured according to the defined module interfaces.
- **Notes**: This serves as the reusable game logic foundation for the 3D version, adhering to the specified interfaces.

### Step 2: 3D Visualization of Classic Gameplay

- **Tasks**:
  - **Game Logic Bridge**:
    - Create an adapter/hook (e.g., `useGameLogicAdapter.ts`) to manage interaction with the classic-2d modules (`gameLogic.js`, `enemyLogic.js`, `constants.js`) as defined in `Implementation Guide - Classic 2D Logic.md`.
    - This adapter should:
      - Call `initGame` on mount/start.
      - Call `handlePlayerInput` when receiving input events.
      - Call `updateGame` periodically based on `TIME_STEP` from `constants.js`.
      - Call `getGameState()` every frame to retrieve the latest state for rendering.
      - Handle `triggerNextLevelStart` when appropriate (e.g., after level complete UI).
    - Utilize constants like `GRID_COLS`, `GRID_ROWS`, `CELL_SIZE` from `constants.js` for scene setup.
  - **3D Scene Setup**:
    - Set up Three.js scene with appropriate camera and lighting in `Scene3D.tsx`
    - Create a flat 3D grid/plane based on `gridCols`/`gridRows` from `getGameState()`. Use `CELL_SIZE` for scaling.
    - Visualize the `grid` array from `getGameState()` by varying cell height, material, or color based on `CellState` (`UNCAPTURED`, `CAPTURED`, `TRAIL`).
  - **3D Asset Creation**:
    - Design 3D player model with animations for movement
    - Create 3D enemy models for bouncers and patrollers
    - Implement trail effects with glow/particle systems
    - Add visual effects for captured areas (textures, lighting)
  - **Camera & Controls**:
    - Build dynamic camera system with multiple perspective options
    - Create orbital controls for observing gameplay
    - Implement top-down camera option for classic-style view
    - Add smooth transitions between camera perspectives
  - **UI Integration**:
    - Design 3D-appropriate HUD with score and lives display
    - Create percentage completion indicator
    - Add game state visualization (level, pause, game over)
    - Implement 3D menu screens and transitions
  - **Performance & Effects**:
    - Optimize grid cell rendering with instancing
    - Add post-processing effects (bloom for trails, etc.)
    - Ensure mobile compatibility with performance optimization
    - Implement ambient visual elements (particles, backgrounds)
  - **Build System**:
    - Set up scripts to support both classic-2d and 3D versions
    - Create shared asset loading pipeline
- **Output**: 3D visualization of classic Xonix gameplay that leverages the existing game logic
- **Notes**: Focus on visual presentation while maintaining the core gameplay mechanics already established

### Step 3: Transition Mechanics (Level 3)

- **Tasks**:
  - Add transition trigger elements (glowing orbs) to Level 3
  - Implement animation system for grid rotation/transformation to 3D
  - Update physics system to handle 3D space
  - Create camera control system with follow behavior
  - Modify grid mechanics to support the 2.5D perspective
  - Add state tracking for 3D mode
- **Output**: Level 3 with working 2D-to-3D transition
- **Notes**: Ensure the transition is visually impressive while maintaining gameplay continuity

### Step 4: 3D Gameplay (Level 4)

- **Tasks**:
  - Extend grid system to handle multiple planes in 3D space
  - Implement 3D volume capture mechanics (detecting closed 3D shapes)
  - Add scoring bonuses for 3D shape completion
  - Update enemies to navigate in 3D space
  - Enhance visualization of captured volumes
- **Output**: Level 4 with full 3D gameplay and shape-filling mechanics
- **Notes**: Balance difficulty when moving to 3D; provide visual cues to help player orientation

### Step 5: Camera and Control Enhancements

- **Tasks**:
  - Implement switchable camera perspectives (top-down, side, first-person)
  - Add camera control UI elements
  - Enhance touch/mobile controls with multi-touch support
  - Implement zoom functionality with mouse scroll and pinch gestures
  - Refine movement controls for 3D navigation
- **Output**: Polished camera system that helps players navigate both 2D and 3D spaces
- **Notes**: Test controls extensively on different devices to ensure intuitive gameplay

### Step 6: Visual Evolution and Theming (Levels 5-10)

- **Tasks**:
  - Design level progression with increasing complexity
  - Implement visual styles for different level groups:
    - EGA/VGA aesthetics (levels 5-6)
    - Futuristic/Neon theme (level 7)
    - Fairy Forest theme with particles (level 8)
    - Ocean theme with water shader (level 9)
    - Modern abstract with PBR materials (level 10)
  - Add visual effects appropriate to each theme
  - Implement power-ups and special gameplay elements
  - Create asset loading system for textures and audio
  - Add thematic music and sound effects
- **Output**: Complete level progression with varied visuals and themes
- **Notes**: Maintain gameplay consistency while visuals evolve; ensure each theme feels cohesive

### Step 7: Optimization and Polishing

- **Tasks**:
  - Optimize rendering performance (instancing, draw call reduction)
  - Tune physics calculations for efficiency
  - Test and optimize for mobile performance
  - Add final UI polish (menus, transitions, feedback)
  - Implement save/load functionality for progress
  - Create production build configuration
  - Prepare deployment package
- **Output**: Release-ready game with smooth performance across devices
- **Notes**: Focus on maintaining 60 FPS even on mid-range devices

## Technical Implementation Guidelines

- Use TypeScript with strict typing throughout
- Build modular, reusable components and systems
- Leverage Three.js best practices via `@react-three/fiber` and `@react-three/drei`
- Implement physics with `cannon-es` for consistent behavior
- Use Zustand for state management with action/selector pattern
- Apply Tailwind CSS with `tailwind-merge` for styling
- Commit code regularly with descriptive messages
