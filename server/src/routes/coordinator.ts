import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import {
  classes,
  companies,
  departments,
  formTemplates,
  ojtApplication,
  programs,
  reports,
  studentSubmissions,
  users,
} from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

export const coordinatorRoutes = new Hono()
  .get('/ojt', requireRole(['coordinator']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const coordinatorAlias = alias(users, 'coordinator');
      const ojtApps = await db
        .select({
          id: ojtApplication.id,
          status: ojtApplication.status,
          studentId: ojtApplication.studentId,
          coordinatorId: ojtApplication.coordinatorId,
          totalOJTHours: ojtApplication.totalOJTHours,
          companyId: ojtApplication.companyId,
          classId: ojtApplication.classId,
          program: {
            id: programs.id,
            name: programs.name,
          },
          department: {
            id: departments.id,
            name: departments.name,
          },
          class: {
            id: classes.id,
            name: classes.name,
          },
          student: {
            id: users.id,
            fullName: users.fullName,
            srCode: users.srCode,
            role: users.role,
            gender: users.gender,
          },
          coordinator: {
            id: coordinatorAlias.id,
            fullName: coordinatorAlias.fullName,
            srCode: coordinatorAlias.srCode,
            role: coordinatorAlias.role,
            gender: coordinatorAlias.gender,
          },
          company: {
            id: companies.id,
            name: companies.name,
          },
          approvedHours: sql<number>`COALESCE((
            SELECT SUM(${reports.numberOfWorkingHours})
            FROM ${reports}
            WHERE ${reports.ojtId} = ${ojtApplication.id}
          ), 0)`,
        })
        .from(ojtApplication)
        .innerJoin(users, eq(ojtApplication.studentId, users.id))
        .leftJoin(companies, eq(ojtApplication.companyId, companies.id))
        .leftJoin(classes, eq(ojtApplication.classId, classes.id))
        .leftJoin(
          coordinatorAlias,
          eq(ojtApplication.coordinatorId, coordinatorAlias.id),
        )
        .leftJoin(programs, eq(classes.programId, programs.id))
        .leftJoin(departments, eq(classes.departmentId, departments.id))
        .where(eq(ojtApplication.coordinatorId, userId))
        .orderBy(sql`LOWER(${users.fullName})`);

      if (!ojtApps.length) {
        return c.json([]);
      }

      const templates = await db.select().from(formTemplates);

      const ojtAppIds = ojtApps.map((app) => app.id);

      const submissions = await db
        .select({
          submissionId: studentSubmissions.id,
          ojtId: studentSubmissions.ojtId,
          submittedFileUrl: studentSubmissions.submittedFileUrl,
          submissionDate: studentSubmissions.submissionDate,
          submissionRemark: studentSubmissions.remarks,
          submissionStatus: studentSubmissions.status,
          supervisorFeedbackResponseId:
            studentSubmissions.supervisorFeedbackResponseId,
          templateId: formTemplates.id,
          templateTitle: formTemplates.title,
          templateFileUrl: formTemplates.fileUrl,
          templateCategory: formTemplates.category,
          templateUploadedAt: formTemplates.updatedAt,
        })
        .from(studentSubmissions)
        .innerJoin(
          formTemplates,
          eq(studentSubmissions.templateId, formTemplates.id),
        )
        .where(inArray(studentSubmissions.ojtId, ojtAppIds));

      const submissionsByOjtAndTemplate: Record<
        number,
        Record<number, (typeof submissions)[0][]>
      > = {};

      for (const sub of submissions) {
        if (!submissionsByOjtAndTemplate[sub.ojtId]) {
          submissionsByOjtAndTemplate[sub.ojtId] = {};
        }

        const arr =
          submissionsByOjtAndTemplate[sub.ojtId][sub.templateId] || [];
        arr.push(sub);

        submissionsByOjtAndTemplate[sub.ojtId][sub.templateId] = arr;
      }

      const result = ojtApps.map((app) => {
        const templateList = templates.map((tpl) => {
          const maybeSubmission =
            submissionsByOjtAndTemplate[app.id]?.[tpl.id] ?? [];

          if (maybeSubmission.length > 0) {
            const submissionList = maybeSubmission.map((s) => ({
              submissionId: s.submissionId,
              supervisorFeedbackResponseId: s.supervisorFeedbackResponseId,
              submittedFileUrl: s.submittedFileUrl,
              submissionDate: s.submissionDate,
              submissionRemark: s.submissionRemark,
              submissionStatus: s.submissionStatus,
            }));
            return {
              templateId: tpl.id,
              title: tpl.title,
              fileUrl: tpl.fileUrl,
              category: tpl.category,
              uploadedAt: tpl.updatedAt,
              submission: submissionList,
            };
          } else {
            return {
              templateId: tpl.id,
              title: tpl.title,
              fileUrl: tpl.fileUrl,
              category: tpl.category,
              uploadedAt: tpl.updatedAt,
              submission: [],
            };
          }
        });

        return {
          ...app,
          templates: templateList,
        };
      });

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get('/', requireRole(['coordinator', 'admin', 'student']), async (c) => {
    try {
      const result = await db
        .select({ id: users.id, email: users.email, fullName: users.fullName })
        .from(users)
        .where(eq(users.role, 'coordinator'));

      return c.json(result);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
