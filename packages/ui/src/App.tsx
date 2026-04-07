import { useState } from 'react';
import { CreepExperimentUI } from './experiments/creep/CreepUI';

const App = () => {
  const [activeExperiment, setActiveExperiment] = useState('creep');

  return (
    <>
      <header id="header">
        <h1 style={{ margin: 0, fontSize: '18px', flex: 1 }}>KL Physics Lab UI Testbed</h1>
        <div>
          <label style={{ marginRight: '10px' }}>Select Experiment:</label>
          <select 
            value={activeExperiment} 
            onChange={(e) => setActiveExperiment(e.target.value)}
            style={{ padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }}
          >
            <option value="creep">Creep Behavior</option>
            <option value="ohms-law">Ohm's Law</option>
          </select>
        </div>
      </header>

      <div id="main-content">
        {activeExperiment === 'creep' && <CreepExperimentUI />}
        {activeExperiment === 'ohms-law' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Ohm's Law UI placeholder...</h2>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
