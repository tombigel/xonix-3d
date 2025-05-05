import SceneCanvas from './components/SceneCanvas';

const App = () => {
  return (
    <div className="h-screen w-full bg-black">
      <SceneCanvas debug={true} />
    </div>
  );
};

export default App;
