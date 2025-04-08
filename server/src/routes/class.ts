import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import {
  classes,
  departments,
  insertClassSchema,
  programs,
} from '../db/schema';

const updateClassNameSchema = z.object({
  name: z.string().min(1),
});
const updateClassProgramSchema = z.object({
  programId: z.number().min(1),
});
const updateClassDepartmentSchema = z.object({
  departmentId: z.number().min(1),
});

export const classRoutes = new Hono()
  .get('/', async (c) => {
    try {
      const results = await db
        .select({
          id: classes.id,
          name: classes.name,
          program: {
            id: programs.id,
            name: programs.name,
          },
          department: {
            id: departments.id,
            name: departments.name,
          },
        })
        .from(classes)
        .innerJoin(programs, eq(programs.id, classes.programId))
        .innerJoin(departments, eq(departments.id, classes.departmentId));

      return c.json(results);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'something went wrong' }, 500);
    }
  })
  .post(
    '/',
    requireRole(['coordinator', 'admin']),
    zValidator('json', insertClassSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        await db.insert(classes).values(data);

        return c.json({ message: 'Created class' }, 201);
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/name',
    requireRole(['coordinator', 'admin']),
    zValidator('json', updateClassNameSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid class id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(classes)
          .set({ name: data.name })
          .where(eq(classes.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Class not found' }, 404);
        }

        return c.json({ message: 'Class name updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/program',
    requireRole(['coordinator', 'admin']),
    zValidator('json', updateClassProgramSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid class id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(classes)
          .set({ programId: data.programId })
          .where(eq(classes.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Class not found' }, 404);
        }

        return c.json({ message: 'Class program updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/department',
    requireRole(['coordinator', 'admin']),
    zValidator('json', updateClassDepartmentSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid class id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(classes)
          .set({ departmentId: data.departmentId })
          .where(eq(classes.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Class not found' }, 404);
        }

        return c.json({ message: 'Class department updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 500);
      }
    },
  );
