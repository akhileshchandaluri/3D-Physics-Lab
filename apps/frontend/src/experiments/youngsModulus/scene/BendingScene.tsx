import { Suspense, useMemo, useLayoutEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { MATERIALS, type MaterialKey } from '../physics/bending';
import styles from './BendingScene.module.css';

interface BendingSceneProps {
  materialKey: MaterialKey;
  massKg: number;
  elevationM: number;
  exaggerationFactor: number;
  onExaggerationChange: (factor: number) => void;
  supportDistanceM?: number;
  overhangM?: number;
  beamLengthM?: number;
  breadthM?: number;
  thicknessM?: number;
}

const LAB_MODELS = [
  '/physics-laboratory/physicslabfloor.glb',
  '/physics-laboratory/physicslabwalls.glb',
  '/physics-laboratory/tables.glb',
  '/physics-laboratory/mainscene.glb',
] as const;

for (const url of LAB_MODELS) {
  useGLTF.preload(url);
}

const KNIFE_EDGE_HEIGHT = 0.08;
const TABLE_TOP = 1.084;
const APPARATUS_SCALE = 0.65;
const RIG_OFFSET = new THREE.Vector3(3.9, TABLE_TOP, -4.33);

function rigWorld(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z).multiplyScalar(APPARATUS_SCALE).add(RIG_OFFSET);
}

const FRAMED_TARGET = rigWorld(0.0, 0.12, 0);
const FRAMED_POSITION = FRAMED_TARGET.clone().add(new THREE.Vector3(0.0, 0.28, 1.35));
const LAMP_POSITION = rigWorld(0.0, 0, 0).setY(2.42);

/**
 * 3D Physics Laboratory room environment (walls, floor, wooden tables, room dressing).
 */
function Laboratory() {
  const floor = useGLTF(LAB_MODELS[0]);
  const walls = useGLTF(LAB_MODELS[1]);
  const tables = useGLTF(LAB_MODELS[2]);
  const dressing = useGLTF(LAB_MODELS[3]);
  const wood = useTexture('/physics-laboratory/tables_texture.png');

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    wood.colorSpace = THREE.SRGBColorSpace;
    wood.wrapS = THREE.RepeatWrapping;
    wood.wrapT = THREE.RepeatWrapping;
    wood.needsUpdate = true;
  }, [wood]);

  const scenes = useMemo(() => {
    return [floor.scene, walls.scene, tables.scene, dressing.scene].map((source) => {
      const scene = source.clone(true);
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        child.receiveShadow = true;
        const material = child.material;
        if (
          material instanceof THREE.MeshStandardMaterial &&
          material.name === 'Wood Floor Walnut'
        ) {
          material.map = wood;
          material.color.set('#ffffff');
          material.needsUpdate = true;
        }
      });
      return scene;
    });
  }, [floor.scene, walls.scene, tables.scene, dressing.scene, wood]);

  return (
    <group>
      {scenes.map((scene, index) => (
        <primitive key={LAB_MODELS[index]} object={scene} />
      ))}
    </group>
  );
}

/**
 * Workbench overhead lamp and focused warm spotlight.
 */
function BenchLight() {
  const target = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    target.position.set(LAMP_POSITION.x, TABLE_TOP, LAMP_POSITION.z);
    target.updateMatrixWorld();
  }, [target]);

  return (
    <group>
      <primitive object={target} />
      <directionalLight
        position={[LAMP_POSITION.x + 1.4, 4.6, LAMP_POSITION.z + 2]}
        target={target}
        intensity={2.2}
      />
      <directionalLight
        position={[LAMP_POSITION.x, LAMP_POSITION.y, LAMP_POSITION.z]}
        target={target}
        intensity={3.8}
        color="#fff6ea"
      />
      <mesh position={LAMP_POSITION.toArray()}>
        <boxGeometry args={[0.34, 0.035, 0.2]} />
        <meshStandardMaterial
          color="#f7f1e6"
          emissive="#ffe7c2"
          emissiveIntensity={1.1}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[LAMP_POSITION.x, LAMP_POSITION.y + 0.12, LAMP_POSITION.z]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 10]} />
        <meshStandardMaterial color="#8d939c" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Procedural mesh for the bent beam under uniform bending.
 * Between knife edges: circular arc with center rise e_vis.
 * Overhangs: straight tangent lines matching slope at knife edges.
 */
function BentBeamMesh({
  materialKey,
  elevationM,
  exaggerationFactor,
  supportDistanceM = 0.7,
  beamLengthM = 1.0,
  breadthM = 0.025,
  thicknessM = 0.003,
}: {
  materialKey: MaterialKey;
  elevationM: number;
  exaggerationFactor: number;
  supportDistanceM?: number;
  beamLengthM?: number;
  breadthM?: number;
  thicknessM?: number;
}) {
  const eVis = elevationM * exaggerationFactor;
  const halfSpan = supportDistanceM / 2.0;
  const halfTotal = beamLengthM / 2.0;

  const visualThickness = Math.max(thicknessM * 1.5, 0.008);
  const visualBreadth = Math.max(breadthM, 0.035);

  const geometry = useMemo(() => {
    const segments = 80;
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];

    const evaluateBeam = (x: number): { y: number; slope: number } => {
      const absX = Math.abs(x);
      if (absX <= halfSpan) {
        const y = KNIFE_EDGE_HEIGHT + eVis * (1.0 - Math.pow(x / halfSpan, 2));
        const slope = -eVis * ((2.0 * x) / Math.pow(halfSpan, 2));
        return { y, slope };
      } else {
        const slopeMag = (4.0 * eVis) / supportDistanceM;
        const slope = x > 0 ? -slopeMag : slopeMag;
        const y = KNIFE_EDGE_HEIGHT - slopeMag * (absX - halfSpan);
        return { y, slope };
      }
    };

    for (let i = 0; i <= segments; i++) {
      const x = -halfTotal + (i / segments) * beamLengthM;
      const { y, slope } = evaluateBeam(x);

      const angle = Math.atan(slope);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);

      const halfT = visualThickness / 2.0;
      const halfB = visualBreadth / 2.0;

      positions.push(x + nx * halfT, y + ny * halfT, halfB);
      positions.push(x + nx * halfT, y + ny * halfT, -halfB);
      positions.push(x - nx * halfT, y - ny * halfT, halfB);
      positions.push(x - nx * halfT, y - ny * halfT, -halfB);
    }

    for (let i = 0; i < segments; i++) {
      const base = i * 4;
      const next = (i + 1) * 4;

      indices.push(base + 0, next + 0, next + 1);
      indices.push(base + 0, next + 1, base + 1);

      indices.push(base + 2, next + 3, next + 2);
      indices.push(base + 2, base + 3, next + 3);

      indices.push(base + 0, next + 2, next + 0);
      indices.push(base + 0, base + 2, next + 2);

      indices.push(base + 1, next + 1, next + 3);
      indices.push(base + 1, next + 3, base + 3);
    }

    indices.push(0, 1, 3);
    indices.push(0, 3, 2);

    const end = segments * 4;
    indices.push(end + 0, end + 3, end + 1);
    indices.push(end + 0, end + 2, end + 3);

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, [eVis, halfSpan, halfTotal, beamLengthM, supportDistanceM, visualThickness, visualBreadth]);

  const matSpec = MATERIALS[materialKey];
  const isWood = materialKey === 'wood';

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={matSpec.color}
        metalness={isWood ? 0.05 : 0.85}
        roughness={isWood ? 0.75 : 0.22}
      />
    </mesh>
  );
}

/**
 * Knife edge supports resting on the workbench table.
 */
function KnifeEdgeSupports({ supportDistanceM }: { supportDistanceM: number }) {
  const halfSpan = supportDistanceM / 2.0;

  return (
    <group>
      {[-halfSpan, halfSpan].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0, 0]}>
          <mesh position={[0, KNIFE_EDGE_HEIGHT * 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.04, KNIFE_EDGE_HEIGHT * 0.8, 0.08]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>

          <mesh
            position={[0, KNIFE_EDGE_HEIGHT * 0.9, 0]}
            rotation={[0, 0, Math.PI / 4]}
            castShadow
          >
            <boxGeometry args={[0.015, 0.015, 0.075]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Slotted mass hangers with weights suspended at overhangs.
 */
function MassHangers({
  massKg,
  elevationM,
  exaggerationFactor,
  supportDistanceM = 0.7,
  overhangM = 0.15,
}: {
  massKg: number;
  elevationM: number;
  exaggerationFactor: number;
  supportDistanceM?: number;
  overhangM?: number;
}) {
  const eVis = elevationM * exaggerationFactor;
  const hangerX = supportDistanceM / 2.0 + overhangM;
  const hangerY = KNIFE_EDGE_HEIGHT - ((4.0 * eVis) / supportDistanceM) * overhangM;
  const numWeights = Math.min(5, Math.max(1, Math.round(massKg / 0.1)));

  return (
    <group>
      {[-hangerX, hangerX].map((hx, idx) => (
        <group key={idx} position={[hx, hangerY, 0]}>
          <mesh position={[0, 0.01, 0]}>
            <torusGeometry args={[0.02, 0.0025, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
          </mesh>

          <mesh position={[0, -0.09, 0]} castShadow>
            <cylinderGeometry args={[0.0018, 0.0018, 0.18, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>

          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.006, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>

          {Array.from({ length: numWeights }).map((_, wIdx) => (
            <group key={wIdx} position={[0, -0.172 + wIdx * 0.0075, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.022, 0.022, 0.0065, 24]} />
                <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.25} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * Travelling microscope at the beam center.
 */
function TravellingMicroscope({
  elevationM,
  exaggerationFactor,
}: {
  elevationM: number;
  exaggerationFactor: number;
}) {
  const eVis = elevationM * exaggerationFactor;
  const targetY = KNIFE_EDGE_HEIGHT + eVis;

  return (
    <group position={[0, 0, 0.11]}>
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.03, 0.08]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.6} />
      </mesh>

      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.007, 0.007, 0.16, 16]} />
        <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
      </mesh>

      <mesh position={[0.012, 0.1, 0]}>
        <boxGeometry args={[0.004, 0.14, 0.012]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
      </mesh>

      <group position={[0, Math.min(0.16, Math.max(0.04, targetY)), 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.025, 0.025, 0.025]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>

        <mesh position={[0, 0, -0.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.006, 0.005, 0.07, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </mesh>

        <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.009, 0.008, 0.02, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      <mesh position={[0, targetY + 0.008, -0.11]} castShadow>
        <cylinderGeometry args={[0.0008, 0.0008, 0.016, 8]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Main 3D apparatus scene with full physics laboratory environment.
 */
export function BendingScene({
  materialKey,
  massKg,
  elevationM,
  exaggerationFactor,
  onExaggerationChange,
  supportDistanceM = 0.7,
  overhangM = 0.15,
  beamLengthM = 1.0,
  breadthM = 0.025,
  thicknessM = 0.003,
}: BendingSceneProps) {
  return (
    <div className={styles.sceneContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>3D Experimental Rig (Uniform Bending)</h3>
        <p className={styles.caption}>Drag to rotate view, scroll to zoom.</p>
      </div>

      <div className={styles.canvasWrap}>
        <div className={styles.exaggerationBadge}>
          Visual Exaggeration: {exaggerationFactor}× (Exaggerated for visibility)
        </div>

        <Canvas
          shadows
          camera={{ position: FRAMED_POSITION.toArray(), fov: 36 }}
          gl={{ antialias: true, toneMappingExposure: 1.5 }}
        >
          <color attach="background" args={['#f4f1ea']} />
          <hemisphereLight args={['#fffaf3', '#d9c7b0', 1.6]} />
          <directionalLight position={[-2.5, 2.2, -1.5]} intensity={0.45} />

          <Suspense fallback={null}>
            <BenchLight />
            <Laboratory />

            {/* Apparatus positioned on top of the laboratory workbench */}
            <group position={RIG_OFFSET.toArray()} scale={APPARATUS_SCALE}>
              <KnifeEdgeSupports supportDistanceM={supportDistanceM} />

              <BentBeamMesh
                materialKey={materialKey}
                elevationM={elevationM}
                exaggerationFactor={exaggerationFactor}
                supportDistanceM={supportDistanceM}
                beamLengthM={beamLengthM}
                breadthM={breadthM}
                thicknessM={thicknessM}
              />

              <MassHangers
                massKg={massKg}
                elevationM={elevationM}
                exaggerationFactor={exaggerationFactor}
                supportDistanceM={supportDistanceM}
                overhangM={overhangM}
              />

              <TravellingMicroscope
                elevationM={elevationM}
                exaggerationFactor={exaggerationFactor}
              />

              <ContactShadows
                position={[0, 0.001, 0]}
                opacity={0.3}
                scale={2.4}
                blur={2.0}
                far={1.0}
              />
            </group>
          </Suspense>

          <OrbitControls
            makeDefault
            enablePan
            enableZoom
            enableRotate
            minDistance={0.5}
            maxDistance={2.5}
            target={FRAMED_TARGET.toArray()}
            minPolarAngle={0.5}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      </div>

      <div className={styles.sliderRow}>
        <div className={styles.sliderControl}>
          <label htmlFor="exaggeration-slider">Exaggerated for visibility (1× – 50×):</label>
          <input
            id="exaggeration-slider"
            type="range"
            min="1"
            max="50"
            step="1"
            value={exaggerationFactor}
            onChange={(e) => onExaggerationChange(Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.sliderVal}>{exaggerationFactor}×</span>
        </div>
        <p className={styles.caption}>
          Note: Actual beam deflection is ~1–5 mm; slider only scales 3D visual arc, not instrument readings.
        </p>
      </div>
    </div>
  );
}
