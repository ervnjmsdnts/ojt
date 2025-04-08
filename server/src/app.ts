import { Hono } from 'hono';
import { createNodeWebSocket } from '@hono/node-ws';
import { logger } from 'hono/logger';
import { authRoute } from './routes/auth';
import { sessionMiddleware } from './middlewares/session';
import { templateRoutes } from './routes/template';
import { studentRoutes } from './routes/student';
import { coordinatorRoutes } from './routes/coordinator';
import { userRoutes } from './routes/user';
import { notificationRoutes } from './routes/notification';
import { companyRoutes } from './routes/company';
// import { chatRoutes } from './routes/chat';
import { formRoutes } from './routes/forms';
import { programRoutes } from './routes/program';
import { departmentRoutes } from './routes/department';
import { classRoutes } from './routes/class';
import { requestRoutes } from './routes/request';
import { reportRoutes } from './routes/reports';
import { linkRoutes } from './routes/links';
import { dashboardRoutes } from './routes/dashboard';

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.use('*', logger());
app.use('*', sessionMiddleware);

const apiRoutes = app
  .basePath('/api')
  .route('/auth', authRoute)
  .route('/template', templateRoutes)
  .route('/student', studentRoutes)
  .route('/coordinator', coordinatorRoutes)
  .route('/user', userRoutes)
  .route('/notification', notificationRoutes)
  .route('/company', companyRoutes)
  // .route('/chat', chatRoutes)
  .route('/forms', formRoutes)
  .route('/program', programRoutes)
  .route('/department', departmentRoutes)
  .route('/class', classRoutes)
  .route('/request', requestRoutes)
  .route('/reports', reportRoutes)
  .route('/links', linkRoutes)
  .route('/dashboards', dashboardRoutes);

export type ApiRoutes = typeof apiRoutes;
export const injectWS = injectWebSocket;
export const upgradeWS = upgradeWebSocket;
export default app;
