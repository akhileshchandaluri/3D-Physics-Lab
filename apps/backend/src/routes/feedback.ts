import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { experiment_slug, message } = req.body;

  if (!experiment_slug || !message) {
    return res.status(400).json({ error: 'experiment_slug and message are required' });
  }

  try {
    await pool.query(
      'INSERT INTO feedback (experiment_slug, message) VALUES (?, ?)',
      [experiment_slug, message]
    );

    res.status(201).json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
