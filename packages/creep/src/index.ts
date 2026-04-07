import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { SimulationService } from './services/physicsEngine';
import { SimulationRequestSchema, SimulationResponse } from './types/simulation';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: '*' })); // Configured for the frontend Three.js
app.use(express.json());

const simulationService = new SimulationService();

// Healthcheck Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'creep-physics-engine' });
});

// Root Route to avoid "Cannot GET /"
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Creep Physics Engine is running.',
    instructions: 'Use the POST /simulate endpoint with a valid JSON body (initialLength, loadMass, totalDurationMinutes, intervalMinutes, materialType)',
    health: 'GET /health'
  });
});

// Simulation Route
app.post('/simulate', (req: Request, res: Response) => {
  try {
    // 1. Validate request body against Zod Schema
    const validatedBody = SimulationRequestSchema.parse(req.body);

    // 2. Pass clean properties to the Physics Engine Service
    const { history, beta, k } = simulationService.generateSeries(validatedBody);

    // 3. Format and dispatch the robust response
    const responseData: SimulationResponse = {
      material: validatedBody.materialType,
      initialLength: validatedBody.initialLength,
      loadMass: validatedBody.loadMass,
      beta,
      k,
      history
    };
    res.status(200).json(responseData);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Return 400 Bad Request with Validation Issues
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
    }

    console.error("Internal Simulation Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Creep Simulation Package running on http://localhost:${PORT}`);
});