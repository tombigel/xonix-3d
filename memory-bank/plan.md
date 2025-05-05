# Xonix 3D Evolution Dev Plan

This plan tracks the development milestones for our Xonix 3D Evolution game.

## Core Gameplay (MVP)

- [x] **Step 1: Project Setup**
  - [x] Create directory structure (`src/components`, `hooks`, `systems`, etc.)
  - [x] Implement `SceneCanvas.tsx` (@react-three/fiber)
  - [x] Setup `App.tsx` (render canvas, base styles)
  - [x] Create `Button.tsx` UI component
  - [x] Initialize `gameStore.ts` (Zustand)
  - [x] Define initial `Types.ts`
  - [x] **Playground/Testing**: Run initial setup with empty canvas to verify rendering pipeline
- [x] **Step 1.5: Implement Classic 2D JS Version (Canvas API)**
  - [x] Create basic HTML/CSS/JS file structure (`src/classic-2d/`)
  - [x] Implement Canvas setup and basic rendering loop (`requestAnimationFrame`)
  - [x] Implement Grid representation (2D array: Uncaptured, Captured, Trail)
  - [x] Implement Player rendering and 4-directional keyboard movement
  - [x] Implement Trail drawing logic (update grid state)
  - [x] Implement Area Capture logic (detect return to safe zone, basic flood fill)
  - [x] Implement basic Enemy rendering and movement (Bouncer, Patroller)
  - [x] Implement basic Collision Detection (Player-Enemy, Player-Trail)
  - [x] Implement Lives and Score display
  - [x] **Playground/Testing**: Verify core 2D Xonix gameplay loop.
- [ ] **Step 2: 3D Visualization of Classic Gameplay**
  - [ ] **Game Logic Bridge**
    - [ ] Create game logic adapter to connect classic-2d logic to Three.js renderer
    - [ ] Implement state synchronization between game logic and 3D representation
    - [ ] Extract reusable constants and types to shared modules
  - [ ] **3D Scene Setup**
    - [ ] Setup Three.js scene with camera and lighting in `Scene3D.tsx`
    - [ ] Create flat 3D grid plane with z-height variations for cell states
    - [ ] Implement color/material differentiation for different cell states
  - [ ] **3D Asset Creation**
    - [ ] Design and implement 3D player model with animations
    - [ ] Create 3D models for bouncer and patroller enemies
    - [ ] Design 3D trail effect with glow/particle emission
    - [ ] Add captured area visual effects (textured surfaces, lighting)
  - [ ] **Camera & Controls**
    - [ ] Implement dynamic camera system with multiple view options
    - [ ] Create orbital camera control for player observation
    - [ ] Add top-down view option (similar to classic perspective)
    - [ ] Implement smooth camera transitions between views
  - [ ] **UI Integration**
    - [ ] Create 3D-appropriate HUD overlay with score and lives
    - [ ] Implement percentage completion meter
    - [ ] Add game state indicators (level, pause, game over)
    - [ ] Design 3D menu and transition screens
  - [ ] **Performance & Effects**
    - [ ] Implement efficient instancing for grid cells
    - [ ] Add post-processing effects (bloom for trails, etc.)
    - [ ] Optimize rendering pipeline for mobile compatibility
    - [ ] Add ambient effects (particles, background elements)
  - [ ] **Build System Updates**
    - [ ] Update package.json scripts to support both versions:
      - [ ] Add `dev:classic` and `dev:3d` script commands
      - [ ] Create `build:classic` and `build:3d` build scripts
      - [ ] Add combined build command for production
    - [ ] Implement shared asset loading system
  - [ ] **Playground/Testing**
    - [ ] Create test levels to showcase 3D visualization
    - [ ] Perform cross-browser compatibility testing
    - [ ] Optimize for different device capabilities
- [ ] **Step 3: 3D Transition (Level 3)**
  - [ ] Add special transition triggers (glowing orbs) to level
  - [ ] Create `AnimationSystem.ts` for 2D→3D grid rotation animation
  - [ ] Update physics system for 3D space
  - [ ] Implement camera follow behavior in `useFollowCamera.ts`
  - [ ] Update grid system for 2.5D/3D representation
  - [ ] Add `is3DMode` state to `gameStore.ts`
  - [ ] **Playground/Testing**: Test transition from 2D to 3D via orb collection
- [ ] **Step 4: 3D Gameplay (Level 4)**
  - [ ] Extend `GridMath.ts` for multi-plane filling (XY, XZ, YZ planes)
  - [ ] Implement 3D volume detection (cubes, prisms)
  - [ ] Add scoring bonuses for 3D shape completion
  - [ ] Update enemy movement patterns for 3D navigation
  - [ ] Improve 3D shape visualization
  - [ ] **Playground/Testing**: Test 3D plane filling and volume creation mechanics

## Enhancements & Polish

- [ ] **Step 5: Advanced Controls**
  - [ ] Implement switchable camera perspectives (top-down, side, first-person)
  - [ ] Add camera control UI in `HUD.tsx`
  - [ ] Support mouse/touch zoom functionality
  - [ ] Add multi-touch controls for mobile devices
  - [ ] Refine movement controls for 3D navigation
  - [ ] **Playground/Testing**: Test camera controls on desktop and mobile devices
- [ ] **Step 6: Level & Visual Evolution (Levels 5-10)**
  - [ ] Design progressive level configurations with increasing difficulty
  - [ ] Create themed visuals for level groups:
    - [ ] EGA/VGA aesthetic (levels 5-6)
    - [ ] Futuristic/Neon theme (level 7)
    - [ ] Fairy Forest with particles (level 8)
    - [ ] Ocean theme with water shader (level 9)
    - [ ] Modern abstract with PBR materials (level 10)
  - [ ] Implement power-ups (speed boost, shield, etc.)
  - [ ] Setup asset loading system for textures and audio
  - [ ] Add themed music and sound effects
  - [ ] **Playground/Testing**: Playtest themed levels and verify increasing challenge
- [ ] **Step 7: Optimization & Deployment**
  - [ ] Optimize rendering (instancing, draw call reduction)
  - [ ] Tune physics for performance
  - [ ] Test on various devices and optimize for mobile
  - [ ] Polish UI elements and transitions
  - [ ] Add save/load functionality
  - [ ] Package for deployment
  - [ ] **Playground/Testing**: Full game performance testing

## Timeline

- (Define target dates based on development capacity)
