import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { extend } from '@react-three/fiber';

// Create a minimal shader material for holographic effects
const HolographicShaderMaterial = shaderMaterial(
  { time: 0 },
  // Simple vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Simple fragment shader
  `
    uniform float time;
    varying vec2 vUv;
    
    void main() {
      vec3 color = vec3(0.0, 0.8, 1.0);
      float pattern = sin(vUv.x * 10.0) * sin(vUv.y * 10.0 + time);
      gl_FragColor = vec4(color * pattern * 0.5 + color * 0.5, pattern * 0.7);
    }
  `
);



// Neural Network component
function NeuralNetwork() {
  const { isStreaming } = useStore();
  const [pulseIntensity, setPulseIntensity] = useState(0.2);
  const networkRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);
  const currentConnectionRef = useRef(0);
  const progressRef = useRef(0);
  
  // Effect to handle streaming state changes
  useEffect(() => {
    if (isStreaming) {
      setPulseIntensity(0.8); // More intense pulsing when streaming
    } else {
      setPulseIntensity(0.2); // Subtle pulsing when idle
    }
  }, [isStreaming]);
  
  // Create neural network nodes and connections
  const { nodes, connections } = useMemo(() => {
    const nodeCount = 35; // More nodes for a fuller globe
    const nodes = [];
    const connections = [];
    
    // Create nodes in a perfect spherical pattern for a globe shape
    for (let i = 0; i < nodeCount; i++) {
      // Use golden ratio to distribute points evenly on a sphere
      const phi = Math.acos(1 - 2 * (i / nodeCount));
      const theta = Math.PI * 2 * i * 0.618033988749895;
      
      // Fixed radius for a perfect sphere
      const radius = 4.0;
      
      // Convert spherical to cartesian coordinates (no z-axis flattening)
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      nodes.push({ id: i, position: [x, y, z], size: 0.05 + Math.random() * 0.03 });
    }
    
    // Create connections between nodes that are close to each other
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        const dx = node1.position[0] - node2.position[0];
        const dy = node1.position[1] - node2.position[1];
        const dz = node1.position[2] - node2.position[2];
        
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Connect nodes that are within a certain distance
        if (distance < 2.5) {
          connections.push({
            id: `${i}-${j}`,
            from: node1,
            to: node2,
            distance
          });
        }
      }
    }
    
    return { nodes, connections };
  }, []);
  
  // Animation for the neural network
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Rotate the entire network very slowly
    if (networkRef.current) {
      networkRef.current.rotation.y = time * 0.02;
      networkRef.current.rotation.x = Math.sin(time * 0.05) * 0.05;
    }
    
    // Animate single light moving from node to node
    if (lightRef.current && connections.length > 0) {
      // Update progress
      progressRef.current += 0.002; // Even slower movement for more elegant effect
      
      // When progress reaches 1, move to next connection
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        currentConnectionRef.current = (currentConnectionRef.current + 1) % connections.length;
      }
      
      const connection = connections[currentConnectionRef.current];
      const from = connection.from.position as [number, number, number];
      const to = connection.to.position as [number, number, number];
      
      // Smooth easing function
      const t = progressRef.current;
      const smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      
      // Update light position
      lightRef.current.position.set(
        from[0] * (1 - smoothT) + to[0] * smoothT,
        from[1] * (1 - smoothT) + to[1] * smoothT,
        from[2] * (1 - smoothT) + to[2] * smoothT
      );
      
      // Pulse the light based on streaming state
      const scale = 0.15 + Math.sin(time * 2) * 0.05 * pulseIntensity;
      lightRef.current.scale.set(scale, scale, scale);
    }
  });
  
  return (
    <group ref={networkRef}>
      {/* Neural network nodes */}
      {nodes.map((node) => (
        <mesh key={node.id} position={node.position as [number, number, number]}>
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Connections between nodes - with reduced opacity */}
      {connections.map((connection) => {
        const from = connection.from.position as [number, number, number];
        const to = connection.to.position as [number, number, number];
        
        return (
          <line key={connection.id}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array([...from, ...to])}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial 
              color="#00e0ff" 
              transparent 
              opacity={0.1} // Reduced opacity for cleaner look
            />
          </line>
        );
      })}
      
      {/* Single moving light along connections */}
      <mesh ref={lightRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial 
          color="#00e0ff" 
          transparent 
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Central HUD Circle component
function CentralHudCircle() {
  const { isStreaming } = useStore();
  const [pulseIntensity, setPulseIntensity] = useState(0.2);
  
  // Refs for the three segments of each ring
  const outerRing1Ref = useRef<THREE.Object3D>(null);
  const outerRing2Ref = useRef<THREE.Object3D>(null);
  const outerRing3Ref = useRef<THREE.Object3D>(null);
  
  const middleRing1Ref = useRef<THREE.Object3D>(null);
  const middleRing2Ref = useRef<THREE.Object3D>(null);
  const middleRing3Ref = useRef<THREE.Object3D>(null);
  
  const innerCircleRef = useRef<THREE.Object3D>(null);
  const centralDotRef = useRef<THREE.Object3D>(null);
  
  // State for ring scales
  const [outerRingScale, setOuterRingScale] = useState(1);
  const [middleRingScale, setMiddleRingScale] = useState(1);
  const [innerCircleScale, setInnerCircleScale] = useState(1);
  
  // Effect to handle streaming state changes
  useEffect(() => {
    if (isStreaming) {
      setPulseIntensity(0.8); // More intense pulsing when streaming
      // Expand rings when AI is active
      setOuterRingScale(1.15);
      setMiddleRingScale(1.12);
      setInnerCircleScale(1.1);
    } else {
      setPulseIntensity(0.2); // Subtle pulsing when idle
      // Return to normal size when AI is idle
      setOuterRingScale(1);
      setMiddleRingScale(1);
      setInnerCircleScale(1);
    }
  }, [isStreaming]);
  
  // Animation for the HUD circle
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Rotate outer ring segments in different directions
    if (outerRing1Ref.current) {
      outerRing1Ref.current.rotation.z = time * 0.1;
    }
    if (outerRing2Ref.current) {
      outerRing2Ref.current.rotation.z = -time * 0.15;
    }
    if (outerRing3Ref.current) {
      outerRing3Ref.current.rotation.z = time * 0.12;
    }
    
    // Rotate middle ring segments in different directions
    if (middleRing1Ref.current) {
      middleRing1Ref.current.rotation.z = -time * 0.08;
    }
    if (middleRing2Ref.current) {
      middleRing2Ref.current.rotation.z = time * 0.13;
    }
    if (middleRing3Ref.current) {
      middleRing3Ref.current.rotation.z = -time * 0.11;
    }
    
    // Pulse inner circle based on streaming state
    if (innerCircleRef.current) {
      // Base scale with expansion factor when streaming
      const baseScale = innerCircleScale * (1 + Math.sin(time * 2) * 0.05 * pulseIntensity);
      innerCircleRef.current.scale.set(baseScale, baseScale, 1);
      
      // Adjust opacity based on streaming state
      const innerMesh = innerCircleRef.current as THREE.Mesh;
      if (innerMesh && innerMesh.material instanceof THREE.Material) {
        // Brighten inner circle when streaming
        if (isStreaming) {
          (innerMesh.material as THREE.MeshBasicMaterial).opacity = 
            0.4 + Math.sin(time * 3) * 0.2;
        } else {
          (innerMesh.material as THREE.MeshBasicMaterial).opacity = 0.3;
        }
      }
    }
    
    // Pulse central dot when streaming
    if (centralDotRef.current) {
      const dotScale = 1 + Math.sin(time * 4) * 0.2 * pulseIntensity;
      centralDotRef.current.scale.set(dotScale, dotScale, 1);
      
      // Brighten central dot when streaming
      const dotMesh = centralDotRef.current as THREE.Mesh;
      if (dotMesh && dotMesh.material instanceof THREE.Material) {
        if (isStreaming) {
          (dotMesh.material as THREE.MeshBasicMaterial).opacity = 
            0.9 + Math.sin(time * 5) * 0.1;
        }
      }
    }
  });
  
  // Create a ring segment
  const createRingSegment = (innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const thetaLength = endAngle - startAngle;
    return (
      <ringGeometry 
        args={[innerRadius, outerRadius, 64, 1, startAngle, thetaLength]} 
      />
    );
  };
  
  return (
    <group position={[0, 0, 0]}>
      {/* Outer ring segments */}
      <group scale={[outerRingScale, outerRingScale, 1]}>
        <mesh ref={outerRing1Ref as React.RefObject<THREE.Mesh>}>
          {createRingSegment(3.8, 4, 0, Math.PI * 2/3)}
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.6} />
        </mesh>
        
        <mesh ref={outerRing2Ref as React.RefObject<THREE.Mesh>}>
          {createRingSegment(3.8, 4, Math.PI * 2/3, Math.PI * 4/3)}
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.6} />
        </mesh>
        
        <mesh ref={outerRing3Ref as React.RefObject<THREE.Mesh>}>
          {createRingSegment(3.8, 4, Math.PI * 4/3, Math.PI * 2)}
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.6} />
        </mesh>
      </group>
      
      {/* Middle ring segments */}
      <group scale={[middleRingScale, middleRingScale, 1]}>
        <mesh ref={middleRing1Ref as React.RefObject<THREE.Mesh>}>
          {createRingSegment(2.8, 3, 0, Math.PI * 2/3)}
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.7} />
        </mesh>
        
        <mesh ref={middleRing2Ref as React.RefObject<THREE.Mesh>}>
          {createRingSegment(2.8, 3, Math.PI * 2/3, Math.PI * 4/3)}
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.7} />
        </mesh>
        
        <mesh ref={middleRing3Ref as React.RefObject<THREE.Mesh>}>
          {createRingSegment(2.8, 3, Math.PI * 4/3, Math.PI * 2)}
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.7} />
        </mesh>
      </group>
      
      {/* Inner circle with gradient - lights up when AI is active */}
      <group scale={[innerCircleScale, innerCircleScale, 1]}>
        <mesh ref={innerCircleRef as React.RefObject<THREE.Mesh>}>
          <circleGeometry args={[2, 32]} />
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.3} />
        </mesh>
      </group>
      
      {/* Central dot - pulses when AI is active */}
      <mesh ref={centralDotRef as React.RefObject<THREE.Mesh>}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#00e0ff" transparent opacity={0.9} />
      </mesh>
      
      {/* Decorative lines */}
      {[0, 60, 120, 180, 240, 300].map((angle, index) => {
        const radians = (angle * Math.PI) / 180;
        const x1 = Math.cos(radians) * 4.2 * outerRingScale;
        const y1 = Math.sin(radians) * 4.2 * outerRingScale;
        const x2 = Math.cos(radians) * 5 * outerRingScale;
        const y2 = Math.sin(radians) * 5 * outerRingScale;
        
        return (
          <line key={index}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array([x1, y1, 0, x2, y2, 0])}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00e0ff" transparent opacity={0.6} />
          </line>
        );
      })}
    </group>
  );
}

// Main background component
// Register the custom material with extend
extend({ HolographicShaderMaterial });

export default function NeonBackground() {
  return (
    <div className="absolute inset-0 bg-neural-dark overflow-hidden">
      <Canvas shadows dpr={[1, 2]} performance={{ min: 0.5 }} camera={{ position: [0, 0, 18], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={1} color="#00e0ff" />
        
        {/* Main central neural network globe */}
        <NeuralNetwork />
        
        {/* HUD circle for decorative effect */}
        <CentralHudCircle />
        
        {/* Limited orbital controls for better mobile performance */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          rotateSpeed={0.2}
          autoRotate
          autoRotateSpeed={0.1}
          minPolarAngle={Math.PI / 2 - 0.3}
          maxPolarAngle={Math.PI / 2 + 0.3}
        />
      </Canvas>
    </div>
  );
}
