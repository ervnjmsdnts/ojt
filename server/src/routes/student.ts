import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { uploadFile } from '../lib/cloudinary';
import { db } from '../db';
import {
  formTemplates,
  ojtApplication,
  studentSubmissions,
  users,
} from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const createRequirementSchema = z.object({
  templateId: z.number().min(1),
});

export const studentRoutes = new Hono()
  .post(
    '/submission',
    requireRole(['student']),
    zValidator('form', createRequirementSchema),
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

        const data = c.req.valid('form');

        const form = await c.req.formData();
        const file = form.get('file') as File;

        const { url } = await uploadFile(file);

        await db.insert(studentSubmissions).values({
          ojtId: ojt.id,
          submittedFileUrl: url,
          templateId: data.templateId,
        });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .get('/', requireRole(['admin']), async (c) => {
    try {
      const ojtApps = await db
        .select({
          id: ojtApplication.id,
          status: ojtApplication.status,
          studentId: ojtApplication.studentId,
          coordinatorId: ojtApplication.coordinatorId,
          student: {
            id: users.id,
            fullName: users.fullName,
            srCode: users.srCode,
            role: users.role,
            gender: users.gender,
          },
        })
        .from(ojtApplication)
        .innerJoin(users, eq(ojtApplication.studentId, users.id));

      if (!ojtApps.length) {
        return c.json([]);
      }

      const ojtAppIds = ojtApps.map((app) => app.id);
      const submissions = await db
        .select({
          submissionId: studentSubmissions.id,
          ojtId: studentSubmissions.ojtId,
          submittedFileUrl: studentSubmissions.submittedFileUrl,
          submissionDate: studentSubmissions.submissionDate,
          template: {
            templateId: formTemplates.id,
            title: formTemplates.title,
            fileUrl: formTemplates.fileUrl,
            categoryId: formTemplates.category,
            uploadedAt: formTemplates.updatedAt,
          },
        })
        .from(studentSubmissions)
        .innerJoin(
          formTemplates,
          eq(studentSubmissions.templateId, formTemplates.id),
        )
        .where(sql`${studentSubmissions.ojtId} IN (${ojtAppIds.join(',')})`);

      const submissionsByOjt: Record<number, typeof submissions> = {};
      for (const sub of submissions) {
        if (!submissionsByOjt[sub.ojtId]) {
          submissionsByOjt[sub.ojtId] = [];
        }
        submissionsByOjt[sub.ojtId].push(sub);
      }

      const result = ojtApps.map((app) => ({
        ...app,
        submissions: submissionsByOjt[app.id] || [],
      }));

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
