import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { zValidator } from '@hono/zod-validator';
import {
  companies,
  insertCompanySchema,
  ojtApplication,
  updateCompanySchema,
  users,
} from '../db/schema';
import { db } from '../db';
import { asc, desc, eq, sql } from 'drizzle-orm';

export const companyRoutes = new Hono()
  .post(
    '/',
    requireRole(['admin']),
    zValidator('json', insertCompanySchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        await db.insert(companies).values(data);

        return c.json({ message: 'Created company' }, 201);
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .put(
    '/:id',
    requireRole(['admin']),
    zValidator('json', updateCompanySchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        const idParam = c.req.param('id');
        const id = Number(idParam);
        if (isNaN(id)) {
          return c.json({ message: 'Invalid company id provided' }, 400);
        }

        const [result] = await db
          .update(companies)
          .set(data)
          .where(eq(companies.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Company not found' }, 404);
        }

        return c.json({ message: 'Company updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .get('/', requireRole(['admin', 'coordinator', 'student']), async (c) => {
    try {
      const maleCountExpr = sql<number>`SUM(CASE WHEN ${users.gender} = 'male' THEN 1 ELSE 0 END)`;
      const femaleCountExpr = sql<number>`SUM(CASE WHEN ${users.gender} = 'female' THEN 1 ELSE 0 END)`;

      const results = await db
        .select({
          id: companies.id,
          name: companies.name,
          maleCount: maleCountExpr,
          femaleCount: femaleCountExpr,
        })
        .from(companies)
        .leftJoin(ojtApplication, eq(ojtApplication.companyId, companies.id))
        .leftJoin(users, eq(users.id, ojtApplication.studentId))
        .groupBy(companies.id, companies.name)
        .orderBy(asc(companies.name));

      return c.json(results);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
