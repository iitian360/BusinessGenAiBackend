import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './db/connectDB.js';
import routes from './routes/index.js';
import { securityMiddleware } from './middleware/security.js';
import { morganMiddleware } from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}


const app = express();

// Security middleware
securityMiddleware(app);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

console.log('CORS Origin:', process.env.CORS_ORIGIN);


// app.use(cors())

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Logging middleware
app.use(morganMiddleware);

// Database connection
connectDB();

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app; 