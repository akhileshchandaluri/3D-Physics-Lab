export const MATERIAL_PROPERTIES: Record<string, { beta: number; k: number; snapThreshold: number }> = {
  lead: { beta: 0.00005, k: 0.000001, snapThreshold: 0.15 },
  copper: { beta: 0.00002, k: 0.0000005, snapThreshold: 0.08 },
  aluminum: { beta: 0.00003, k: 0.0000008, snapThreshold: 0.10 },
};

export const CREEP_EXPERIMENT_DATA = {
  slug: 'creep',
  title: 'Creep Behavior of Materials',
  overview: 'The creep experiment studies the time-dependent deformation of materials under constant load. When a material is subjected to a constant stress below its yield strength, it continues to deform slowly over time. This phenomenon is called creep.',
  aim: 'To determine the transient creep constant (β) and viscous creep constant (k) for different wire materials (Lead, Copper, Aluminum) by observing elongation over time.',
  theory: `Creep is the tendency of a solid material to deform permanently under mechanical stresses over time. It occurs as a result of long-term exposure to stress levels below the yield strength of the material.

The total creep deformation consists of two components:

1. Transient Creep (Primary Creep): The initial stage where the creep rate decreases with time. This is modeled as:
   Δl_t = β · l₀ · t^(1/3)

2. Viscous Creep (Secondary Creep): The steady-state stage where the creep rate becomes constant. This is modeled as:
   Δl_v = k · l_t · t

Total Elongation: Δl = Δl_t + Δl_v

Where:
- β = Transient creep constant (material property)
- k = Viscous creep constant (material property)
- l₀ = Initial length of the wire
- l_t = Instantaneous length at time t
- t = Time in seconds

The wire will eventually snap when the elongation exceeds the material's snap threshold.`,
  formula: `Transient Creep: Δl_t = β · l₀ · t^(1/3)
Viscous Creep: Δl_v = k · l_t · t
Total Elongation: Δl = Δl_t + Δl_v
Instantaneous Length: l_t = l₀ + Δl

Graph 1: Plot Δl/l₀ vs t^(1/3) → Slope gives β
Graph 2: Plot Δl/l_t vs t → Slope gives k`,
  conclusion: 'The creep constants β and k characterize the material\'s resistance to time-dependent deformation. Materials with lower values of β and k exhibit better creep resistance. Lead has the highest creep rate, followed by aluminum, and then copper.',
};
