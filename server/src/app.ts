import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { authRoute } from './routes/auth';
import { sessionMiddleware } from './middlewares/session';
import { templateRoutes } from './routes/template';
import { studentRoutes } from './routes/student';
import { coordinatorRoutes } from './routes/coordinator';
import { userRoutes } from './routes/user';
import { notificationRoutes } from './routes/notification';
import { companyRoutes } from './routes/company';

const app = new Hono();
const test = new Hono().get('/', (c) => c.json({ message: 'test' }));

app.use('*', logger());
app.use('*', sessionMiddleware);

const apiRoutes = app
  .basePath('/api')
  .route('/test', test)
  .route('/auth', authRoute)
  .route('/template', templateRoutes)
  .route('/student', studentRoutes)
  .route('/coordinator', coordinatorRoutes)
  .route('/user', userRoutes)
  .route('/notification', notificationRoutes)
  .route('/company', companyRoutes);

export type ApiRoutes = typeof apiRoutes;
export default app;
