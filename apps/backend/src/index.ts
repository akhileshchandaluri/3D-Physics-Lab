import express from 'express';
import experimentsRoute from './routes/experiments.js';
import feedbackRoute from './routes/feedback.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use('/api/experiments', experimentsRoute);
app.use('/api/feedback', feedbackRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
