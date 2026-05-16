import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Cylinder, Environment, ContactShadows, Html, Plane } from '@react-three/drei';

export const CreepExperimentUI = () => {
  const [params, setParams] = useState({
    initialLength: 15,
    loadMass: 200,
    totalDurationMinutes: 60,
    intervalMinutes: 5,
    materialType: 'lead',
  });

  const [simulationData, setSimulationData] = useState<any>(null);
  const [currentSimTime, setCurrentSimTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeMultiplier, setTimeMultiplier] = useState(1); // 1x = real time

  useEffect(() => {
    let animationFrameId: number;
    let lastTime: number | null = null;

    const animate = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;

      setCurrentSimTime(prevTime => {
        // time is in ms. deltaTime / 1000 is real seconds.
        // 1 sim minute = 60 real seconds.
        // So added sim minutes = (deltaTime in sec) / 60 * timeMultiplier
        const addedSimMinutes = ((deltaTime / 1000) / 60) * timeMultiplier;
        const newTime = prevTime + addedSimMinutes;
        
        if (newTime >= params.totalDurationMinutes) {
          setIsPlaying(false);
          return params.totalDurationMinutes;
        }
        return newTime;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying && simulationData) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, params.totalDurationMinutes, simulationData, timeMultiplier]);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = Math.floor((minutes * 60) % 60);
    const ms = Math.floor((minutes * 60 * 1000) % 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0').slice(0, 2)}`;
  };

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await response.json();
      setSimulationData(data);
      setCurrentSimTime(0);
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSimTime(Number(e.target.value));
  };

  const getInterpolatedFrame = () => {
    if (!simulationData || !simulationData.history) return null;
    const history = simulationData.history;
    for (let i = 0; i < history.length - 1; i++) {
      if (currentSimTime >= history[i].timeMinutes && currentSimTime <= history[i+1].timeMinutes) {
        const frame1 = history[i];
        const frame2 = history[i+1];
        const tRange = frame2.timeMinutes - frame1.timeMinutes;
        const ratio = tRange === 0 ? 0 : (currentSimTime - frame1.timeMinutes) / tRange;
        return {
          timeMinutes: currentSimTime,
          instantaneousLength: frame1.instantaneousLength + ratio * (frame2.instantaneousLength - frame1.instantaneousLength),
          elongation: frame1.elongation + ratio * (frame2.elongation - frame1.elongation),
          snapped: ratio > 0.5 ? frame2.snapped : frame1.snapped
        };
      }
    }
    return history[history.length - 1];
  };

  const getFracturePoint = () => {
    if (!simulationData || !simulationData.history) return null;
    return simulationData.history.find((frame: any) => frame.snapped);
  };
  const fractureFrame = getFracturePoint();

  const currentFrame = getInterpolatedFrame();

  const activeLength = currentFrame ? currentFrame.instantaneousLength : params.initialLength;
  const isSnapped = currentFrame ? currentFrame.snapped : false;

  const topWireLength = isSnapped ? params.initialLength * 0.5 : activeLength;
  const bottomWireLength = isSnapped ? activeLength * 0.5 : 0;
  // Floor is at y = -0.1. The weight bottom relative to the hook is -3.25
  // We want: loadYOffset + (30 - activeLength) - 3.25 = -0.1
  // loadYOffset = activeLength - 30 + 3.25 - 0.1 = activeLength - 26.85
  const loadYOffset = isSnapped ? activeLength - 26.85 : 0; 
  
  const materialColors = {
    copper: '#b87333',
    lead: '#5c5c66',
    aluminum: '#d9d9d9'
  };
  const wireColor = materialColors[params.materialType as keyof typeof materialColors] || '#d9d9d9';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
      
      {/* HUD Left Panel */}
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#f8fafc', width: '320px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }}></div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>Experiment Setup</h2>
        </div>
        
        <form onSubmit={runSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Material</label>
            <select 
              value={params.materialType} 
              onChange={(e) => setParams({ ...params, materialType: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', outline: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
            >
              <option value="lead">Lead</option>
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Length (cm)</label>
              <input 
                type="number" step="0.1" value={params.initialLength} 
                onChange={(e) => setParams({ ...params, initialLength: Number(e.target.value) })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Load (g)</label>
              <input 
                type="number" step="10" value={params.loadMass} 
                onChange={(e) => setParams({ ...params, loadMass: Number(e.target.value) })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Duration (m)</label>
              <input 
                type="number" value={params.totalDurationMinutes} 
                onChange={(e) => setParams({ ...params, totalDurationMinutes: Number(e.target.value) })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', outline: 'none' }}
              />
            </div>
          </div>
          
          <button type="submit" style={{ 
            marginTop: '10px', padding: '14px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', 
            border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
            fontSize: '15px'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            INITIALIZE SIMULATION
          </button>
        </form>

        {simulationData && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <span>Live Telemetry</span>
              {isSnapped && <span style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '12px' }}>CRITICAL FAILURE</span>}
            </h3>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Current Length</span>
                <span style={{ color: '#34d399', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px' }}>{activeLength.toFixed(4)} cm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Total Elongation</span>
                <span style={{ color: '#fbbf24', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px' }}>{Math.max(0, activeLength - params.initialLength).toFixed(4)} cm</span>
              </div>

              {isSnapped && fractureFrame && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Fractured At</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px' }}>{formatTime(fractureFrame.timeMinutes)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '4px', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>Final Length</span>
                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px' }}>{fractureFrame.instantaneousLength.toFixed(4)} cm</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div id="canvas-container" style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', 
        zIndex: 1
      }}>
        <Canvas camera={{ position: [0, 15, 35], fov: 45 }} gl={{ antialias: true, alpha: false }} shadows>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 30, 15]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} />
          <pointLight position={[-10, 10, -10]} intensity={0.8} color="#93c5fd" />
          
          <Environment preset="studio" />
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            minPolarAngle={Math.PI/4} 
            maxPolarAngle={Math.PI/2 - 0.05}
            minDistance={15}
            maxDistance={80}
            target={[0, 15, 0]}
          />
          
          {/* Studio Floor */}
          <Plane args={[100, 100]} position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
          </Plane>
          <Plane args={[100, 100]} position={[0, -0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#000000" />
          </Plane>
          <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={40} blur={2.5} far={10} />

          {/* Main Experiment Stand */}
          <group position={[0, 0, 0]}>
            {/* Base */}
            <mesh position={[-8, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[8, 1, 6]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Vertical Rod */}
            <mesh position={[-8, 18, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.3, 0.3, 36, 32]} />
              <meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.1} />
            </mesh>

            {/* Boss Head (Clamp Connector) */}
            <mesh position={[-8, 30, 0]} rotation={[0, 0, Math.PI/2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.8, 0.8, 1.5, 32]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Horizontal Arm */}
            <mesh position={[-4, 30, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.25, 0.25, 8, 32]} />
              <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.1} />
            </mesh>

            {/* Top Clamp for Wire */}
            <mesh position={[0, 30, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.5, 1.2, 1.5]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>

          {/* Dynamic Wire Top Part */}
          <Cylinder args={[0.03, 0.03, topWireLength, 16]} position={[0, 30 - topWireLength / 2, 0]} castShadow receiveShadow>
             <meshStandardMaterial color={wireColor} metalness={0.9} roughness={0.1} />
          </Cylinder>

          {/* Hanging Load */}
          {!isSnapped && (
            <group position={[0, 30 - topWireLength, 0]}>
              {/* Hook */}
              <mesh position={[0, -0.4, 0]} castShadow>
                <torusGeometry args={[0.3, 0.05, 16, 32, Math.PI]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* Weight */}
              <mesh position={[0, -2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.6, 1.6, 2.5, 32]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
              </mesh>
              <Text position={[0, -2, 1.7]} fontSize={0.6} color="#0f172a" fontWeight="bold" anchorX="center" anchorY="middle">
                {params.loadMass}g
              </Text>
            </group>
          )}

          {/* Dynamic Wire Bottom Part (If snapped) dropped with load */}
          {isSnapped && (
            <group position={[0, loadYOffset, 0]}>
              <Cylinder args={[0.03, 0.03, bottomWireLength, 16]} position={[0, 30 - activeLength + bottomWireLength / 2, 0]} castShadow receiveShadow>
                 <meshStandardMaterial color={wireColor} metalness={0.9} roughness={0.1} />
              </Cylinder>
              
              <group position={[0, 30 - activeLength, 0]}>
                <mesh position={[0, -0.4, 0]} castShadow>
                  <torusGeometry args={[0.3, 0.05, 16, 32, Math.PI]} />
                  <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0, -2, 0]} castShadow receiveShadow rotation={[Math.PI/2, Math.PI/4, 0]}>
                  {/* Fallen weight */}
                  <cylinderGeometry args={[1.6, 1.6, 2.5, 32]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
                </mesh>
              </group>
            </group>
          )}

          {isSnapped && (
            <Html position={[0, 15, 0]} center>
              <div style={{
                background: 'rgba(220, 38, 38, 0.15)', color: '#fca5a5', padding: '16px 32px',
                borderRadius: '16px', fontWeight: '800', fontSize: '32px',
                border: '1px solid rgba(248, 113, 113, 0.3)', textTransform: 'uppercase',
                letterSpacing: '4px', backdropFilter: 'blur(8px)', boxShadow: '0 0 30px rgba(220, 38, 38, 0.4)'
              }}>
                FRACTURED
              </div>
            </Html>
          )}
        </Canvas>
      </div>
        
      {/* Digital Timer Dashboard */}
      {simulationData && (
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          padding: '24px 32px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '450px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ display: 'flex', gap: '40px', color: '#64748b', fontSize: '11px', fontWeight: '800', marginBottom: '8px', letterSpacing: '2px' }}>
            <span>HOURS</span><span>MINUTES</span><span>SECONDS</span>
          </div>
          
          <div style={{
            background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)', padding: '16px 36px', borderRadius: '16px', 
            color: '#38bdf8', fontFamily: '"SF Mono", "Courier New", Courier, monospace', fontSize: '48px',
            border: '1px solid #1e293b', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8), 0 0 15px rgba(56, 189, 248, 0.1)',
            marginBottom: '24px', letterSpacing: '2px', fontWeight: 'bold', textShadow: '0 0 15px rgba(56, 189, 248, 0.6)'
          }}>
            {formatTime(currentSimTime)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  background: isPlaying ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: 'white', border: 'none', borderRadius: '50%', width: '56px', height: '56px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft: '4px'}}><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              
              <button 
                onClick={() => { setIsPlaying(false); setCurrentSimTime(0); }}
                style={{
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', color: 'white',
                  border: 'none', borderRadius: '50%', width: '56px', height: '56px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>SPEED</span>
              <select 
                value={timeMultiplier}
                onChange={(e) => setTimeMultiplier(Number(e.target.value))}
                style={{
                  background: 'transparent', color: '#38bdf8', border: 'none',
                  outline: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '14px'
                }}
              >
                <option value={1}>1x (Real Time)</option>
                <option value={10}>10x</option>
                <option value={60}>60x</option>
                <option value={600}>600x</option>
                <option value={3600}>3600x</option>
              </select>
            </div>
          </div>
          
          <div style={{ width: '100%', marginTop: '24px', position: 'relative' }}>
            <input 
              type="range" 
              min={0} 
              max={params.totalDurationMinutes} 
              step={0.1}
              value={currentSimTime} 
              onChange={handleSlider}
              style={{ 
                width: '100%', 
                accentColor: '#38bdf8',
                height: '8px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.1)',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      )}
      
    </div>
  );
};
