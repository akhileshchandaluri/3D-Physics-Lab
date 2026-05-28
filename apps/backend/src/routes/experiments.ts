import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db.js';
import { CREEP_EXPERIMENT_DATA } from '../experiments/creep/constants.js';
import { runCreepSimulation } from '../experiments/creep/physics.js';

const router = Router();

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    if (slug === 'creep') {
      return res.json(CREEP_EXPERIMENT_DATA);
    }

    const [rows] = await pool.query(
      'SELECT * FROM experiments WHERE slug = ?',
      [slug]
    );

    const experiments = rows as any[];

    if (experiments.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    res.json(experiments[0]);
  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/creep/simulate', (req: Request, res: Response) => {
  try {
    const { initialLength, loadMass, totalDuration, interval, materialType } = req.body;

    if (!initialLength || !loadMass || !totalDuration || !interval || !materialType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = runCreepSimulation({
      initialLength: Number(initialLength),
      loadMass: Number(loadMass),
      totalDuration: Number(totalDuration),
      interval: Number(interval),
      materialType,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error running creep simulation:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
