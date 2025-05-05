# Xonix Clone Prototype Dev Plan

This plan tracks the development milestones for the Xonix clone.

## Core Gameplay (MVP)

- [ ] **Step 1: Project Setup**
  - [ ] Create directory structure (`src/components`, `hooks`, `systems`, etc.)
  - [ ] Implement `SceneCanvas.tsx` (@react-three/fiber)
  - [ ] Setup `App.tsx` (render canvas, base styles)
  - [ ] Create `Button.tsx` UI component
  - [ ] Initialize `gameStore.ts` (Zustand)
  - [ ] Define initial `Types.ts`
  - [ ] **Playground/Testing**: Run initial setup with empty canvas to verify rendering pipeline
- [ ] **Step 2: 2D Gameplay (Levels 1-2)**
  - [ ] Implement `Player.tsx` movement
  - [ ] Create `useControls.ts` (keyboard/swipe)
  - [ ] Implement `GridMath.ts` (area capture)
  - [ ] Add enemies (`Environment.tsx`, `EnemyAI.ts`)
  - [ ] Setup `PhysicsSystem.ts` (Cannon.js collisions)
  - [ ] Develop `HUD.tsx` (score, lives, level)
  - [ ] Apply CGA pixel shader (`cgaShader.glsl`)
  - [ ] Integrate state updates (`gameStore.ts`)
  - [ ] Define core types (`Player`, `Enemy`, `Grid`)
  - [ ] **Playground/Testing**: Test 2D gameplay with player movement, area capturing, and enemy collision
- [ ] **Step 3: 3D Transition (Level 3)**
  - [ ] Add transition trigger (e.g., orb) in `Environment.tsx`
  - [ ] Create `AnimationSystem.ts` (2D->3D grid)
  - [ ] Update `PhysicsSystem.ts` for 3D
  - [ ] Implement `useFollowCamera.ts` (basic follow)
  - [ ] Add `is3DMode` state to `gameStore.ts`
  - [ ] **Playground/Testing**: Test transition from 2D to 3D gameplay via the orb trigger
- [ ] **Step 4: 3D Shape Filling (Level 4)**
  - [ ] Extend `GridMath.ts` for 3D shape detection (cubes)
  - [ ] Add shape scoring logic (`gameStore.ts`)
  - [ ] Visualize completed shapes (`SceneCanvas.tsx`)
  - [ ] Manage plane/shape state (`Environment.tsx`)
  - [ ] **Playground/Testing**: Test 3D shape filling mechanics and score calculation

## Enhancements & Polish (Post-MVP)

- [ ] **Step 5: Advanced Controls**
  - [ ] Enhance `useFollowCamera.ts` (view switch, zoom)
  - [ ] Add camera controls to `HUD.tsx`
  - [ ] Refine `useControls.ts` (pinch-zoom, multi-touch)
  - [ ] **Playground/Testing**: Test camera perspective switching and mobile controls on actual devices
- [ ] **Step 6: Levels & Visual Evolution (Levels 5-10)**
  - [ ] Define level configurations (5-10) in `Environment.tsx`
  - [ ] Implement visual styles: EGA/VGA, Neon, Forest, Sea, Abstract
  - [ ] Add Effects (Bloom, Particles via Drei)
  - [ ] Create Shaders (`waterShader.glsl`, etc.)
  - [ ] Implement Power-ups (Speed, Shield)
  - [ ] Setup `AssetLoader.ts` (textures, audio)
  - [ ] Integrate thematic audio playback
  - [ ] **Playground/Testing**: Playtest all levels with their unique visuals, effects, and mechanics
- [ ] **Step 7: Optimization & Deployment**
  - [ ] Optimize rendering performance (`SceneCanvas.tsx`)
  - [ ] Optimize physics (`PhysicsSystem.ts`)
  - [ ] Verify mobile performance
  - [ ] Configure `vite.config.ts` for production
  - [ ] Review/minify assets
  - [ ] (Optional) Create deployment script
  - [ ] **Playground/Testing**: Full playthrough performance testing on target devices

## Timeline

- (Placeholder: Define target dates if needed)
