import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

function CreepModel({ materialType, initialLength, elongation, hasSnapped }: {
  materialType: string;
  initialLength: number;
  elongation: number;
  hasSnapped: boolean;
}) {
  const { scene } = useGLTF('/models/creep.glb');
  const wireRef = useRef<THREE.Mesh>(null);
  const weightRef = useRef<THREE.Mesh>(null);
  const smoothedLengthRef = useRef(0);

  const wireColor = useMemo(() => {
    switch (materialType) {
      case 'copper': return '#b87333';
      case 'lead': return '#7b7b80';
      case 'aluminum': return '#d9d9d9';
      default: return '#888888';
    }
  }, [materialType]);

  const wireMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: wireColor,
    metalness: 0.7,
    roughness: 0.3,
  }), [wireColor]);

  const weightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c0392b',
    metalness: 0.5,
    roughness: 0.4,
  }), []);

  // Adjust these values to align with your GLB model's hook position
  const hookPosition = new THREE.Vector3(0, 2.2, 0);
  const baseLength = initialLength * 0.15;
  const targetLength = hasSnapped ? baseLength * 1.3 : (baseLength + elongation * 0.15);

  useEffect(() => {
    smoothedLengthRef.current = targetLength;
  }, [targetLength]);

  useFrame((_, delta) => {
    // Smoothly interpolate wire extension so motion is continuous instead of per-frame jumps.
    smoothedLengthRef.current = THREE.MathUtils.damp(
      smoothedLengthRef.current || targetLength,
      targetLength,
      8,
      delta,
    );

    const animatedLength = smoothedLengthRef.current;

    if (wireRef.current) {
      wireRef.current.position.y = hookPosition.y - animatedLength / 2;
      wireRef.current.scale.y = animatedLength / baseLength;
    }
    if (weightRef.current) {
      weightRef.current.position.y = hookPosition.y - animatedLength - 0.3;
    }
  });

  return (
    <group>
      <primitive object={scene.clone()} scale={0.8} position={[0, 0, 0]} />

      {/* Wire */}
      <mesh ref={wireRef} position={[hookPosition.x, hookPosition.y - baseLength / 2, hookPosition.z]}>
        <cylinderGeometry args={[0.015, 0.015, baseLength, 8]} />
        <primitive object={wireMaterial} />
      </mesh>

      {/* Weight */}
      <mesh ref={weightRef} position={[hookPosition.x, hookPosition.y - baseLength - 0.3, hookPosition.z]}>
        <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
        <primitive object={weightMaterial} />
      </mesh>

      {/* Snap effect */}
      {hasSnapped && (
        <mesh position={[hookPosition.x, hookPosition.y - targetLength / 2, hookPosition.z]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function SceneContent({ materialType, initialLength, simulationData, currentFrameIdx, hasSnapped }: any) {
  const elongation = simulationData?.history?.[currentFrameIdx]?.elongation ?? 0;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      <CreepModel
        materialType={materialType}
        initialLength={initialLength}
        elongation={elongation}
        hasSnapped={hasSnapped}
      />

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export function CreepScene({ materialType, initialLength, simulationData, currentFrameIdx, hasSnapped }: any) {
  return (
    <div className="creep-scene-container">
      <Canvas
        camera={{ position: [3, 4, 6], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <SceneContent
          materialType={materialType}
          initialLength={initialLength}
          simulationData={simulationData}
          currentFrameIdx={currentFrameIdx}
          hasSnapped={hasSnapped}
        />
      </Canvas>
      {!simulationData && (
        <div className="creep-scene-placeholder">
          <span>Set parameters and run simulation</span>
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/creep.glb');
