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
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { uploadFile } from '../lib/cloudinary';

const updateCompanyNameSchema = z.object({
  name: z.string().min(1),
});

const createCompanySchema = z.object({
  name: z.string().min(1),
  memorandum: z
    .union([
      z.instanceof(File),
      z.null(),
      z.undefined(),
      z.string().transform((val) => (val === '' ? undefined : val)),
    ])
    .transform((val) => (val instanceof File ? val : null)),
  address: z.string().min(1),
});

const updateCompanyMemorandumSchema = z.object({
  memorandum: z.instanceof(File),
});

const updateCompanyAddressSchema = z.object({
  address: z.string().min(1),
});

const assignCompanyToOJTSchema = z.object({
  companyId: z.number().min(1),
  supervisorEmail: z.string().email().min(1),
  totalOJTHours: z.number().min(1),
  supervisorName: z.string().min(1),
  supervisorContactNumber: z.string().min(1),
  supervisorAddress: z.string().min(1),
});

export const companyRoutes = new Hono()
  .post(
    '/',
    requireRole(['admin', 'coordinator']),
    zValidator('form', createCompanySchema),
    async (c) => {
      try {
        const data = c.req.valid('form');

        let memorandumUrl = null;

        const file = data.memorandum;
        if (file) {
          const { url } = await uploadFile(file);
          memorandumUrl = url;
        }

        await db.insert(companies).values({
          name: data.name,
          address: data.address,
          memorandumUrl: memorandumUrl ?? null,
        });

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
          .set({
            name: data.name,
            address: data.address,
            memorandumUrl: data.memorandumUrl ?? null,
          })
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
      const totalStudentsExpr = sql<number>`
      COUNT(DISTINCT ${users.id})
    `;

      const results = await db
        .select({
          id: companies.id,
          name: companies.name,
          address: companies.address,
          memorandumUrl: companies.memorandumUrl,
          maleCount: maleCountExpr,
          femaleCount: femaleCountExpr,
          totalStudents: totalStudentsExpr,
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
  })
  .patch(
    '/:id/name',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateCompanyNameSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid company id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(companies)
          .set({ name: data.name })
          .where(eq(companies.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Company not found' }, 404);
        }

        return c.json({ message: 'Company name updated successfully' });
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/memorandum',
    requireRole(['admin', 'coordinator']),
    zValidator('form', updateCompanyMemorandumSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid company id provided' }, 400);
        }

        const data = c.req.valid('form');

        let memorandumUrl = null;

        const file = data.memorandum;
        if (file) {
          const { url } = await uploadFile(file);
          memorandumUrl = url;
        }

        const [result] = await db
          .update(companies)
          .set({ memorandumUrl: memorandumUrl ?? null })
          .where(eq(companies.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Company not found' }, 404);
        }

        return c.json({ message: 'Company memorandum updated successfully' });
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/address',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateCompanyAddressSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid company id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(companies)
          .set({ address: data.address })
          .where(eq(companies.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Company not found' }, 404);
        }

        return c.json({ message: 'Company address updated successfully' });
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )

  .post(
    '/assign',
    requireRole(['student']),
    zValidator('json', assignCompanyToOJTSchema),
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

        await db
          .update(ojtApplication)
          .set({
            companyId: data.companyId,
            supervisorEmail: data.supervisorEmail,
            totalOJTHours: data.totalOJTHours,
            supervisorName: data.supervisorName,
            supervisorContactNumber: data.supervisorContactNumber,
            supervisorAddress: data.supervisorAddress,
          })
          .where(eq(ojtApplication.id, ojt.id));

        return c.json({ message: 'Company assigned' });
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
