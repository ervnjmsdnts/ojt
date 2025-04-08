import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import {
  classes,
  companies,
  links,
  logs,
  notifications,
  ojtApplication,
  users,
} from '../db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dashboardRoutes = new Hono()
  .get('/admin', requireRole(['admin']), async (c) => {
    try {
      const preOJTCountExpr = sql<number>`SUM(CASE WHEN ${ojtApplication.status} = 'pre-ojt' THEN 1 ELSE 0 END)`;
      const ojtCountExpr = sql<number>`SUM(CASE WHEN ${ojtApplication.status} = 'ojt' THEN 1 ELSE 0 END)`;
      const postOJTCountExpr = sql<number>`SUM(CASE WHEN ${ojtApplication.status} = 'post-ojt' THEN 1 ELSE 0 END)`;

      const [ojts] = await db
        .select({
          preOJTCount: preOJTCountExpr,
          ojtCount: ojtCountExpr,
          postOJTCount: postOJTCountExpr,
        })
        .from(ojtApplication);

      const globalNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.isGlobal, true))
        .orderBy(desc(notifications.createdAt));

      const logDb = await db
        .select()
        .from(logs)
        .innerJoin(ojtApplication, eq(logs.ojtId, ojtApplication.id))
        .innerJoin(users, eq(ojtApplication.studentId, users.id))
        .leftJoin(classes, eq(ojtApplication.classId, classes.id))
        .orderBy(desc(logs.createdAt));

      const result = {
        ojts,
        logs: logDb,
        links: [],
        notifications: globalNotifications,
      };

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get('/coordinator', requireRole(['coordinator']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const preOJTCountExpr = sql<number>`SUM(CASE WHEN ${ojtApplication.status} = 'pre-ojt' THEN 1 ELSE 0 END)`;
      const ojtCountExpr = sql<number>`SUM(CASE WHEN ${ojtApplication.status} = 'ojt' THEN 1 ELSE 0 END)`;
      const postOJTCountExpr = sql<number>`SUM(CASE WHEN ${ojtApplication.status} = 'post-ojt' THEN 1 ELSE 0 END)`;

      const [ojts] = await db
        .select({
          preOJTCount: preOJTCountExpr,
          ojtCount: ojtCountExpr,
          postOJTCount: postOJTCountExpr,
        })
        .from(ojtApplication)
        .where(eq(ojtApplication.coordinatorId, userId));

      const logDb = await db
        .select()
        .from(logs)
        .innerJoin(ojtApplication, eq(logs.ojtId, ojtApplication.id))
        .innerJoin(users, eq(ojtApplication.studentId, users.id))
        .leftJoin(classes, eq(ojtApplication.classId, classes.id))
        .orderBy(desc(logs.createdAt));

      const filteredLogs = logDb.filter(
        (log) => log.ojt_application.coordinatorId === userId,
      );

      const globalNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.isGlobal, true))
        .orderBy(desc(notifications.createdAt));

      const linksDb = await db
        .select()
        .from(links)
        .where(eq(links.coordinatorId, userId));

      const result = {
        ojts,
        logs: filteredLogs,
        links: linksDb,
        notifications: globalNotifications,
      };

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get('/student', requireRole(['student']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const [userOjt] = await db
        .select()
        .from(ojtApplication)
        .where(eq(ojtApplication.studentId, userId));

      const globalNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.isGlobal, true))
        .orderBy(desc(notifications.createdAt));

      const linksDb = userOjt.coordinatorId
        ? await db
            .select()
            .from(links)
            .where(eq(links.coordinatorId, userOjt.coordinatorId))
        : [];

      const result = {
        links: linksDb,
        notifications: globalNotifications,
      };

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
