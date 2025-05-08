# Xonix Vibe Coding Hackathon @ Wix

<https://tombigel.github.io/xonix-3d/>

This repository contains two Xonix-style games (2D and 3D) developed during a short two-day "Vibe Coding" hackathon at Wix by Tom Bigelajzen and Ameer Abu-Fraiha.

The development process was entirely prompt-driven, meaning no code was directly written by the developers. Instead, AI tools were utilized for every step:

- **Planning**: Grok and ChatGPT
- **Coding**: Cursor with Claude and Gemini models
- **Sound Generation**: ElevenLabs
- **Fonts**: Google Fonts

This project serves as an experiment in AI-assisted game development using a modern tech stack.

---

## About Xonix

Xonix is a classic arcade game where the player controls a marker that can move around a rectangular area. The objective is to claim a certain percentage of the area by drawing lines to fill it in, while avoiding enemies that move within the unclaimed and claimed territory.

## Games Included

This project features two distinct implementations of Xonix:

1. **Classic 2D Xonix**: A retro-style 2D version of the game.
2. **Immersive 3D Xonix**: A modern take on Xonix with 3D graphics and gameplay elements.

## How to Run

1. **Install dependencies**:

    ```bash
    yarn
    ```

2. **Start the development server**:

    ```bash
    yarn dev
    ```

    The application should then be accessible at `http://localhost:5173/` (or a similar port indicated by Vite). You might need to navigate to `app2d.html` or `app3d.html` specifically, depending on how the project is set up.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **3D Rendering**: Three.js (integrated via React Three Fiber)
- **Physics Engine**: Cannon.js (for the 3D version)
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS

## AI Tools Utilized

This project was brought to life through extensive use of AI-powered tools:

- **Conceptualization & Planning**:
  - `Grok`: For initial brainstorming and idea generation.
  - `ChatGPT`: For refining concepts and outlining project requirements.
- **Code Generation & Development**:
  - `Cursor` IDE with:
    - `Claude model`: For generating and refactoring larger code structures and logic.
    - `Gemini model`: For specific code snippets, debugging, and optimization tasks.
- **Asset Creation**:
  - `ElevenLabs`: For generating custom sound effects and voiceovers.
  - `Google Fonts`: For selecting and implementing typography.
