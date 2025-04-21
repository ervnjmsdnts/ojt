import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import {
  classes,
  links,
  logs,
  notificationRecipients,
  notifications,
  ojtApplication,
  users,
  studentSubmissions,
  formTemplates,
  reports,
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

      const notificationsData = await db
        .selectDistinct({
          id: notifications.id,
          message: notifications.message,
          isGlobal: notifications.isGlobal,
          createdAt: notifications.createdAt,
          updatedAt: notifications.updatedAt,
        })
        .from(notifications)
        .leftJoin(
          notificationRecipients,
          eq(notifications.id, notificationRecipients.notificationId),
        )
        .where(
          sql`${notifications.isGlobal} = true OR ${notificationRecipients.studentId} = ${userId}`,
        )
        .orderBy(desc(notifications.createdAt));

      const results = await Promise.all(
        notificationsData.map(async (notif) => {
          const [recipient] = await db
            .select({ read: notificationRecipients.read })
            .from(notificationRecipients)
            .where(
              sql`${notificationRecipients.notificationId} = ${notif.id} AND ${notificationRecipients.studentId} = ${userId}`,
            );
          return {
            ...notif,
            read: recipient ? recipient.read : false,
          };
        }),
      );

      const [userOjt] = await db
        .select()
        .from(ojtApplication)
        .where(eq(ojtApplication.studentId, userId));

      const linksDb = userOjt?.coordinatorId
        ? await db
            .select()
            .from(links)
            .where(eq(links.coordinatorId, userOjt.coordinatorId))
        : [];

      // Get total required forms for pre-ojt and post-ojt
      const [preOjtRequired] = await db
        .select({ count: sql<number>`count(*)` })
        .from(formTemplates)
        .where(eq(formTemplates.category, 'pre-ojt'));

      const [postOjtRequired] = await db
        .select({ count: sql<number>`count(*)` })
        .from(formTemplates)
        .where(eq(formTemplates.category, 'post-ojt'));

      // Get submission statistics
      const [preOjtSubmissions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentSubmissions)
        .innerJoin(
          formTemplates,
          eq(studentSubmissions.templateId, formTemplates.id),
        )
        .where(
          sql`${studentSubmissions.ojtId} = ${userOjt?.id} 
          AND ${formTemplates.category} = 'pre-ojt'
          AND ${studentSubmissions.status} = 'approved'`,
        );

      const [postOjtSubmissions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentSubmissions)
        .innerJoin(
          formTemplates,
          eq(studentSubmissions.templateId, formTemplates.id),
        )
        .where(
          sql`${studentSubmissions.ojtId} = ${userOjt?.id} 
          AND ${formTemplates.category} = 'post-ojt'
          AND ${studentSubmissions.status} = 'approved'`,
        );

      // Get total approved OJT hours from reports
      const [approvedHours] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${reports.numberOfWorkingHours}), 0)`,
        })
        .from(reports)
        .where(eq(reports.ojtId, userOjt?.id ?? 0));

      const result = {
        links: linksDb,
        notifications: results,
        stats: {
          preOjt: {
            approvedSubmissions: preOjtSubmissions?.count ?? 0,
            totalRequired: preOjtRequired?.count ?? 0,
          },
          ojt: {
            approvedHours: approvedHours?.total ?? 0,
            totalRequired: userOjt?.totalOJTHours ?? 0,
          },
          postOjt: {
            approvedSubmissions: postOjtSubmissions?.count ?? 0,
            totalRequired: postOjtRequired?.count ?? 0,
          },
        },
      };

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
