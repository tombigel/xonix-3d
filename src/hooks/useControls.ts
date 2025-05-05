import { useState, useEffect } from 'react';
import { Controls } from '@/utils/Types';

const useControls = (): Controls => {
    const [controls, setControls] = useState<Controls>({
        forward: false,
        backward: false,
        left: false,
        right: false,
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setControls((prev) => ({ ...prev, forward: true }));
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setControls((prev) => ({ ...prev, backward: true }));
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setControls((prev) => ({ ...prev, left: true }));
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setControls((prev) => ({ ...prev, right: true }));
                    break;
                default:
                    break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setControls((prev) => ({ ...prev, forward: false }));
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setControls((prev) => ({ ...prev, backward: false }));
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setControls((prev) => ({ ...prev, left: false }));
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setControls((prev) => ({ ...prev, right: false }));
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cleanup function to remove event listeners
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []); // Empty dependency array means this effect runs once on mount

    return controls;
};

export default useControls; 