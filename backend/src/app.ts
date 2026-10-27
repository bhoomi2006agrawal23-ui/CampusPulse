import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import healthRouter from './routes/health.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { generalApiLimiter } from './middleware/rateLimit.middleware.js';

export function createApp(): Express {
  const app = express();

  // Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed for SPA dev & Vite proxying
      crossOriginEmbedderPolicy: false,
    })
  );

  // Strict Credentialed CORS (Locked rule: Never use wildcard origin: '*' with credentials)
  const allowedOrigins = [
    config.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.APP_URL,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          /\.run\.app$/.test(origin) ||
          /\.aistudio\.google$/.test(origin) ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true, // Enables HttpOnly refresh token cookies
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request Body & Cookie Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // General Rate Limiting
  app.use('/api', generalApiLimiter);

  // Mount API Gateway
  app.use('/api', apiRouter);

  // Standalone Health Check
  app.use('/health', healthRouter);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
