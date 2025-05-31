import { Canvas } from '@react-three/fiber';

export default function NeonBackground() {
  return (
    <div className="absolute inset-0 bg-neural-dark overflow-hidden">
      <Canvas shadows dpr={[1, 2]} performance={{ min: 0.5 }} camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 5]} intensity={0.3} color="#00e0ff" />
      </Canvas>
    </div>
  );
}
