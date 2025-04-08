import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { departments, insertDepartmentSchema } from '../db/schema';

const updateDepartmentNameSchema = z.object({
  name: z.string().min(1),
});

export const departmentRoutes = new Hono()
  .get('/', requireRole(['coordinator', 'admin']), async (c) => {
    try {
      const results = await db.select().from(departments);

      return c.json(results);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'something went wrong' }, 500);
    }
  })
  .post(
    '/',
    requireRole(['coordinator', 'admin']),
    zValidator('json', insertDepartmentSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        await db.insert(departments).values(data);

        return c.json({ message: 'Created department' }, 201);
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/name',
    requireRole(['coordinator', 'admin']),
    zValidator('json', updateDepartmentNameSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid department id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(departments)
          .set({ name: data.name })
          .where(eq(departments.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Department not found' }, 404);
        }

        return c.json({ message: 'Department name updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  );
