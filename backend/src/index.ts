import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { runMigrations } from './db/connection';
import authRoutes from './routes/auth.routes';
// Import other routes as needed

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const startServer = async () => {
  try {
    // Run database migrations
    await runMigrations();

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
