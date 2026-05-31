-- Solar Cell Fill Factor experiment — schema extensions + content seed
-- Run against database: physim

SET NAMES utf8mb4;

-- Add content columns if they do not exist (MySQL 8+)
ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS apparatus TEXT NULL AFTER aim,
  ADD COLUMN IF NOT EXISTS prerequisites TEXT NULL AFTER apparatus,
  ADD COLUMN IF NOT EXISTS procedure_text TEXT NULL AFTER theory,
  ADD COLUMN IF NOT EXISTS precautions TEXT NULL AFTER procedure_text,
  ADD COLUMN IF NOT EXISTS model_graph TEXT NULL AFTER formula,
  ADD COLUMN IF NOT EXISTS analysis TEXT NULL AFTER conclusion,
  ADD COLUMN IF NOT EXISTS model_graph_image VARCHAR(512) NULL AFTER model_graph;

-- Fallback for MySQL versions without IF NOT EXISTS on ADD COLUMN:
-- Run the seed script (seed-solar-cell.ts) which checks information_schema first.

INSERT INTO experiments (
  slug,
  name,
  overview,
  aim,
  apparatus,
  prerequisites,
  theory,
  procedure_text,
  formula,
  model_graph,
  model_graph_image,
  conclusion,
  analysis,
  precautions
) VALUES (
  'solar-cell-characteristics',
  'Solar Cell Fill Factor — Characteristics',
  'This virtual experiment follows the in-lab program for determining the fill factor of a solar cell. You will assemble the circuit, record voltage and current at different load values, plot the I–V characteristic, and determine the maximum power point parameters (Imp, Vmp) together with open-circuit voltage (Voc) and short-circuit current (Isc).',
  'To determine the fill factor of the solar cell.',
  'Solar cell, milliammeter, voltmeter, variable load, key, lamp.',
  'Solar cell, light source, characterization setup, I–V measurement equipment.',
  'A solar cell converts light energy into electrical energy. When illuminated, it behaves as a practical voltage source with a characteristic current–voltage (I–V) curve.\n\nAt open circuit (very high load resistance), the voltage is maximum (Voc) and current is approximately zero. At short circuit (zero load resistance with key closed), the current is maximum (Isc) and voltage is approximately zero.\n\nBetween these limits, the cell delivers useful power. The maximum power point (MPP) occurs at (Vmp, Imp). The fill factor compares the actual maximum power to the ideal rectangular power that would be obtained from Voc and Isc alone.',
  '1. Connect the circuit as shown in the diagram.\n2. Switch on the lamp. Keep the lamp close to the solar cell and adjust it so that the incident light falls normally on the cell.\n3. Set the load resistance to maximum (e.g. 10,000 Ω). Measure the open-circuit voltage Voc.\n4. Close the key. Set the load resistance to minimum (zero). Note the short-circuit current Isc.\n5. Vary the load in equal steps. For each load R, note the output current I and voltage V.\n6. Enter the readings in tabular form and identify Vmp and Imp at maximum power P = V × I.',
  'Fill factor (N):\n\nN = (Imp / Isc) × (Vmp / Voc) = Pmax / (Voc × Isc)\n\nWhere:\n• Imp — current at maximum power (A)\n• Vmp — voltage at maximum power (V)\n• Isc — short-circuit current (A)\n• Voc — open-circuit voltage (V)\n• Pmax — maximum useful power = Vmp × Imp (W)\n\nPower at any load:\nP = V × I',
  'Model I–V graph (current i versus voltage V):\n\n• The curve meets the current axis at Isc (short-circuit current).\n• The curve meets the voltage axis at Voc (open-circuit voltage).\n• The maximum power point is at (Vmp, Imp).\n• The rectangle with sides Vmp and Imp represents maximum useful power.\n• Fill factor is the ratio of this rectangle area to the full Voc × Isc rectangle.',
  '/exp/solar/model-graph-reference.png',
  'From the recorded readings, determine Voc, Isc, Vmp, Imp, and the maximum power. Calculate the fill factor N using the formula. Compare the experimental I–V curve with the model graph and discuss how load resistance affects operating point.',
  'Analysis and inferences:\n\n• The fill factor of the cell, n = (Imp/Isc) × (Vmp/Voc).\n• Comment on how lamp distance and load steps affect the curve.\n• State whether the MPP lies in the expected region of the characteristic.',
  '1. Do not set the lamp very close to the cell; overheating may change the characteristics.\n2. Keep the intensity of the light constant throughout the experiment.\n3. Change the load in equal steps slowly.'
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  overview = VALUES(overview),
  aim = VALUES(aim),
  apparatus = VALUES(apparatus),
  prerequisites = VALUES(prerequisites),
  theory = VALUES(theory),
  procedure_text = VALUES(procedure_text),
  formula = VALUES(formula),
  model_graph = VALUES(model_graph),
  model_graph_image = VALUES(model_graph_image),
  conclusion = VALUES(conclusion),
  analysis = VALUES(analysis),
  precautions = VALUES(precautions);
