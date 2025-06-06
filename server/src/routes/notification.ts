import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import { notificationRecipients, notifications, users } from '../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const createGlobalNotificationSchema = z.object({ message: z.string().min(1) });
const createStudentNotificationSchema = z.object({
  message: z.string().min(1),
  targetStudentIds: z.array(z.number().min(1)).min(1),
});

export const notificationRoutes = new Hono()
  .post(
    '/global',
    requireRole(['admin', 'coordinator']),
    zValidator('json', createGlobalNotificationSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        await db.transaction(async (tx) => {
          const [result] = await tx.insert(notifications).values({
            message: data.message,
            isGlobal: true,
            targetStudentId: null,
          });

          const [globalNotification] = await tx
            .select()
            .from(notifications)
            .where(eq(notifications.id, result.insertId));

          if (!globalNotification) {
            console.log('Failed to create notification');
            throw new Error('Failed to create notification');
          }

          const students = await tx
            .select({ id: users.id })
            .from(users)
            .where(eq(users.role, 'student'));

          const joinRecords = students.map((student) => ({
            notificationId: globalNotification.id,
            studentId: student.id,
          }));

          await tx.insert(notificationRecipients).values(joinRecords);
        });

        return c.json(
          {
            message:
              'Global notification created and pre-populated for all students.',
          },
          201,
        );
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .post(
    '/student',
    requireRole(['admin', 'coordinator']),
    zValidator('json', createStudentNotificationSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        await db.transaction(async (tx) => {
          const [result] = await tx.insert(notifications).values({
            message: data.message,
            isGlobal: false,
            targetStudentId: null,
          });

          const [notification] = await tx
            .select()
            .from(notifications)
            .where(eq(notifications.id, result.insertId));

          if (!notification) {
            console.log('Failed to create notification');
            throw new Error('Failed to create notification');
          }

          // Create notification recipients for each student
          const recipientRecords = data.targetStudentIds.map((studentId) => ({
            notificationId: notification.id,
            studentId: studentId,
          }));

          await tx.insert(notificationRecipients).values(recipientRecords);
        });

        return c.json(
          { message: 'Student-specific notifications created.' },
          201,
        );
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .get('/', async (c) => {
    try {
      const studentId = c.get('userId');
      if (!studentId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const notificationsData = await db
        .select()
        .from(notifications)
        .where(
          sql`${notifications.isGlobal} = ${true} OR ${
            notifications.targetStudentId
          } = ${studentId}`,
        )
        .orderBy(desc(notifications.createdAt));

      const results = await Promise.all(
        notificationsData.map(async (notif) => {
          const [recipient] = await db
            .select({ read: notificationRecipients.read })
            .from(notificationRecipients)
            .where(
              sql`${notificationRecipients.notificationId} = ${notif.id} AND ${notificationRecipients.studentId} = ${studentId}`,
            );
          return {
            ...notif,
            read: recipient ? recipient.read : false,
          };
        }),
      );

      return c.json(results);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
