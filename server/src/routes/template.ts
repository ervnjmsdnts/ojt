import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { zValidator } from '@hono/zod-validator';
import { formTemplates, insertFormTemplateSchema } from '../db/schema';
import { uploadFile } from '../lib/cloudinary';
import { db } from '../db';

export const templateRoutes = new Hono();

const createFormTemplateSchema = insertFormTemplateSchema.omit({
  fileUrl: true,
  uploadedBy: true,
});

templateRoutes.post(
  '/',
  requireRole(['coordinator', 'admin']),
  zValidator('form', createFormTemplateSchema),
  async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const data = c.req.valid('form');

      const form = await c.req.formData();
      const file = form.get('file') as File;

      const { url } = await uploadFile(file);

      await db.insert(formTemplates).values({
        title: data.title,
        category: data.category,
        fileUrl: url,
        uploadedBy: userId,
      });

      return c.json({ message: 'Template created' }, 201);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'something went wrong' }, 400);
    }
  },
);

templateRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const result = await db.select().from(formTemplates);

    return c.json(result);
  } catch (error) {
    console.log(error);
    return c.json({ message: 'something went wrong' }, 500);
  }
});
