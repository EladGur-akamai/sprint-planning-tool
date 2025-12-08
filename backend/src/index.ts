import express from 'express';
import cors from 'cors';
import teamRoutes from './routes/teamRoutes';
import teamMemberRoutes from './routes/teamMemberRoutes';
import sprintRoutes from './routes/sprintRoutes';
import holidayRoutes from './routes/holidayRoutes';
import retroRoutes from './routes/retroRoutes';
import { initDatabase } from './database/db';
import { dbConfig } from './database/config';

const app = express();
const PORT = dbConfig.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/teams', teamRoutes);
app.use('/api/members', teamMemberRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/retro', retroRoutes);

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
