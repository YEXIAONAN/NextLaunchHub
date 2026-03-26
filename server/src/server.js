import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { initRealtime } from './realtime/socket-server.js';

async function start() {
  await pool.query('SELECT 1');
  const httpServer = createServer(app);
  initRealtime(httpServer);
  httpServer.listen(env.port, () => {
    console.log(`NextLaunch Hub server running at http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
