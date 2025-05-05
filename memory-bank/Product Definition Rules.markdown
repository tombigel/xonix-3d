# Product Definition Rules: Xonix Clone Prototype

## Product Vision
Develop a modernized Xonix clone prototype with 10 levels, evolving from a retro 2D game to a sophisticated 3D experience. The game starts with classic Xonix mechanics in a pixelated CGA style, introduces power-ups and special zones to trigger 3D transitions, and progresses to modern visuals and thematic vibes. Built for desktop and mobile web, the prototype showcases vibe coding with minimal manual intervention using Cursor IDE.

## Target Audience
- Developers and stakeholders evaluating AI-assisted game development.
- Players interested in retro-to-modern game evolution.

## Platform
- Web (desktop and mobile browsers).
- Optimized for Chrome, Firefox, Safari (desktop), and mobile equivalents.

## Core Features
- **Classic Xonix Mechanics**:
  - Player controls a ball on a grid, drawing lines to capture safe areas.
  - Avoid bouncing enemies; lose lives on collision with enemies or unsafe lines.
  - Score based on captured area percentage.
- **Level Progression (10 Levels)**:
  - Levels 1-2: 2D gameplay, CGA pixelated style (80s vibe), simple grids, 2-3 enemies.
  - Levels 3+: Introduce power-ups (e.g., speed boost, shield) and special zones (e.g., glowing orbs or marked areas) to trigger 3D transitions.
  - Levels 4-10: Increasing complexity (more enemies, larger grids, thematic vibes).
- **3D Transition**:
  - Triggered by collecting items (glowing orbs) or filling special zones.
  - 2D grid rotates to a "floor" plane, with Z-axis rising to form a 3D space.
  - Players fill 2D planes (XY, XZ, YZ) and combine them into 3D shapes (e.g., cubes, prisms) for bonus points.
- **Camera Controls**:
  - Default: Third-person camera follows the ball.
  - Switchable views: Top-down, side-angle, first-person.
  - Adjustable distance: Mouse scroll (desktop), pinch-to-zoom (mobile).
- **Visual Progression**:
  - Levels 1-2: CGA pixelated (4-color palette, blocky sprites).
  - Levels 3-5: Low-poly, retro EGA/VGA-inspired.
  - Levels 6-8: Mid-poly, early 2000s aesthetics (smooth textures, phong lighting).
  - Levels 9-10: High-poly, modern PBR materials, bloom effects.
- **Thematic Vibes**:
  - Level 7: Futuristic (neon, cyberpunk).
  - Level 8: Fairy forest (lush greens, glowing particles).
  - Level 9: Sea-inspired (blue hues, water effects).
  - Level 10: Modern abstract (minimalist, vibrant).
- **Mobile Features**:
  - Touch controls: Swipe to steer ball.
  - Multi-touch: Two-finger tap for shield power-up.
- **Audio**:
  - Levels 1-2: 8-bit chiptune (80s retro).
  - Levels 3-6: Synthwave (retro-futuristic).
  - Levels 7-10: Thematic (cyberpunk, ambient forest, oceanic, modern electronic).

## Non-Functional Requirements
- **Performance**: 60 FPS on modern devices (desktop: mid-range GPU; mobile: mid-range smartphone).
- **Compatibility**: Responsive design for desktop (1920x1080, 1366x768) and mobile (iPhone, Android).
- **Build Size**: Optimized for web (<50MB, including assets).
- **Extensibility**: Modular code to add levels, power-ups, and vibes.

## Constraints
- **Timeline**: 2-day sprint for a 10-level prototype.
- **Team**: Two senior developers (one mathematician, one product manager/graphic designer).
- **Coding Approach**: Vibe coding with Cursor IDE, minimizing manual coding.
- **Tech Stack**: React, TypeScript, Three.js, Cannon.js, Vite, shadcn/ui, Tailwind CSS, Zustand.

## Deliverables
- 10-level prototype hosted on a static web server (e.g., Netlify).
- Source code in a Git repository.
- Demo showcasing 2D-to-3D progression and vibe evolution.