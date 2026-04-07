import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Cylinder, Text } from '@react-three/drei';

export const CreepExperimentUI = () => {
  const [params, setParams] = useState({
    initialLength: 15,
    loadMass: 200,
    totalDurationMinutes: 60,
    intervalMinutes: 5,
    materialType: 'lead',
  });

  const [simulationData, setSimulationData] = useState<any>(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

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
      setCurrentFrameIdx(0); // Reset animation
    } catch (err) {
      console.error(err);
    }
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrameIdx(Number(e.target.value));
  };

  // Determine physics lengths to show in 3D
  const activeLength = simulationData && simulationData.history?.length > 0
    ? simulationData.history[currentFrameIdx]?.instantaneousLength
    : params.initialLength;
    
  return (
    <>
      <div id="canvas-container">
        <Canvas camera={{ position: [0, 20, 40], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Environment preset="city" />
          <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#222" />
          <OrbitControls makeDefault />
          
          {/* Support Structure (Stand) */}
          <Cylinder args={[0.5, 0.5, 30, 32]} position={[-10, 15, 0]}>
            <meshStandardMaterial color="#888" metalness={0.8} />
          </Cylinder>
          <Cylinder args={[0.5, 0.5, 10, 32]} position={[-5, 29.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#888" metalness={0.8} />
          </Cylinder>

          {/* Wire */}
          <Cylinder args={[0.1, 0.1, activeLength, 16]} position={[0, 30 - activeLength / 2, 0]}>
             <meshStandardMaterial color={params.materialType === 'copper' ? '#b87333' : params.materialType === 'lead' ? '#7b7b80' : '#d9d9d9'} metalness={0.6} />
          </Cylinder>

          {/* Load Mass Box */}
          <mesh position={[0, 30 - activeLength - 1, 0]}>
            <boxGeometry args={[3, 2, 3]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
          <Text position={[0, 30 - activeLength - 0.5, 3]} fontSize={1} color="white">
            {String(params.loadMass) + "g"}
          </Text>
        </Canvas>
        
        {simulationData && (
          <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, background: 'rgba(0,0,0,0.8)', padding: 15, borderRadius: 8 }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Animation Timeline (t = {simulationData.history[currentFrameIdx].timeMinutes} mins)</h3>
            <input 
              type="range" 
              min={0} 
              max={simulationData.history.length - 1} 
              value={currentFrameIdx} 
              onChange={handleSlider}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: 5 }}>
              <span>Start (0m)</span>
              <span>L: {simulationData.history[currentFrameIdx].instantaneousLength.toFixed(5)}cm (ΔL: {simulationData.history[currentFrameIdx].elongation.toFixed(5)}cm)</span>
              <span>End ({params.totalDurationMinutes}m)</span>
            </div>
          </div>
        )}
      </div>

      <div id="ui-panel">
        <h2>Creep Simulation</h2>
        <form onSubmit={runSimulation}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>Material Type</label>
            <select 
              value={params.materialType} 
              onChange={(e) => setParams({ ...params, materialType: e.target.value })}
              style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555' }}
            >
              <option value="lead">Lead</option>
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>Initial Length (cm)</label>
            <input 
              type="number" step="0.1"
              value={params.initialLength} 
              onChange={(e) => setParams({ ...params, initialLength: Number(e.target.value) })}
              style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>Load Mass (gm)</label>
            <input 
              type="number" step="10"
              value={params.loadMass} 
              onChange={(e) => setParams({ ...params, loadMass: Number(e.target.value) })}
              style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>Total Duration (min)</label>
            <input 
              type="number" 
              value={params.totalDurationMinutes} 
              onChange={(e) => setParams({ ...params, totalDurationMinutes: Number(e.target.value) })}
              style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>Measure Interval (min)</label>
            <input 
              type="number" 
              value={params.intervalMinutes} 
              onChange={(e) => setParams({ ...params, intervalMinutes: Number(e.target.value) })}
              style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: 10, background: '#0066cc', color: 'white', border: 'none', cursor: 'pointer', borderRadius: 4 }}>
            Run Simulation
          </button>
        </form>

        {simulationData && (
          <div style={{ marginTop: 25, padding: 15, background: '#111', borderRadius: 4 }}>
            <h3 style={{ marginTop: 0 }}>Results</h3>
            <p style={{ fontSize: '13px' }}><strong>Beta (ß):</strong> {simulationData.beta.toExponential(3)}</p>
            <p style={{ fontSize: '13px' }}><strong>k:</strong> {simulationData.k.toExponential(3)}</p>
          </div>
        )}
      </div>
    </>
  );
};
