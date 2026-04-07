import { z } from 'zod';

// Define the shape and constraints of the incoming simulation request
export const SimulationRequestSchema = z.object({
  initialLength: z.number().positive("initialLength must be a positive number (cm)"),
  loadMass: z.number().positive("loadMass must be a positive number (gm)"),
  totalDurationMinutes: z.number().positive("totalDurationMinutes must be a positive number"),
  intervalMinutes: z.number().positive("intervalMinutes must be a positive number").default(3),
  materialType: z.enum(['lead', 'copper', 'aluminum'], {
    errorMap: () => ({ message: "materialType must be one of: lead, copper, aluminum" })
  }).default('lead')
});

// Infer the Typescript type directly from the Zod Schema
export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

// Outline the structure of a single simulation data point
export interface SimulationFrame {
  timeMinutes: number;         // t in minutes
  timeSeconds: number;         // t in seconds
  timeOneThird: number;        // t^(1/3)
  elongation: number;          // Δl
  instantaneousLength: number; // l_t
  deltaLOverL0: number;        // Δl / l_0
  deltaLOverLt: number;        // Δl / l_t
}

// Represent the overall response structure Sent back to the 3D client
export interface SimulationResponse {
  material: string;
  initialLength: number;
  loadMass: number;
  beta: number;
  k: number;
  history: SimulationFrame[];
}