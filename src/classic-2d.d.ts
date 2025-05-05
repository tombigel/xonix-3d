/**
 * Type declarations for the classic 2D game logic JavaScript modules
 */

// Tell TypeScript that these JS modules exist and can be imported
declare module '*/classic-2d/*.js' {
    // The contents will be typed through the interfaces in ClassicGameTypes.ts
    const content: any;
    export = content;
}

// Alternatively, we can declare each module specifically if needed
declare module '../classic-2d/gameLogic.js' {
    import { GameLogic } from './utils/ClassicGameTypes';
    const content: GameLogic;
    export = content;
}

declare module '../classic-2d/constants.js' {
    import { GameConstants } from './utils/ClassicGameTypes';
    const content: GameConstants;
    export = content;
}

declare module '../classic-2d/enemyLogic.js' {
    import { EnemyLogic } from './utils/ClassicGameTypes';
    const content: EnemyLogic;
    export = content;
} 