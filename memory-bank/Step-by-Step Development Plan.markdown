# Step-by-Step Development Plan for Cursor IDE: Xonix Clone Prototype

## Overview
This plan directs Cursor IDE to develop a 10-level Xonix clone prototype within the existing `wow-vibe-coding` project, using React, TypeScript, Three.js (via `@react-three/fiber` and `@react-three/drei`), Cannon.js, Vite, Tailwind CSS, and related dependencies from the provided `package.json`. The game evolves from a retro 2D Xonix to a modern 3D experience with thematic vibes, targeting web (desktop and mobile). Prompts are concise, allowing Cursor to creatively implement features within the project structure: `src/components/`, `src/components/ui/`, `src/hooks/`, `src/systems/`, `src/stores/`, `src/loaders/`, `src/utils/`, `src/ui/`, `src/shaders/`, `src/App.tsx`, `src/main.tsx`.

## Project Context
- Base directory: `wow-vibe-coding/`
- Dependencies: Use existing `package.json` (`@react-three/fiber`, `@react-three/drei`, `cannon-es`, `react`, `three`, `tailwindcss`, `lucide-react`, `class-variance-authority`, `tailwind-merge`, etc.).
- Setup: Assume Vite, Tailwind CSS, and TypeScript are configured (`vite.config.ts`, `tailwind.config.js`, `tsconfig.json`).
- UI Components: Use `@radix-ui/react-slot` and `class-variance-authority` for shadcn/ui-style components; include `lucide-react` for icons.

## Development Steps
### Step 1: Set Up Project Structure and Canvas
- **Prompt**: “In the `wow-vibe-coding` project, create a TypeScript project structure under `src/`: `components/`, `components/ui/`, `hooks/`, `systems/`, `stores/`, `loaders/`, `utils/`, `ui/`, `shaders/`, `App.tsx`, `main.tsx`. Implement a Three.js canvas in `src/components/SceneCanvas.tsx` using `@react-three/fiber` and `@react-three/drei`. Configure `src/App.tsx` to render the canvas with Tailwind CSS styling (via `tailwind-merge`). Create a custom Button component in `src/components/ui/Button.tsx` using `@radix-ui/react-slot`, `class-variance-authority`, and `lucide-react` icons. Initialize a Zustand store in `src/stores/gameStore.ts` for game state (score, lives, level, 3D mode).”
- **Expected Output**:
  - `src/components/SceneCanvas.tsx`: Canvas with `@react-three/fiber` scene.
  - `src/App.tsx`: Renders canvas with Tailwind styles.
  - `src/components/ui/Button.tsx`: Customizable button with `lucide-react` icons.
  - `src/stores/gameStore.ts`: Zustand store with type-safe state.
  - Empty folders: `components/ui/`, `hooks/`, `systems/`, `loaders/`, `utils/`, `ui/`, `shaders/`.
- **Notes**: Cursor can choose scene defaults (e.g., camera type, lighting) and button variants (e.g., retro styles).

### Step 2: Implement 2D Xonix Mechanics
- **Prompt**: “In TypeScript, implement a 2D Xonix game in `src/components/SceneCanvas.tsx` using `@react-three/fiber` and `cannon-es`. Apply a pixelated CGA style with a GLSL shader in `src/shaders/cgaShader.glsl`. Create player ball movement in `src/components/Player.tsx` with input handling in `src/hooks/useControls.ts` (keyboard arrows for desktop, swipe for mobile). Implement grid-based area capture in `src/utils/GridMath.ts`. Add bouncing enemies in `src/components/Environment.tsx` with AI logic in `src/systems/EnemyAI.ts` and physics in `src/systems/PhysicsSystem.ts`. Handle collisions (lose life on enemy hit or unsafe line). Create HUD in `src/ui/HUD.tsx` using `src/components/ui/Button.tsx` and Tailwind CSS for score, lives, level. Update `src/stores/gameStore.ts` for game state. Define interfaces in `src/utils/Types.ts`. Support levels 1-2 with simple grids and 2-3 enemies.”
- **Expected Output**:
  - `src/components/SceneCanvas.tsx`: 2D game scene.
  - `src/components/Player.tsx`: Player ball (fiber mesh, Cannon.js body).
  - `src/components/Environment.tsx`: Grid, enemies.
  - `src/hooks/useControls.ts`: Type-safe input handling.
  - `src/systems/PhysicsSystem.ts`: Physics loop for collisions.
  - `src/systems/EnemyAI.ts`: Enemy movement logic.
  - `src/utils/GridMath.ts`: Grid capture mechanics.
  - `src/utils/Types.ts`: Interfaces (`Player`, `Enemy`, `Grid`).
  - `src/ui/HUD.tsx`: HUD with buttons and Tailwind styling.
  - `src/stores/gameStore.ts`: Updated state.
  - `src/shaders/cgaShader.glsl`: CGA shader.
- **Notes**: Cursor can innovate on enemy movement patterns, grid capture visuals, or HUD design (e.g., retro fonts).

### Step 3: Add 3D Transition
- **Prompt**: “In TypeScript, implement a 3D transition in `src/components/SceneCanvas.tsx` using `@react-three/fiber` and `@react-three/drei`, triggered by collecting a glowing orb in `src/components/Environment.tsx`. Animate grid rotation to a floor plane and Z-axis extrusion in `src/systems/AnimationSystem.ts`. Render a low-poly 3D board with `cannon-es` physics in `src/systems/PhysicsSystem.ts`. Enable plane filling (XY, XZ, YZ) in `src/utils/GridMath.ts`. Implement camera follow and view switching (top-down, side, first-person) in `src/hooks/useFollowCamera.ts` using `@react-three/drei`. Update `src/stores/gameStore.ts` for 3D mode. Support level 3 with 2D start and 3D transition.”
- **Expected Output**:
  - `src/components/SceneCanvas.tsx`: 3D scene support.
  - `src/components/Environment.tsx`: Glowing orb trigger.
  - `src/systems/AnimationSystem.ts`: Grid rotation and extrusion.
  - `src/systems/PhysicsSystem.ts`: 3D physics.
  - `src/utils/GridMath.ts`: 3D plane filling.
  - `src/hooks/useFollowCamera.ts`: Camera controls.
  - `src/stores/gameStore.ts`: 3D mode state.
- **Notes**: Cursor can experiment with orb effects (e.g., particles via `@react-three/drei`), animation curves, or camera transitions.

### Step 4: Implement 3D Shape Filling
- **Prompt**: “In TypeScript, extend 3D Xonix in `src/components/Environment.tsx` to combine planes into 3D shapes (e.g., cubes) using `src/utils/GridMath.ts` and `src/systems/PhysicsSystem.ts` with `cannon-es`. Add scoring for shapes in `src/stores/gameStore.ts`. Visualize shapes in `src/components/SceneCanvas.tsx` using `@react-three/fiber`. Support level 4 with cube formation.”
- **Expected Output**:
  - `src/components/Environment.tsx`: Plane tracking.
  - `src/utils/GridMath.ts`: Shape detection logic.
  - `src/systems/PhysicsSystem.ts`: Shape physics.
  - `src/stores/gameStore.ts`: Scoring system.
  - `src/components/SceneCanvas.tsx`: Shape visualization.
- **Notes**: Cursor can explore additional shape types (e.g., prisms) or visual feedback for shape completion.

### Step 5: Enhance Camera and Mobile Controls
- **Prompt**: “In TypeScript, implement switchable camera views (top-down, side, first-person) and zoom in `src/hooks/useFollowCamera.ts` using `@react-three/drei`. Add camera toggle buttons in `src/ui/HUD.tsx` using `src/components/ui/Button.tsx` with `lucide-react` icons. Support desktop (mouse scroll) and mobile (pinch-to-zoom) inputs in `src/hooks/useControls.ts`. Implement two-finger tap for shield power-up in `src/hooks/useControls.ts`.”
- **Expected Output**:
  - `src/hooks/useFollowCamera.ts`: Camera views and zoom.
  - `src/ui/HUD.tsx`: Toggle buttons with icons.
  - `src/hooks/useControls.ts`: Enhanced input support.
- **Notes**: Cursor can design button aesthetics or camera movement smoothness.

### Step 6: Build Level and Style Progression
- **Prompt**: “In TypeScript, generate 6 Xonix levels (5-10) in `src/components/Environment.tsx` with increasing complexity (more enemies, larger grids). Evolve visuals: levels 5-6 (EGA/VGA low-poly, `src/shaders/cgaShader.glsl`), level 7 (futuristic neon), level 8 (fairy forest with particle effects via `@react-three/drei`), level 9 (sea-inspired, `src/shaders/waterShader.glsl`), level 10 (modern abstract with PBR and bloom via `@react-three/drei`). Implement power-ups (speed, shield) in `src/components/Environment.tsx`. Load textures and audio in `src/loaders/AssetLoader.ts`.”
- **Expected Output**:
  - `src/components/Environment.tsx`: Level configurations.
  - `src/shaders/cgaShader.glsl`: EGA/VGA visuals.
  - `src/shaders/waterShader.glsl`: Sea visuals.
  - `src/loaders/AssetLoader.ts`: Textures and audio assets.
  - `src/components/SceneCanvas.tsx`: Visual rendering.
- **Notes**: Cursor can innovate on particle effects, shader parameters, or power-up mechanics.

### Step 7: Optimize and Prepare Deployment
- **Prompt**: “Optimize `src/systems/PhysicsSystem.ts` and `src/components/SceneCanvas.tsx` for web performance (target 60 FPS) using `cannon-es` and `@react-three/fiber`. Ensure mobile compatibility in `src/hooks/useControls.ts`. Minify assets in `src/loaders/AssetLoader.ts`. Update `vite.config.ts` for production build. Generate a Netlify deployment script.”
- **Expected Output**:
  - `src/systems/PhysicsSystem.ts`: Efficient physics.
  - `src/components/SceneCanvas.tsx`: Optimized rendering.
  - `src/hooks/useControls.ts`: Mobile support.
  - `src/loaders/AssetLoader dispensed.ts`: Minified assets.
  - `vite.config.ts`: Production settings.
  - `deploy-netlify.sh`: Deployment script.
- **Notes**: Cursor can choose optimization strategies (e.g., reducing draw calls, compressing textures).

## General Guidelines
- Use TypeScript with strict typing; define interfaces in `src/utils/Types.ts`.
- Leverage `@react-three/fiber` and `@react-three/drei` for Three.js integration.
- Use `tailwind-merge` for combining Tailwind classes.
- Ensure modular code with reusable components, hooks, and systems.
- Commit to Git after each step.