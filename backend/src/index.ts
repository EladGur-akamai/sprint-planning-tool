import express from 'express';
import cors from 'cors';
import teamMemberRoutes from './routes/teamMemberRoutes';
import sprintRoutes from './routes/sprintRoutes';
import holidayRoutes from './routes/holidayRoutes';
import { initDatabase } from './database/db';
import { dbConfig } from './database/config';

const app = express();
const PORT = dbConfig.port;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/members', teamMemberRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/holidays', holidayRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
