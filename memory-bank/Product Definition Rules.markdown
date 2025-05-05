# Product Definition Rules: Xonix 3D Evolution

## Product Vision

Develop a modernized Xonix game that evolves from the classic 2D mechanics to an innovative 3D experience across 10 levels. The game stays true to the original 1984 gameplay in early levels (2D grid, area capture mechanics, enemy avoidance), while introducing special zones that trigger transitions to 3D gameplay. Built for desktop and mobile web browsers using React, Three.js, and TypeScript.

## Target Audience

- Fans of classic arcade games seeking a nostalgic yet fresh experience
- Modern gamers interested in innovative gameplay evolution
- Developers evaluating AI-assisted game development

## Platform

- Web (desktop and mobile browsers)
- Optimized for Chrome, Firefox, Safari

## Core Features

- **Classic Xonix Mechanics (Faithful to Original)**:
  - Player controls a "cutter" that moves on a rectangular grid
  - Drawing lines through uncaptured areas, returning to safe zones to capture territory
  - Two types of enemies: Bouncers (reflect off walls within the uncaptured area) and Patrollers (move along borders)
  - Objective: Capture required percentage (typically 80%) of the playfield while avoiding enemies
  - Lives lost on collision with enemies or the cutter's own trail

- **Level Progression (10 Levels)**:
  - Levels 1-2: Classic 2D gameplay with CGA-style visuals
  - Level 3: Introduction of transition elements (glowing orbs that trigger 2D→3D)
  - Levels 4-10: Progressive 3D gameplay with increasing complexity

- **3D Transition Mechanics**:
  - 2D grid rotates to become floor plane, with Z-axis emerging
  - Players fill planes in 3D space (XY, XZ, YZ)
  - Ability to form 3D volumes (cubes, prisms) for bonus points

- **Camera Controls**:
  - Default: Third-person following the cutter
  - Switchable views: Top-down (classic), side-angle, first-person
  - Adjustable zoom: Mouse scroll (desktop), pinch (mobile)

- **Visual Evolution**:
  - Levels 1-2: CGA pixelated (4-color palette)
  - Levels 3-5: EGA/VGA-inspired low-poly
  - Levels 6-8: Early 2000s style (smooth textures, basic lighting)
  - Levels 9-10: Modern with PBR materials, bloom effects

- **Thematic Progression**:
  - Level 7: Futuristic/Neon (cyberpunk elements)
  - Level 8: Fairy Forest (organic elements)
  - Level 9: Ocean/Water themed
  - Level 10: Modern abstract minimalist

- **Player Controls**:
  - Desktop: Arrow keys/WASD for movement (4 directions)
  - Mobile: Touch/swipe controls, multi-touch for special actions
  - Camera controls: Mouse (desktop), pinch/rotate gestures (mobile)

- **Scoring System**:
  - Points based on area percentage captured
  - Time bonuses for quick level completion
  - Multipliers for capturing areas containing bonus items
  - 3D shape completion bonuses

- **Audio**:
  - 8-bit chiptunes for early levels
  - Evolving to synthwave and modern music for later levels
  - Sound effects that enhance from basic to sophisticated

## Non-Functional Requirements

- Performance: 60 FPS on modern devices
- Responsive design for various screen sizes
- Build size under 50MB (including assets)
- Modular code structure for extensibility

## Constraints

- Development approach: Vibe coding with Cursor IDE
- Tech stack: React, TypeScript, Three.js (via react-three-fiber), Cannon.js, Tailwind CSS

## Deliverables

- 10-level prototype hosted on static web server
- Source code in Git repository
- Demo showcasing 2D-to-3D progression
