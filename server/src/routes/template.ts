import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { zValidator } from '@hono/zod-validator';
import { formTemplates, users } from '../db/schema';
import { uploadFile } from '../lib/cloudinary';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createTemplateSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['pre-ojt', 'ojt', 'post-ojt']),
  canStudentView: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val)),
  isEmailToSupervisor: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => (typeof val === 'string' ? val === 'true' : val)),
  file: z
    .union([
      z.instanceof(File),
      z.null(),
      z.undefined(),
      z.string().transform((val) => (val === '' ? undefined : val)),
    ])
    .transform((val) => (val instanceof File ? val : null)),
});

const updateCategorySchema = z.object({
  category: z.enum(['pre-ojt', 'ojt', 'post-ojt']),
});

const updateTitleSchema = z.object({
  title: z.string().min(1),
});

export const templateRoutes = new Hono()
  .post(
    '/',
    requireRole(['coordinator', 'admin']),
    zValidator('form', createTemplateSchema),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('form');

        let file = null;

        if (data.file) {
          const { url } = await uploadFile(data.file);
          file = url;
        }

        await db.insert(formTemplates).values({
          title: data.title,
          category: data.category,
          fileUrl: file,
          uploadedBy: userId,
          canStudentView: data.canStudentView,
          isEmailToSupervisor: data.isEmailToSupervisor,
        });

        return c.json({ message: 'Template created' }, 201);
      } catch (error) {
        console.log(error);
        return c.json({ message: 'something went wrong' }, 400);
      }
    },
  )
  .get('/', async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const result = await db
        .select({
          id: formTemplates.id,
          title: formTemplates.title,
          category: formTemplates.category,
          fileUrl: formTemplates.fileUrl,
          uploadedBy: {
            id: users.id,
            fullName: users.fullName,
          },
          updatedAt: formTemplates.updatedAt,
        })
        .from(formTemplates)
        .leftJoin(users, eq(formTemplates.uploadedBy, users.id));

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'something went wrong' }, 500);
    }
  })
  .patch('/:id/file', requireRole(['coordinator', 'admin']), async (c) => {
    try {
      const idParam = c.req.param('id');
      const id = Number(idParam);

      if (isNaN(id)) {
        return c.json({ message: 'Invalid user id provided' }, 400);
      }

      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const form = await c.req.formData();
      const file = form.get('file') as File;

      const { url } = await uploadFile(file);

      await db
        .update(formTemplates)
        .set({ fileUrl: url, uploadedBy: userId })
        .where(eq(formTemplates.id, id));

      return c.json({ message: 'File updated successfully' }, 200);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'something went wrong' }, 500);
    }
  })
  .patch(
    '/:id/category',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateCategorySchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid user id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(formTemplates)
          .set({ category: data.category })
          .where(eq(formTemplates.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Template not found' }, 404);
        }

        return c.json({ message: 'Template category updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/title',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateTitleSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid user id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(formTemplates)
          .set({ title: data.title })
          .where(eq(formTemplates.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Template not found' }, 404);
        }

        return c.json({ message: 'Template title updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
