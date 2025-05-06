import SceneCanvas from './components/SceneCanvas';

const App = () => {
  return (
    <div className="h-screen w-full bg-black">
      <SceneCanvas debug={false} />
    </div>
  );
};

export default App;
