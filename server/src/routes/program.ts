import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import { insertProgramSchema, programs } from '../db/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const updateProgramNameSchema = z.object({
  name: z.string().min(1),
});

export const programRoutes = new Hono()
  .get('/', async (c) => {
    try {
      const results = await db.select().from(programs);

      return c.json(results);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'something went wrong' }, 500);
    }
  })
  .post(
    '/',
    requireRole(['coordinator', 'admin']),
    zValidator('json', insertProgramSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        await db.insert(programs).values(data);

        return c.json({ message: 'Created program' }, 201);
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/name',
    requireRole(['coordinator', 'admin']),
    zValidator('json', updateProgramNameSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid program id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(programs)
          .set({ name: data.name })
          .where(eq(programs.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Program not found' }, 404);
        }

        return c.json({ message: 'Program name updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  );
