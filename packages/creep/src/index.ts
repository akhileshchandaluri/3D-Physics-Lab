import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { SimulationService } from './services/physicsEngine';
import { SimulationRequestSchema, SimulationResponse } from './types/simulation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

const simulationService = new SimulationService();

// ── Healthcheck ───────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'creep-physics-engine' });
});

// ── Root info ────────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Creep Physics Engine – Metal Wire Creep Experiment',
    endpoint: 'POST /simulate',
    fields: {
      initialLength: 'number  – wire length in cm (e.g. 50)',
      loadMass: 'number  – hanging mass in grams (e.g. 200)',
      totalDurationMinutes: 'number  – experiment duration in minutes (e.g. 60)',
      intervalMinutes: 'number  – reading interval in minutes (default 3)',
      materialType: '"lead" | "copper" | "aluminum"  (default "lead")',
      noiseLevel: 'number  – Gaussian noise fraction 0–0.2 (default 0.015)',
    },
    health: 'GET /health',
  });
});

// ── Simulation ────────────────────────────────────────────────────────────────
app.post('/simulate', (req: Request, res: Response) => {
  try {
    const validated = SimulationRequestSchema.parse(req.body);

    const { history, beta, k, graph1Regression, graph2Regression } =
      simulationService.generateSeries(validated);

    const response: SimulationResponse = {
      material: validated.materialType,
      initialLength: validated.initialLength,
      loadMass: validated.loadMass,
      beta,
      k,
      graph1Regression,
      graph2Regression,
      history,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🔬 Creep Physics Engine  →  http://localhost:${PORT}`);
});