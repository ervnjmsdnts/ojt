import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { authRoute } from './routes/auth';
import { sessionMiddleware } from './middlewares/session';
import { templateRoutes } from './routes/template';
import { studentRoutes } from './routes/student';
import { coordinatorRoutes } from './routes/coordinator';
import { userRoutes } from './routes/user';
import { notificationRoutes } from './routes/notification';

const app = new Hono();

app.use('*', logger());
app.use('*', sessionMiddleware);

const apiRoutes = app.basePath('/api');
apiRoutes.route('/auth', authRoute);
apiRoutes.route('/template', templateRoutes);
apiRoutes.route('/student', studentRoutes);
apiRoutes.route('/coordinator', coordinatorRoutes);
apiRoutes.route('/user', userRoutes);
apiRoutes.route('/notification', notificationRoutes);

export default app;
export type ApiRoutes = typeof apiRoutes;
