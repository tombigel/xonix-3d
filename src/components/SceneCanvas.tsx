import { Suspense } from 'react';
import { Scene3D } from './Scene3D';

interface SceneCanvasProps {
  debug?: boolean;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({ debug = false }) => {
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Suspense fallback={<div>Loading 3D scene...</div>}>
        <Scene3D initialLevel={1} debug={debug} />
      </Suspense>
    </div>
  );
};

export default SceneCanvas;
