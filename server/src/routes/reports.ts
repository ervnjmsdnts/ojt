import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db';
import { ojtApplication, reports } from '../db/schema';
import { eq } from 'drizzle-orm';

const createReportSchema = z.object({
  date: z.coerce.date(),
  workingHours: z.coerce.number().min(1),
  accomplishments: z.string().min(1),
});

export const reportRoutes = new Hono()
  .post(
    '/',
    requireRole(['student']),
    zValidator('json', createReportSchema),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const [ojt] = await db
          .select({ id: ojtApplication.id })
          .from(ojtApplication)
          .where(eq(ojtApplication.studentId, userId));

        if (!ojt) {
          return c.json({ message: 'OJT not found' }, 404);
        }

        const data = c.req.valid('json');

        await db.insert(reports).values({
          accomplishments: data.accomplishments,
          numberOfWorkingHours: data.workingHours,
          ojtId: ojt.id,
          date: new Date(data.date).getTime(),
        });

        return c.json({ message: 'Daily report created' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .get('/', requireRole(['student']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const [ojt] = await db
        .select({ id: ojtApplication.id })
        .from(ojtApplication)
        .where(eq(ojtApplication.studentId, userId));

      if (!ojt) {
        return c.json({ message: 'OJT not found' }, 404);
      }

      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.ojtId, ojt.id));

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
