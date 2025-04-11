import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, errorMiddleware, authRoutes, userRoutes, swipeRoutes, chatRoutes, callRoutes, confessionRoutes, notificationRoutes, statsRoutes, Message, Call } from './lib/index.js';
import schedule from 'node-schedule';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:8081', 'https://love-is-free--ylz6bpd06y.expo.app'], // Explicitly allow frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Connect to MongoDB with error handling
const startServer = async () => {
  try {
    await connectDB();

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api', swipeRoutes);
    app.use('/api', chatRoutes);
    app.use('/api', callRoutes);
    app.use('/api', confessionRoutes);
    app.use('/api', notificationRoutes);
    app.use('/api', statsRoutes);

    // Schedule job to delete unread messages after 5 days
    schedule.scheduleJob('0 0 * * *', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      await Message.deleteMany({
        readStatus: false,
        createdAt: { $lt: fiveDaysAgo }
      });
      console.log('Deleted old unread messages');
    });

    // Schedule job to delete ended calls older than 7 days
    schedule.scheduleJob('0 0 * * *', async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await Call.deleteMany({
        status: 'ended',
        endTime: { $lt: sevenDaysAgo }
      });
      console.log('Deleted old ended calls');
    });

    // Swagger Documentation
    const swaggerDoc = yaml.load(path.join(__dirname, '../swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

    console.log('Server setup complete');
  } catch (error) {
    console.error('Failed to start server due to DB connection error:', error.message);
    process.exit(1);
  }
};

// Error handling middleware (must be after routes)
app.use(errorMiddleware);

startServer();

export { app };