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
- [ ] **Step 2: Classic 2D Xonix (Levels 1-2)**
  - [ ] Implement 2D rectangular grid system in `GridMath.ts`
  - [ ] Create player "cutter" in `Player.tsx` with 4-directional movement
  - [ ] Implement trail drawing when moving through unsafe zones
  - [ ] Create area capture algorithm (flood fill) upon returning to safe zones
  - [ ] Add bouncers (reflect off walls) and patrollers (move along borders) in `Environment.tsx`
  - [ ] Setup collision detection in `PhysicsSystem.ts` (player-enemy, player-trail)
  - [ ] Create HUD showing lives, score, and capture percentage
  - [ ] Apply CGA pixel shader for retro aesthetic
  - [ ] Implement level completion logic (80% area capture)
  - [ ] **Playground/Testing**: Test classic Xonix gameplay with area capture and enemies
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
