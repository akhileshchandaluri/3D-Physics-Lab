import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CRYSTALS } from '../physics/bragg';
import styles from './LatticeScene.module.css';

interface LatticeSceneProps {
  crystalKey: string;
  twoThetaDeg: number;
  highlightHkl?: { h: number; k: number; l: number; dSpacingA: number } | null;
}

/**
 * 3D Rock-salt crystal lattice with alternating cation and anion spheres.
 */
function CrystalLattice({
  crystalKey,
  highlightHkl,
}: {
  crystalKey: string;
  highlightHkl?: { h: number; k: number; l: number; dSpacingA: number } | null;
}) {
  const crystal = CRYSTALS[crystalKey] || CRYSTALS['nacl'];
  const latticeSize = 4; // 4x4x4 ion grid (3x3x3 unit subcells)
  const spacing = 0.55;

  const { ions, bonds } = useMemo(() => {
    const ionList: {
      position: [number, number, number];
      isCation: boolean;
      radius: number;
      color: string;
    }[] = [];
    const bondList: [number, number, number, number, number, number][] = [];

    const offset = ((latticeSize - 1) * spacing) / 2;

    for (let x = 0; x < latticeSize; x++) {
      for (let y = 0; y < latticeSize; y++) {
        for (let z = 0; z < latticeSize; z++) {
          const isCation = (x + y + z) % 2 === 0;
          const px = x * spacing - offset;
          const py = y * spacing - offset;
          const pz = z * spacing - offset;

          ionList.push({
            position: [px, py, pz],
            isCation,
            radius: isCation ? 0.08 : 0.12,
            color: isCation ? crystal.cationColor : crystal.anionColor,
          });

          // Add neighbor bonds along +x, +y, +z
          if (x + 1 < latticeSize) {
            bondList.push([px, py, pz, px + spacing, py, pz]);
          }
          if (y + 1 < latticeSize) {
            bondList.push([px, py, pz, px, py + spacing, pz]);
          }
          if (z + 1 < latticeSize) {
            bondList.push([px, py, pz, px, py, pz + spacing]);
          }
        }
      }
    }

    return { ions: ionList, bonds: bondList };
  }, [crystal, latticeSize, spacing]);

  // Translucent Bragg lattice plane orientation
  const planeQuads = useMemo(() => {
    if (!highlightHkl) return null;
    const { h, k, l } = highlightHkl;
    const normal = new THREE.Vector3(h, k, l).normalize();
    const planeSize = 2.4;

    // Create a mesh plane perpendicular to (h,k,l)
    const geom = new THREE.PlaneGeometry(planeSize, planeSize);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    return (
      <group>
        {[-0.35, 0, 0.35].map((dOffset, idx) => (
          <mesh
            key={idx}
            geometry={geom}
            quaternion={quat}
            position={[normal.x * dOffset, normal.y * dOffset, normal.z * dOffset]}
          >
            <meshStandardMaterial
              color="#f59e0b"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    );
  }, [highlightHkl]);

  return (
    <group>
      {/* Ions */}
      {ions.map((ion, idx) => (
        <mesh key={idx} position={ion.position} castShadow>
          <sphereGeometry args={[ion.radius, 16, 16]} />
          <meshStandardMaterial
            color={ion.color}
            metalness={0.2}
            roughness={0.4}
            emissive={ion.color}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}

      {/* Crystal Bonds */}
      {bonds.map((b, idx) => {
        const p1 = new THREE.Vector3(b[0], b[1], b[2]);
        const p2 = new THREE.Vector3(b[3], b[4], b[5]);
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const len = p1.distanceTo(p2);
        const dir = p2.clone().sub(p1).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        return (
          <mesh key={idx} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.012, 0.012, len, 8]} />
            <meshStandardMaterial color="#475569" opacity={0.6} transparent />
          </mesh>
        );
      })}

      {/* Highlighted Plane Family */}
      {planeQuads}
    </group>
  );
}

/**
 * Goniometer apparatus with incident X-ray beam and rotating detector arm.
 */
function GoniometerArms({ twoThetaDeg }: { twoThetaDeg: number }) {
  const thetaDeg = twoThetaDeg / 2.0;
  const thetaRad = (thetaDeg * Math.PI) / 180.0;
  const twoThetaRad = (twoThetaDeg * Math.PI) / 180.0;
  const armRadius = 2.0;

  // Incident beam arrow coming into origin at angle theta
  const beamSourceX = -armRadius * Math.cos(thetaRad);
  const beamSourceY = armRadius * Math.sin(thetaRad);

  // Detector arm position at 2theta relative to incident beam
  const detX = armRadius * Math.cos(twoThetaRad - thetaRad);
  const detY = armRadius * Math.sin(twoThetaRad - thetaRad);

  return (
    <group>
      {/* Circular Goniometer Base Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <ringGeometry args={[armRadius - 0.05, armRadius + 0.05, 64]} />
        <meshBasicMaterial color="#334155" side={THREE.DoubleSide} />
      </mesh>

      {/* Incident X-ray Tube */}
      <group position={[beamSourceX, beamSourceY, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Incident Beam Ray to Center */}
        <line>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-beamSourceX, -beamSourceY, 0)]);
            }}
          />
          <lineBasicMaterial color="#38bdf8" linewidth={2} />
        </line>
      </group>

      {/* Scintillation / Semiconductor Detector */}
      <group position={[detX, detY, 0]}>
        <mesh>
          <boxGeometry args={[0.22, 0.14, 0.14]} />
          <meshStandardMaterial color="#8d1b2e" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Diffracted Ray to Detector */}
        <line>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.setFromPoints([new THREE.Vector3(-detX, -detY, 0), new THREE.Vector3(0, 0, 0)]);
            }}
          />
          <lineBasicMaterial color="#ef4444" linewidth={2} />
        </line>
      </group>
    </group>
  );
}

export function LatticeScene({
  crystalKey,
  twoThetaDeg,
  highlightHkl,
}: LatticeSceneProps) {
  const crystal = CRYSTALS[crystalKey] || CRYSTALS['nacl'];

  return (
    <div className={styles.sceneWrapper}>
      <div className={styles.overlayInfo}>
        <span className={styles.crystalName}>{crystal.name}</span>
        <span>
          Cations: {crystal.cationSymbol} (Z = {crystal.cationZ}) | Anions: {crystal.anionSymbol} (Z ={' '}
          {crystal.anionZ})
        </span>
        {highlightHkl && (
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>
            Active Plane ({highlightHkl.h}
            {highlightHkl.k}
            {highlightHkl.l}) | d = {highlightHkl.dSpacingA} Å
          </span>
        )}
      </div>

      <div className={styles.goniometerOverlay}>
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>GONIOMETER 2θ</div>
        <div className={styles.goniometerValue}>{twoThetaDeg.toFixed(1)}°</div>
        <div style={{ fontSize: '10px', color: '#cbd5e1' }}>θ = {(twoThetaDeg / 2).toFixed(2)}°</div>
      </div>

      <Canvas
        camera={{ position: [2.5, 2.2, 3.2], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 5]} intensity={1.5} castShadow />
        <pointLight position={[-3, -2, -3]} intensity={0.5} />

        <CrystalLattice crystalKey={crystalKey} highlightHkl={highlightHkl} />
        <GoniometerArms twoThetaDeg={twoThetaDeg} />

        <OrbitControls
          enablePan={false}
          minDistance={1.8}
          maxDistance={7.0}
        />
      </Canvas>
    </div>
  );
}
