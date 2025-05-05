# Architecture Rules: Xonix Clone Prototype

## Overview

This document defines the technical architecture for the Xonix clone prototype within the `wow-vibe-coding` project, guiding Cursor IDE to generate modular, type-safe code. The architecture leverages the existing `package.json` dependencies, including React, TypeScript, `@react-three/fiber`, `@react-three/drei`, Cannon.js, Vite, Tailwind CSS, and related libraries, to build a 10-level game evolving from 2D retro to 3D modern visuals.

## Tech Stack

- **React (18.3.1)**: Component-based UI with functional components.
- **TypeScript (5.5.3)**: Type-safe logic and interfaces.
- **@react-three/fiber (8.15.16)**: React wrapper for Three.js (0.161.0) rendering.
- **@react-three/drei (9.99.0)**: Utility components for Three.js (e.g., cameras, effects).
- **Cannon.js (cannon-es 0.20.0)**: Physics for collisions and movement.
- **Vite (5.4.2)**: Build tool for development and production.
- **Tailwind CSS (4.1.5)**: Responsive styling with `@tailwindcss/vite` and `tailwind-merge` for class merging.
- **UI Components**: Custom shadcn/ui-style components using `@radix-ui/react-slot` (1.2.0), `class-variance-authority` (0.7.1), `clsx` (2.1.1), and `lucide-react` (0.507.0) for icons.
- **Zustand (implied)**: Lightweight state management for game state (score, lives, level, 3D mode).
- **Dev Tools**: ESLint (9.9.1), Prettier (3.5.3), `typescript-eslint` (8.3.0) for linting and formatting.

## Project Structure

```text
wow-vibe-coding/
├── src/
│   ├── components/
│   │   ├── SceneCanvas.tsx     # Three.js canvas via @react-three/fiber
│   │   ├── Player.tsx          # Player ball rendering and logic
│   │   ├── Environment.tsx     # Grid, enemies, power-ups, zones
│   ├── components/ui/
│   │   ├── Button.tsx          # Custom button with lucide-react icons
│   │   ├── Card.tsx            # Custom card for HUD
│   ├── hooks/
│   │   ├── useControls.ts      # Keyboard, touch, multi-touch inputs
│   │   ├── useFollowCamera.ts  # Camera follow and view switching
│   ├── systems/
│   │   ├── PhysicsSystem.ts    # Cannon.js physics loop
│   │   ├── AnimationSystem.ts  # 2D/3D transition animations
│   │   ├── EnemyAI.ts          # Enemy movement logic
│   ├── stores/
│   │   ├── gameStore.ts        # Zustand store for game state
│   ├── loaders/
│   │   ├── AssetLoader.ts      # Texture, audio, model loading
│   ├── utils/
│   │   ├── GridMath.ts         # 2D/3D grid calculations
│   │   ├── Types.ts            # TypeScript interfaces
│   ├── ui/
│   │   ├── HUD.tsx             # Score, lives, level display
│   │   ├── Menu.tsx            # Start screen, pause menu
│   ├── shaders/
│   │   ├── cgaShader.glsl      # Pixelated CGA effect
│   │   ├── waterShader.glsl    # Sea-inspired effect
│   ├── App.tsx                 # Main app layout
│   ├── main.tsx                # Entry point
├── public/
│   ├── assets/
│   │   ├── textures/           # Pixelated, low-poly, modern textures
│   │   ├── audio/              # Chiptune, synthwave, thematic audio
│   ├── index.html              # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── package.json                # Dependencies and scripts
```

## Architectural Principles

- **Modularity**: Components (`components/`), hooks (`hooks/`), and systems (`systems/`) are independent and reusable.
- **Type Safety**: Define interfaces in `src/utils/Types.ts` for game entities (e.g., `Player`, `Enemy`, `Grid`).
- **Separation of Concerns**:
  - Rendering: Handled by `@react-three/fiber` in `SceneCanvas.tsx`.
  - Physics: Managed by `cannon-es` in `PhysicsSystem.ts`.
  - State: Centralized in `gameStore.ts` with Zustand.
  - UI: Built with custom components (`components/ui/`) and Tailwind CSS (`ui/`).
- **Performance**:
  - Optimize `@react-three/fiber` scenes (e.g., reuse geometries, limit draw calls).
  - Use lightweight `cannon-es` physics (e.g., sphere collisions).
  - Minify assets and bundle with Vite.
- **Extensibility**:
  - Add levels via `Environment.tsx` configurations.
  - Extend power-ups in `systems/`.
  - Swap shaders in `shaders/` for new vibes.

## Coding Guidelines

- **TypeScript**:
  - Use strict typing in `tsconfig.json` (no `any` types).
  - Define interfaces in `src/utils/Types.ts` for Three.js and Cannon.js objects.
  - Use generics for reusable hooks (e.g., `useControls.ts`).
- **React**:
  - Use functional components with hooks via `@react-three/fiber`.
  - Prefer JSX with `className` for Tailwind CSS (use `tailwind-merge` for class combining).
  - Integrate `@react-three/drei` for utilities (e.g., `OrbitControls`, effects).
- **@react-three/fiber and @react-three/drei**:
  - Initialize scenes in `SceneCanvas.tsx` with fiber’s `Canvas`.
  - Use drei components for cameras, lights, or effects (e.g., bloom, particles).
  - Apply custom shaders (`shaders/`) for CGA and thematic visuals.
- **Cannon.js**:
  - Implement physics in `PhysicsSystem.ts` for collisions and movement.
  - Use spheres for player and enemies to simplify calculations.
- **UI Components**:
  - Build custom buttons and cards in `components/ui/` using `@radix-ui/react-slot`, `class-variance-authority`, and `lucide-react`.
  - Style with Tailwind CSS and `tailwind-merge` for consistency.
- **Zustand**:
  - Manage game state (score, lives, level, 3D mode) in `gameStore.ts`.
  - Use selectors to optimize performance.
- **Tailwind CSS**:
  - Use `@tailwindcss/vite` plugin for HMR.
  - Apply styles via `className` with `tailwind-merge`.
  - Support responsive design (desktop and mobile).
- **Vite**:
  - Configure `vite.config.ts` with `@vitejs/plugin-react`.
  - Enable HMR and production optimizations.
- **Assets**:
  - Load textures and audio via `AssetLoader.ts` in `loaders/`.
  - Store in `public/assets/` (textures: PNG; audio: MP3).
- **Linting and Formatting**:
  - Enforce ESLint rules (`eslint-config-prettier`, `eslint-plugin-react-hooks`).
  - Use Prettier with `prettier-plugin-tailwindcss` for consistent formatting.

## Dependencies

- **From `package.json`**:

  ```json
  {
    "dependencies": {
      "@radix-ui/react-slot": "^1.2.0",
      "@react-three/drei": "^9.99.0",
      "@react-three/fiber": "^8.15.16",
      "@tailwindcss/vite": "^4.1.5",
      "@types/three": "^0.161.2",
      "cannon-es": "^0.20.0",
      "class-variance-authority": "^0.7.1",
      "clsx": "^2.1.1",
      "lucide-react": "^0.507.0",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "tailwind-merge": "^3.2.0",
      "three": "^0.161.0"
    },
    "devDependencies": {
      "@vitejs/plugin-react": "^4.3.1",
      "autoprefixer": "^10.4.18",
      "eslint": "^9.9.1",
      "postcss": "^8.4.35",
      "prettier": "^3.5.3",
      "prettier-plugin-tailwindcss": "^0.6.11",
      "tailwindcss": "^4.1.5",
      "typescript": "^5.5.3",
      "vite": "^5.4.2"
    }
  }
  ```

- **Assumed**: Zustand is implied for state management (add `"zustand": "^4.5.0"` if needed).

## Notes for Cursor IDE

- Assume `vite.config.ts`, `tsconfig.json`, and `tailwind.config.js` are pre-configured.
- Use `@react-three/fiber` and `@react-three/drei` for all Three.js rendering.
- Ensure all files are TypeScript with strict typing.
- Commit to Git after each development step.
