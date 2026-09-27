import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { securityHeaders } from './middleware/security-headers.js';
import authRoutes from './routes/auth-routes.js';
import dashboardRoutes from './routes/dashboard-routes.js';
import dictionariesRoutes from './routes/dictionaries-routes.js';
import helpRequestRoutes from './routes/help-request-routes.js';
import iterationsRoutes from './routes/iterations-routes.js';
import milestonesRoutes from './routes/milestones-routes.js';
import notificationRoutes from './routes/notification-routes.js';
import projectsRoutes from './routes/projects-routes.js';
import publicRoutes from './routes/public-routes.js';
import realtimeRoutes from './routes/realtime-routes.js';
import searchRoutes from './routes/search-routes.js';
import tasksRoutes from './routes/tasks-routes.js';
import usersRoutes from './routes/users-routes.js';
import adminDictionariesRoutes from './routes/admin-dictionaries-routes.js';
import { success } from './utils/response.js';

const app = express();

// 由 TRUST_PROXY 决定信任几层代理，默认不信任，避免客户端伪造 X-Forwarded-For
app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: env.uploadMaxBytes + 512 * 1024 }));

app.get('/api/health', (_req, res) => {
  res.json(success({ status: 'ok' }));
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/help-requests', authMiddleware, helpRequestRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);
app.use('/api/iterations', authMiddleware, iterationsRoutes);
app.use('/api/milestones', authMiddleware, milestonesRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/dictionaries', authMiddleware, dictionariesRoutes);
app.use('/api/admin/dictionaries', authMiddleware, adminDictionariesRoutes);
app.use('/api/realtime', authMiddleware, realtimeRoutes);
app.use('/api/search', authMiddleware, searchRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
