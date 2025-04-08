import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import { links, ojtApplication } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const createLinkSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1),
});

export const linkRoutes = new Hono().post(
  '/',
  requireRole(['coordinator']),
  zValidator('json', createLinkSchema),
  async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const data = c.req.valid('json');

      await db.insert(links).values({ coordinatorId: userId, ...data });

      return c.json({ message: 'Added link' });
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  },
);
