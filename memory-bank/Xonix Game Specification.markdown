# Xonix Game Specification

## 1. Overview

Xonix is a classic arcade-style game originally released in 1984. The player controls a device that moves across a rectangular playfield, drawing lines to capture areas while avoiding enemies. This specification outlines the core mechanics, features, and technical requirements for a modern implementation of Xonix, staying faithful to the original gameplay while incorporating minimal enhancements for accessibility and clarity.

## 2. Game Objective

The player’s goal is to capture a specified percentage of the playfield (typically 80%) by drawing lines to enclose areas, while avoiding collisions with enemies. Each level increases in difficulty with faster enemies or additional obstacles.

## 3. Core Gameplay Mechanics

### 3.1 Playfield

- The playfield is a 2D rectangular grid, typically 320x200 pixels in the original, scalable to modern resolutions (e.g., 640x400 or 1280x800).
- The grid is divided into a border (safe zone) and an inner playable area (unsafe zone).
- The border is a single-pixel-wide perimeter that the player can move along without risk.

### 3.2 Player Device

- The player controls a small sprite (e.g., a 5x5 pixel square or equivalent) called the "cutter."
- The cutter can move in four cardinal directions (up, down, left, right) at a constant speed.
- Movement is continuous while a direction key is held, with instantaneous direction changes.
- The cutter starts each level on the border and can move into the unsafe zone, leaving a trail (a line) behind it.
- If the cutter returns to the border or an already-captured area without colliding with enemies or its own trail, the enclosed area is captured and filled in as a safe zone.

### 3.3 Area Capture

- Capturing occurs when the cutter completes a closed loop by returning to the border or a previously captured area.
- The game calculates the enclosed area(s) and fills the smallest region(s) that do not contain enemies.
- Captured areas become part of the safe zone, where the cutter can move freely without leaving a trail.
- The percentage of the playfield captured is displayed on-screen (e.g., as a number or progress bar).

### 3.4 Enemies

- Two types of enemies exist:
  1. **Bouncers (or Balls)**: Small sprites (e.g., 3x3 pixels) that bounce within the uncaptured (unsafe) area. They follow simple physics, reflecting off borders, captured areas, or the cutter’s trail at equal angles.
  2. **Patrollers (or Sentries)**: Enemies that move along the border of the playfield, typically in a predictable pattern (e.g., clockwise or counterclockwise).
- Enemy count increases with levels (e.g., 1-2 bouncers in level 1, 3-4 in level 2, etc.).
- Collision with any enemy or the cutter’s own trail results in the loss of a life.

### 3.5 Lives and Scoring

- The player starts with 3 lives.
- A life is lost if:
  - The cutter collides with a bouncer.
  - The cutter hits its own trail.
  - The cutter is hit by a patroller while on the border.
- Scoring:
  - Points are awarded based on the area captured (e.g., 10 points per 1% of the playfield).
  - Bonus points for completing a level (e.g., 1000 points).
  - Extra lives may be awarded at score milestones (e.g., every 10,000 points).
- The game ends when all lives are lost.

### 3.6 Levels and Progression

- Each level requires capturing a target percentage of the playfield (e.g., 80%).
- Upon completion, the player advances to the next level with:
  - Increased enemy speed.
  - Additional enemies (e.g., more bouncers or patrollers).
  - Optionally, a smaller starting safe zone.
- There is no fixed number of levels; the game continues until the player runs out of lives.

## 4. Controls

- **Keyboard** (default, based on original):
  - Arrow keys (Up, Down, Left, Right) to move the cutter.
  - ESC to pause or quit to the main menu.
- Optional modern additions:
  - WASD keys as an alternative movement option.
  - Spacebar to pause/unpause.
  - Support for gamepad input (e.g., D-pad or analog stick for movement, A button for pause).

## 5. Visual and Audio Elements

### 5.1 Graphics

- **Style**: Minimalist, retro pixel-art aesthetic inspired by the 1984 original.
- **Components**:
  - **Cutter**: A distinct sprite (e.g., white square or small geometric shape).
  - **Bouncers**: Small, brightly colored sprites (e.g., red or yellow circles/squares).
  - **Patrollers**: Contrasting sprites (e.g., blue triangles or larger squares) moving along the border.
  - **Playfield**: Black or dark background for uncaptured areas, solid color (e.g., green or blue) for captured areas.
  - **Trail**: A single-pixel-wide line (e.g., white) drawn by the cutter in the unsafe zone.
- **UI**:
  - Display lives remaining (e.g., icons or number in a corner).
  - Show current score and high score.
  - Indicate percentage of playfield captured (e.g., “75%” or a progress bar).
  - Simple main menu with “Start Game,” “High Scores,” and “Exit” options.

### 5.2 Audio

- **Sound Effects**:
  - Short beep or chirp when capturing an area.
  - Distinct sound for losing a life (e.g., low buzz).
  - Collision sound for bouncers hitting walls or trails.
- **Background Music**:
  - Optional looping chiptune-style track, low-volume to avoid distraction.
  - Toggleable in settings for accessibility.

## 6. Technical Requirements

### 6.1 Platform

- Cross-platform compatibility:
  - Desktop (Windows, macOS, Linux).
  - Web browser (HTML5/WebGL implementation).
  - Optional: Mobile support with touch controls (virtual joystick or swipe-based movement).
- Target resolution: Scalable from 640x400 to 1920x1080, maintaining aspect ratio.

### 6.2 Performance

- Target frame rate: 60 FPS for smooth movement.
- Minimal memory usage (<100 MB) to support low-end devices.
- Optimize collision detection for real-time performance with multiple enemies.

### 6.3 Implementation Notes

- **Language/Frameworks**:
  - Recommended: JavaScript (with p5.js or Phaser) for web-based versions.
  - Alternatives: Python (Pygame) or C++ (SFML) for desktop.
- **Collision Detection**:
  - Use bounding-box checks for cutter-enemy and cutter-trail collisions.
  - Implement raycasting or grid-based checks for bouncer-trail collisions.
- **Area Calculation**:
  - Use flood-fill or polygon-filling algorithms to determine enclosed areas.
  - Ensure accurate detection of enemy positions to avoid filling areas containing enemies.
- **Randomization**:
  - Bouncer starting positions and velocities should be randomized within constraints (e.g., minimum speed to ensure challenge).
  - Patroller movement patterns may be randomized or follow fixed paths.

## 7. Accessibility Features

- Colorblind mode: High-contrast colors or patterns to distinguish cutter, enemies, and areas.
- Adjustable game speed: Option to slow down enemy movement for new players.
- Key remapping: Allow players to customize controls.
- Sound toggle: Option to mute audio or adjust volume.
- Tutorial: Brief in-game or menu-based guide explaining controls and objectives.

## 8. Additional Features (Optional Enhancements)

- **High Score Table**: Persistent local storage for top 10 scores with player initials.
- **Level Editor**: Allow players to create custom levels with adjustable enemy counts and speeds.
- **Power-Ups**: Rare items in the playfield (e.g., temporary speed boost or enemy freeze), inspired by later Xonix variants.
- **Multiplayer**: Two-player mode where players compete to capture more area on the same playfield.

## 9. Constraints and Assumptions

- The game must remain true to the 1984 original in core mechanics (cutter movement, area capture, enemy behavior).
- Modern enhancements (e.g., smoother graphics, accessibility options) should not alter the fundamental challenge or feel.
- No online features (e.g., leaderboards requiring server support) unless explicitly requested.
- The game is single-player by default, with multiplayer as an optional extension.

## 10. Deliverables

- Fully functional game executable or web-based application.
- Source code with comments explaining key systems (movement, collision, area capture).
- Brief user manual or in-game help screen.
- Optional: Design document summarizing implementation choices.
