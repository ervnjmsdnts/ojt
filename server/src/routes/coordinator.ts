import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import {
  formTemplates,
  ojtApplication,
  studentSubmissions,
  users,
} from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

export const coordinatorRoutes = new Hono().get(
  '/ojt',
  requireRole(['coordinator']),
  async (c) => {
    try {
      const coordinatorId = c.get('userId');

      if (!coordinatorId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

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
        .innerJoin(users, eq(ojtApplication.studentId, users.id))
        .where(eq(ojtApplication.coordinatorId, coordinatorId));

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
        .where(inArray(studentSubmissions.ojtId, ojtAppIds));

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
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  },
);
