import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import { initRealtime } from './realtime/socket-server.js';
import { runSlaEscalations } from './services/help-request-service.js';

const SLA_CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function start() {
  await pool.query('SELECT 1');
  await runMigrations();
  await runSlaEscalations();
  setInterval(() => {
    runSlaEscalations().catch((error) => console.error('SLA escalation check failed:', error));
  }, SLA_CHECK_INTERVAL_MS).unref();
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
