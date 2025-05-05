import React from 'react';
import SceneCanvas from './components/SceneCanvas';
// Removed HUD import
// import Menu from './ui/Menu'; // Placeholder for Menu

const App: React.FC = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* 3D Scene */}
      <SceneCanvas />

      {/* UI Overlay - Removed HUD */}
      {/* <Menu /> */}

      {/* Removed example button and title overlay for simplicity */}
    </div>
  );
};

export default App;
