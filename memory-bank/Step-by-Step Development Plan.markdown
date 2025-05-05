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

### Step 2: Classic Xonix 2D Gameplay (Levels 1-2)

- **Tasks**:
  - Implement a 2D rectangular grid system in `GridMath.ts`
  - Create the player "cutter" with movement controls in `Player.tsx`
  - Implement trail-drawing and area-capture algorithm (flood fill or similar)
  - Add two types of enemies (bouncers and patrollers) in `Environment.tsx`
  - Set up collision detection in `PhysicsSystem.ts`
  - Create HUD displaying lives, score, and capture percentage
  - Apply CGA pixel shader for retro aesthetic
  - Implement game state logic (level start/end, life loss, score calculation)
- **Output**: Functioning 2D Xonix gameplay with classic mechanics
- **Notes**: Closely follow the original mechanics with four-directional movement, accurate collision detection, and area filling

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
