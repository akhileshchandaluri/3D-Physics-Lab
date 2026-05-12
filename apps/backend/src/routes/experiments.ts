import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
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

export default router;
