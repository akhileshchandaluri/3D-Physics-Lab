export interface SolarExperimentRecord {
  id?: number;
  name: string;
  slug: string;
  overview: string;
  aim: string;
  apparatus?: string;
  prerequisites?: string;
  theory: string;
  procedure_text?: string;
  formula: string;
  model_graph?: string;
  model_graph_image?: string;
  conclusion: string;
  analysis?: string;
  precautions?: string;
}
