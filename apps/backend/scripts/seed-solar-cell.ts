/**
 * Applies solar cell experiment schema + content to MySQL.
 * Usage: npx tsx apps/backend/scripts/seed-solar-cell.ts
 */
import { pool } from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLUMNS: { name: string; definition: string }[] = [
  { name: 'apparatus', definition: 'TEXT NULL' },
  { name: 'prerequisites', definition: 'TEXT NULL' },
  { name: 'procedure_text', definition: 'TEXT NULL' },
  { name: 'precautions', definition: 'TEXT NULL' },
  { name: 'model_graph', definition: 'TEXT NULL' },
  { name: 'analysis', definition: 'TEXT NULL' },
  { name: 'model_graph_image', definition: 'VARCHAR(512) NULL' },
];

const CONTENT = {
  slug: 'solar-cell-characteristics',
  name: 'Solar Cell Fill Factor — Characteristics',
  overview:
    'This virtual experiment follows the in-lab program for determining the fill factor of a solar cell. You will assemble the circuit, record voltage and current at different load values, plot the I–V characteristic, and determine the maximum power point parameters (Imp, Vmp) together with open-circuit voltage (Voc) and short-circuit current (Isc).',
  aim: 'To determine the fill factor of the solar cell.',
  apparatus: 'Solar cell, milliammeter, voltmeter, variable load, key, lamp.',
  prerequisites: 'Solar cell, light source, characterization setup, I–V measurement equipment.',
  theory:
    'A solar cell converts light energy into electrical energy. When illuminated, it behaves as a practical voltage source with a characteristic current–voltage (I–V) curve.\n\n' +
    'At open circuit (very high load resistance), the voltage is maximum (Voc) and current is approximately zero. At short circuit (zero load resistance with key closed), the current is maximum (Isc) and voltage is approximately zero.\n\n' +
    'Between these limits, the cell delivers useful power. The maximum power point (MPP) occurs at (Vmp, Imp). The fill factor compares the actual maximum power to the ideal rectangular power that would be obtained from Voc and Isc alone.',
  procedure_text:
    '1. Connect the circuit as shown in the diagram.\n' +
    '2. Switch on the lamp. Keep the lamp close to the solar cell and adjust it so that the incident light falls normally on the cell.\n' +
    '3. Set the load resistance to maximum (e.g. 10,000 Ω). Measure the open-circuit voltage Voc.\n' +
    '4. Close the key. Set the load resistance to minimum (zero). Note the short-circuit current Isc.\n' +
    '5. Vary the load in equal steps. For each load R, note the output current I and voltage V.\n' +
    '6. Enter the readings in tabular form and identify Vmp and Imp at maximum power P = V × I.',
  formula:
    'Fill factor (N):\n\n' +
    'N = (Imp / Isc) × (Vmp / Voc) = Pmax / (Voc × Isc)\n\n' +
    'Where:\n' +
    '• Imp — current at maximum power (A)\n' +
    '• Vmp — voltage at maximum power (V)\n' +
    '• Isc — short-circuit current (A)\n' +
    '• Voc — open-circuit voltage (V)\n' +
    '• Pmax — maximum useful power = Vmp × Imp (W)\n\n' +
    'Power at any load:\nP = V × I',
  model_graph:
    'Model I–V graph (current i versus voltage V):\n\n' +
    '• The curve meets the current axis at Isc (short-circuit current).\n' +
    '• The curve meets the voltage axis at Voc (open-circuit voltage).\n' +
    '• The maximum power point is at (Vmp, Imp).\n' +
    '• The rectangle with sides Vmp and Imp represents maximum useful power.\n' +
    '• Fill factor is the ratio of this rectangle area to the full Voc × Isc rectangle.',
  model_graph_image: '/exp/solar/model-graph-reference.png',
  conclusion:
    'From the recorded readings, determine Voc, Isc, Vmp, Imp, and the maximum power. Calculate the fill factor N using the formula. Compare the experimental I–V curve with the model graph and discuss how load resistance affects the operating point.',
  analysis:
    'Analysis and inferences:\n\n' +
    '• The fill factor of the cell, n = (Imp/Isc) × (Vmp/Voc).\n' +
    '• Comment on how lamp distance and load steps affect the curve.\n' +
    '• State whether the MPP lies in the expected region of the characteristic.',
  precautions:
    '1. Do not set the lamp very close to the cell; overheating may change the characteristics.\n' +
    '2. Keep the intensity of the light constant throughout the experiment.\n' +
    '3. Change the load in equal steps slowly.',
};

async function ensureColumns() {
  const [rows] = await pool.query<any[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'experiments'`,
  );
  const existing = new Set(rows.map((r) => r.COLUMN_NAME));

  for (const col of COLUMNS) {
    if (!existing.has(col.name)) {
      await pool.query(`ALTER TABLE experiments ADD COLUMN ${col.name} ${col.definition}`);
      console.log(`Added column: ${col.name}`);
    }
  }
}

async function upsertExperiment() {
  const [existing] = await pool.query<any[]>(
    'SELECT id FROM experiments WHERE slug = ?',
    [CONTENT.slug],
  );

  if (existing.length === 0) {
    await pool.query(
      `INSERT INTO experiments (
        slug, name, overview, aim, apparatus, prerequisites, theory,
        procedure_text, formula, model_graph, model_graph_image,
        conclusion, analysis, precautions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        CONTENT.slug,
        CONTENT.name,
        CONTENT.overview,
        CONTENT.aim,
        CONTENT.apparatus,
        CONTENT.prerequisites,
        CONTENT.theory,
        CONTENT.procedure_text,
        CONTENT.formula,
        CONTENT.model_graph,
        CONTENT.model_graph_image,
        CONTENT.conclusion,
        CONTENT.analysis,
        CONTENT.precautions,
      ],
    );
    console.log('Inserted solar cell experiment row.');
    return;
  }

  await pool.query(
    `UPDATE experiments SET
      name = ?, overview = ?, aim = ?, apparatus = ?, prerequisites = ?,
      theory = ?, procedure_text = ?, formula = ?, model_graph = ?,
      model_graph_image = ?, conclusion = ?, analysis = ?, precautions = ?
     WHERE slug = ?`,
    [
      CONTENT.name,
      CONTENT.overview,
      CONTENT.aim,
      CONTENT.apparatus,
      CONTENT.prerequisites,
      CONTENT.theory,
      CONTENT.procedure_text,
      CONTENT.formula,
      CONTENT.model_graph,
      CONTENT.model_graph_image,
      CONTENT.conclusion,
      CONTENT.analysis,
      CONTENT.precautions,
      CONTENT.slug,
    ],
  );
  console.log('Updated solar cell experiment row.');
}

async function main() {
  await ensureColumns();
  await upsertExperiment();
  await pool.end();
  console.log('Solar cell seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
