import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './backend/src/app.js';
import { connectDatabase } from './backend/src/config/db.js';
import { seedDevelopmentData } from './backend/src/services/seed.service.js';
import { config } from './backend/src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();

  // Connect Database (MongoDB Atlas)
  await connectDatabase();

  // Initialize Development Seed Dataset (Admin, Organizer, Judge, Volunteer, Student)
  await seedDevelopmentData();

  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[CampusPulse] Web application running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[CampusPulse] Fatal startup error:', err);
  process.exit(1);
});
