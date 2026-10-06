import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SLOT_MASS_KG, getMetal, type MetalId } from '../physics/materials'
import { creepStrain } from '../physics/creep'
import type { Engine } from '../sim/engine'
import { advanceEngine } from '../sim/engine'
import type { PartId, Placed } from '../sim/assembly'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

const BENCH_TOP = 0.08
const ROD_X = -0.02
const WIRE_X = 0.34
const CLAMP_Y = 1.7
const HOOK_Y0 = 0.86
const SCALE_X = 0.56
const UNIT_PER_MM = 0.00175
const SCALE_MAX_MM = 5
const WATCH_X = 0.72
const SHEET_X = -0.52
const SURFACE_Z = 0.22
const TABLE_TOP = 1.084
const APPARATUS_SCALE = 0.48
const RIG_OFFSET = new THREE.Vector3(3.9, TABLE_TOP - APPARATUS_SCALE * BENCH_TOP, -4.33)
const FRAMED_TARGET = rigWorld(0.2, 1.05, 0)
const FRAMED_POSITION = FRAMED_TARGET.clone().add(new THREE.Vector3(0.05, 0.22, 1.7))
const LAMP_POSITION = rigWorld(0.2, 0, 0).setY(2.42)

function rigWorld(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z).multiplyScalar(APPARATUS_SCALE).add(RIG_OFFSET)
}
const LAB_MODELS = [
  '/physics-laboratory/physicslabfloor.glb',
  '/physics-laboratory/physicslabwalls.glb',
  '/physics-laboratory/tables.glb',
  '/physics-laboratory/mainscene.glb',
] as const

interface LabSceneProps {
  placed: Placed
  next: PartId | null
  metalId: MetalId | null
  massKg: number
  engine: Engine
  dragId: string | null
  onAttach: (id: string) => void
  plaqueRef: RefObject<HTMLDivElement | null>
  watchRef: RefObject<HTMLDivElement | null>
  sheetRef: RefObject<HTMLDivElement | null>
  cameraUnlocked: boolean
}

export function LabScene(props: LabSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: FRAMED_POSITION.toArray(), fov: 34 }}
      gl={{ antialias: true, toneMappingExposure: 1.85 }}
    >
      <color attach="background" args={['#f4f1ea']} />
      <CameraRig />
      <hemisphereLight args={['#fffaf3', '#d9c7b0', 1.6]} />
      <directionalLight position={[-2.5, 2.2, -1.5]} intensity={0.45} />
      <BenchLight />
      <Laboratory />
      <group position={RIG_OFFSET} scale={APPARATUS_SCALE}>
        <Stand />
        <Apparatus {...props} />
        <Mounts {...props} />
        {props.placed.watch ? <WatchBody /> : null}
        {props.placed.sheet ? <Clipboard /> : null}
        <ContactShadows position={[0.25, BENCH_TOP + 0.001, 0]} opacity={0.16} scale={2.2} blur={2.2} far={1.2} />
      </group>
      <ClockDriver engine={props.engine} />
      <ScreenAnchors plaqueRef={props.plaqueRef} watchRef={props.watchRef} sheetRef={props.sheetRef} />
      <OrbitControls
        makeDefault
        enabled={props.cameraUnlocked && props.dragId == null}
        target={FRAMED_TARGET}
        minDistance={0.55}
        maxDistance={1.75}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
        minPolarAngle={0.94}
        maxPolarAngle={2.2}
      />
    </Canvas>
  )
}

function CameraRig() {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null
  const framed = useRef(false)
  useLayoutEffect(() => {
    if (framed.current) return
    camera.position.copy(FRAMED_POSITION)
    camera.lookAt(FRAMED_TARGET)
    camera.updateProjectionMatrix()
    if (!controls) return
    controls.target.copy(FRAMED_TARGET)
    controls.update()
    framed.current = true
  }, [camera, controls])
  return null
}

function BenchLight() {
  const target = useMemo(() => new THREE.Object3D(), [])
  useLayoutEffect(() => {
    target.position.set(LAMP_POSITION.x, TABLE_TOP, LAMP_POSITION.z)
    target.updateMatrixWorld()
  }, [target])
  return (
    <group>
      <primitive object={target} />
      <directionalLight
        position={[LAMP_POSITION.x + 1.4, 4.6, LAMP_POSITION.z + 2]}
        target={target}
        intensity={2.4}
      />
      <directionalLight
        position={[LAMP_POSITION.x, LAMP_POSITION.y, LAMP_POSITION.z]}
        target={target}
        intensity={4.5}
        color="#fff6ea"
      />
      <mesh position={LAMP_POSITION}>
        <boxGeometry args={[0.34, 0.035, 0.2]} />
        <meshStandardMaterial color="#f7f1e6" emissive="#ffe7c2" emissiveIntensity={1.1} roughness={0.4} />
      </mesh>
      <mesh position={[LAMP_POSITION.x, LAMP_POSITION.y + 0.12, LAMP_POSITION.z]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 10]} />
        <meshStandardMaterial color="#8d939c" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  )
}

function ClockDriver({ engine }: { engine: Engine }) {
  useFrame((_, dt) => advanceEngine(engine, dt, performance.now()))
  return null
}

function Laboratory() {
  const floor = useGLTF(LAB_MODELS[0])
  const walls = useGLTF(LAB_MODELS[1])
  const tables = useGLTF(LAB_MODELS[2])
  const dressing = useGLTF(LAB_MODELS[3])
  const wood = useTexture('/physics-laboratory/tables_texture.png')
  const scenes = useMemo(() => {
    wood.colorSpace = THREE.SRGBColorSpace
    wood.wrapS = THREE.RepeatWrapping
    wood.wrapT = THREE.RepeatWrapping
    return [floor.scene, walls.scene, tables.scene, dressing.scene].map((source) => {
      const scene = source.clone(true)
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        child.castShadow = true
        child.receiveShadow = true
        const material = child.material
        if (material instanceof THREE.MeshStandardMaterial && material.name === 'Wood Floor Walnut') {
          material.map = wood
          material.color.set('#ffffff')
          material.needsUpdate = true
        }
      })
      return scene
    })
  }, [floor.scene, walls.scene, tables.scene, dressing.scene, wood])
  return (
    <group>
      {scenes.map((scene, index) => (
        <primitive key={LAB_MODELS[index]} object={scene} />
      ))}
    </group>
  )
}

for (const url of LAB_MODELS) useGLTF.preload(url)

function Stand() {
  return (
    <group>
      <mesh position={[ROD_X - 0.16, BENCH_TOP + 0.035, 0]} castShadow>
        <boxGeometry args={[0.46, 0.05, 0.28]} />
        <meshStandardMaterial color="#8e98a3" metalness={0.55} roughness={0.38} />
      </mesh>
      <mesh position={[ROD_X, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.028, 1.84, 20]} />
        <meshStandardMaterial color="#d5dbe3" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0.18, 1.86, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.52, 16]} />
        <meshStandardMaterial color="#d5dbe3" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0.02, 1.86, 0]} castShadow>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial color="#aeb6c0" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  )
}

function ScreenAnchors({
  plaqueRef,
  watchRef,
  sheetRef,
}: {
  plaqueRef: RefObject<HTMLDivElement | null>
  watchRef: RefObject<HTMLDivElement | null>
  sheetRef: RefObject<HTMLDivElement | null>
}) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const plaque = useMemo(() => rigWorld(ROD_X - 0.12, BENCH_TOP + 0.22, 0.18), [])
  const watch = useMemo(() => rigWorld(WATCH_X, BENCH_TOP + 0.22, SURFACE_Z), [])
  const sheet = useMemo(() => rigWorld(SHEET_X, BENCH_TOP + 0.36, SURFACE_Z), [])
  useFrame(() => {
    place(plaqueRef.current, plaque, camera, size.width, size.height)
    place(watchRef.current, watch, camera, size.width, size.height)
    place(sheetRef.current, sheet, camera, size.width, size.height)
  })
  return null
}

function place(
  element: HTMLDivElement | null,
  point: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number,
) {
  if (!element) return
  const projected = point.clone().project(camera)
  const rawLeft = (projected.x * 0.5 + 0.5) * width
  const rawTop = (-projected.y * 0.5 + 0.5) * height
  const margin = 8
  const { scaleX, scaleY } = elementScale(element)
  const halfW = (element.offsetWidth * scaleX) / 2
  const halfH = (element.offsetHeight * scaleY) / 2
  const left = clamp(rawLeft, halfW + margin, Math.max(halfW + margin, width - halfW - margin))
  const top = clamp(rawTop, halfH + margin, Math.max(halfH + margin, height - halfH - margin))
  element.style.left = `${left}px`
  element.style.top = `${top}px`
}

function elementScale(element: HTMLElement) {
  const transform = getComputedStyle(element).transform
  if (!transform || transform === 'none') return { scaleX: 1, scaleY: 1 }
  const match = transform.match(/matrix\(([^)]+)\)/)
  if (!match) return { scaleX: 1, scaleY: 1 }
  const [a, b, c, d] = match[1].split(',').map((value) => Number(value))
  return {
    scaleX: Math.hypot(a, b) || 1,
    scaleY: Math.hypot(c, d) || 1,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function Apparatus({ placed, metalId, massKg, engine }: LabSceneProps) {
  const hook = useRef<THREE.Group>(null)
  const wire = useRef<THREE.Mesh>(null)
  const scale = useRef<THREE.Mesh>(null)
  const ruler = useRulerTexture()
  const color = metalId ? getMetal(metalId).color : '#dddddd'
  const stub = useRef<THREE.Mesh>(null)
  const fallY = useRef(HOOK_Y0)
  const fallV = useRef(0)
  const falling = useRef(false)
  const landed = useRef(false)
  const resting = CLAMP_Y - HOOK_Y0
  const slots = Math.round(massKg / SLOT_MASS_KG)

  useFrame((_, dt) => {
    const metal = engine.metalId ? getMetal(engine.metalId) : null
    const strain =
      metal && engine.referenceLengthM
        ? creepStrain(engine.creep, metal.beta, metal.viscousK, metal.elongationAtBreak)
        : 0
    const bottom = loadBottomLocal(placed.hanger ? slots : 0)
    const restY = BENCH_TOP - bottom
    const maxDrop = Math.max(0, HOOK_Y0 - restY)
    const gaugeM = engine.referenceLengthM ?? engine.lengthM
    const scenePerMetre = gaugeM > 0 ? (CLAMP_Y - HOOK_Y0) / gaugeM : 0
    const visualDrop = strain * gaugeM * engine.magnification * scenePerMetre
    let hookY = HOOK_Y0 - Math.min(visualDrop, maxDrop * (2 / 3))

    if (!engine.fractured) {
      falling.current = false
      landed.current = false
    } else {
      if (!falling.current) {
        falling.current = true
        fallY.current = hookY
        fallV.current = 0
      }
      fallV.current += 22 * Math.min(dt, 0.05)
      fallY.current -= fallV.current * Math.min(dt, 0.05)
      if (fallY.current <= restY) {
        fallY.current = restY
        if (!landed.current) {
          landed.current = true
          playThud()
        }
      }
      hookY = fallY.current
    }

    if (hook.current) hook.current.position.y = hookY
    if (wire.current) {
      wire.current.visible = !engine.fractured
      const length = Math.max(CLAMP_Y - hookY, 0.05)
      wire.current.scale.y = length
      wire.current.position.y = (CLAMP_Y + hookY) / 2
    }
    if (stub.current) stub.current.visible = engine.fractured
    if (scale.current) {
      const height = SCALE_MAX_MM * engine.magnification * UNIT_PER_MM
      scale.current.scale.y = height
      scale.current.position.y = HOOK_Y0 - height / 2
    }
  })

  return (
    <group>
      {placed.clamp ? (
        <mesh position={[WIRE_X, CLAMP_Y + 0.02, 0]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.08]} />
          <meshStandardMaterial color="#5c656e" metalness={0.75} roughness={0.32} />
        </mesh>
      ) : null}
      {placed.wire ? (
        <mesh ref={wire} position={[WIRE_X, (CLAMP_Y + HOOK_Y0) / 2, 0]} scale={[1, resting, 1]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 1, 12]} />
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
        </mesh>
      ) : null}
      {placed.wire ? (
        <mesh ref={stub} position={[WIRE_X, CLAMP_Y - 0.08, 0]} visible={false} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.16, 12]} />
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
        </mesh>
      ) : null}
      {placed.scale ? (
        <mesh ref={scale} position={[SCALE_X, HOOK_Y0 - 0.35, 0.02]} scale={[1, 0.7, 1]}>
          <planeGeometry args={[0.1, 1]} />
          <meshStandardMaterial map={ruler} roughness={0.9} metalness={0} />
        </mesh>
      ) : null}
      {placed.hook ? (
        <group ref={hook} position={[WIRE_X, HOOK_Y0, 0]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.035, 0.008, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#d2b48a" metalness={0.8} roughness={0.25} />
          </mesh>
          {placed.scale ? (
            <mesh position={[SCALE_X - WIRE_X - 0.045, 0, 0.03]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.016, 0.045, 3]} />
              <meshStandardMaterial color="#a33b32" roughness={0.45} />
            </mesh>
          ) : null}
          {placed.hanger ? <Hanger slots={slots} /> : null}
        </group>
      ) : null}
    </group>
  )
}

function loadBottomLocal(slots: number): number {
  if (slots <= 0) return -0.186
  return -0.22 - (slots - 1) * 0.026
}

function playThud() {
  const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextCtor) return
  const context = new AudioContextCtor()
  void context.resume()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(110, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(45, context.currentTime + 0.12)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.45, context.currentTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.2)
  oscillator.onended = () => void context.close()
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

function Hanger({ slots }: { slots: number }) {
  return (
    <group>
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.16, 10]} />
        <meshStandardMaterial color="#8d939c" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.18, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 20]} />
        <meshStandardMaterial color="#6a7178" metalness={0.7} roughness={0.35} />
      </mesh>
      {Array.from({ length: slots }, (_, index) => (
        <mesh key={index} position={[0, -0.21 - index * 0.026, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 28]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#3e454c' : '#2f353b'} metalness={0.65} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Mounts({ placed, next, massKg, dragId, onAttach }: LabSceneProps) {
  const canDrop = dragId !== null
  const slots = Math.round(massKg / SLOT_MASS_KG)
  return (
    <group>
      <DropMount active={canDrop && next === 'clamp'} position={[WIRE_X, CLAMP_Y, 0]} size={[0.28, 0.18, 0.18]} onDrop={() => onAttach(dragId ?? '')} />
      <DropMount active={canDrop && next === 'wire'} position={[WIRE_X, 1.25, 0]} size={[0.16, 0.7, 0.16]} onDrop={() => onAttach(dragId ?? '')} />
      <DropMount active={canDrop && next === 'hook' && !placed.hook} position={[WIRE_X, HOOK_Y0, 0]} size={[0.22, 0.18, 0.18]} onDrop={() => onAttach(dragId ?? '')} />
      <DropMount active={canDrop && next === 'scale'} position={[SCALE_X, 1.15, 0]} size={[0.18, 0.7, 0.12]} onDrop={() => onAttach(dragId ?? '')} />
      <DropMount active={canDrop && next === 'watch'} position={[WATCH_X, BENCH_TOP + 0.08, SURFACE_Z]} size={[0.36, 0.16, 0.28]} onDrop={() => onAttach(dragId ?? '')} />
      <DropMount active={canDrop && next === 'sheet'} position={[SHEET_X, BENCH_TOP + 0.12, SURFACE_Z]} size={[0.46, 0.16, 0.36]} onDrop={() => onAttach(dragId ?? '')} />
      <DropMount active={canDrop && next === 'hanger'} position={[WIRE_X, HOOK_Y0 - 0.16, 0]} size={[0.24, 0.2, 0.2]} onDrop={() => onAttach(dragId ?? '')} />
      <DropMount
        active={canDrop && dragId === 'weight' && placed.hanger && slots < 10}
        position={[WIRE_X, HOOK_Y0 - 0.34, 0]}
        size={[0.28, 0.16, 0.28]}
        onDrop={() => onAttach('weight')}
      />
    </group>
  )
}

function DropMount({
  active,
  position,
  size,
  onDrop,
}: {
  active: boolean
  position: [number, number, number]
  size: [number, number, number]
  onDrop: () => void
}) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (!material.current) return
    material.current.opacity = 0.575 + Math.sin(clock.elapsedTime * 5) * 0.125
  })
  if (!active) return null
  return (
    <mesh
      position={position}
      onPointerUp={(event) => {
        event.stopPropagation()
        onDrop()
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        ref={material}
        color="#1c1916"
        transparent
        opacity={0.575}
        emissive="#1c1916"
        emissiveIntensity={0.2}
        depthWrite={false}
      />
    </mesh>
  )
}

function WatchBody() {
  return (
    <mesh position={[WATCH_X, BENCH_TOP + 0.045, SURFACE_Z]} castShadow>
      <cylinderGeometry args={[0.12, 0.13, 0.05, 32]} />
      <meshStandardMaterial color="#23282d" metalness={0.55} roughness={0.4} />
    </mesh>
  )
}

function Clipboard() {
  return (
    <mesh position={[SHEET_X, BENCH_TOP + 0.14, SURFACE_Z]} rotation={[-0.7, 0.15, 0]} castShadow>
      <boxGeometry args={[0.42, 0.56, 0.02]} />
      <meshStandardMaterial color="#6b4226" roughness={0.8} />
    </mesh>
  )
}

function useRulerTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 180
    canvas.height = 900
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not draw the millimetre scale')
    context.fillStyle = '#f7f1e4'
    context.fillRect(0, 0, 180, 900)
    context.fillStyle = '#1c1915'
    context.font = 'bold 42px sans-serif'
    context.textBaseline = 'middle'
    for (let mm = 0; mm <= SCALE_MAX_MM; mm += 1) {
      const y = 36 + (mm / SCALE_MAX_MM) * 820
      context.fillRect(96, y, 70, 4)
      context.fillText(String(mm), 18, y)
    }
    for (let half = 0; half < SCALE_MAX_MM; half += 1) {
      const y = 36 + ((half + 0.5) / SCALE_MAX_MM) * 820
      context.fillRect(124, y, 36, 2)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [])
}
