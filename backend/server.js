import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './db/connection.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js'
import driversRouter from './routes/drivers.js';
import busesRouter from './routes/buses.js';
import routesRouter from './routes/routes.js';
import schedulesRouter from './routes/schedules.js';
import tripsRouter from './routes/trips.js';
import notificationsRouter from './routes/notifications.js';
import parentsRouter from './routes/parents.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174'], 
  credentials: true 
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/ping-db', async (req, res) => {
  try {
    await testConnection();
    res.json({ ok: true, msg: 'DB reachable' });
  } catch (err) {
    console.error('DB ping error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/buses', busesRouter);
app.use('/api/routes', routesRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/parents', parentsRouter);

const PORT = process.env.PORT || 25565;
async function start() {
  try {
    await testConnection();
    console.log('Successfully connected to DB');
  } catch (err) {
    console.warn('Unable to connect to DB on startup, continuing without DB:', err.message);
  }

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join room based on user ID
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer.listen(PORT, () => {
    console.log('Server is running on port', PORT);
    console.log('WebSocket server is ready');
  });

  httpServer.on('error', err => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Another server may be running.`);
      return;
    }
    console.error('Server error:', err);
  });

  // global handlers to avoid abrupt exit during development
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}

start();