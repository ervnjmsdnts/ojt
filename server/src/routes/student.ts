import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { uploadFile } from '../lib/cloudinary';
import { db } from '../db';
import {
  classes,
  companies,
  departments,
  formTemplates,
  logs,
  ojtApplication,
  programs,
  studentSubmissions,
  users,
  reports,
} from '../db/schema';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

const createRequirementSchema = z.object({
  templateId: z.coerce.number().min(1),
  file: z.instanceof(File),
});

const updateOJTStatusSchema = z.object({
  status: z.enum(['pre-ojt', 'ojt', 'post-ojt', 'completed']),
});

const updateOJTSubmissionRemarkSchema = z.object({
  remark: z.string().min(1),
});

const updateOJTSubmissionStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'resubmit']),
});

const updateOJTClassSchema = z.object({
  classId: z.coerce.number().min(1),
});

const updatePersonalInfoSchema = z.object({
  fullName: z.string().min(1),
  gender: z.enum(['male', 'female']),
  yearLevel: z.string().min(1),
  semester: z.string().min(1),
  totalOJTHours: z.number().min(1),
  academicYear: z.string().min(1),
});

const updateSupervisorInfoSchema = z.object({
  supervisorName: z.string().min(1),
  supervisorEmail: z.string().email(),
  supervisorContactNumber: z.string().optional(),
  supervisorAddress: z.string().optional(),
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
          .select()
          .from(ojtApplication)
          .where(eq(ojtApplication.studentId, userId));

        if (!ojt) {
          return c.json({ message: 'OJT not found' }, 404);
        }

        const data = c.req.valid('form');

        const [template] = await db
          .select()
          .from(formTemplates)
          .where(eq(formTemplates.id, data.templateId));

        const { url } = await uploadFile(data.file);

        await db.transaction(async (tx) => {
          await tx.insert(studentSubmissions).values({
            ojtId: ojt.id,
            submittedFileUrl: url,
            templateId: data.templateId,
          });

          await tx.insert(logs).values({
            ojtId: ojt.id,
            text: `Submitted document on ${template.title}`,
          });
        });

        return c.json({ message: 'Student submission successful' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .get('/', requireRole(['admin']), async (c) => {
    try {
      const coordinatorAlias = alias(users, 'coordinator');
      const ojtApps = await db
        .select({
          id: ojtApplication.id,
          status: ojtApplication.status,
          studentId: ojtApplication.studentId,
          academicYear: ojtApplication.academicYear,
          coordinatorId: ojtApplication.coordinatorId,
          companyId: ojtApplication.companyId,
          totalOJTHours: ojtApplication.totalOJTHours,
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
        .leftJoin(
          coordinatorAlias,
          eq(ojtApplication.coordinatorId, coordinatorAlias.id),
        )
        .leftJoin(companies, eq(ojtApplication.companyId, companies.id))
        .leftJoin(classes, eq(ojtApplication.classId, classes.id))
        .leftJoin(programs, eq(classes.programId, programs.id))
        .leftJoin(departments, eq(classes.departmentId, departments.id))
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
          supervisorFeedbackResponseId:
            studentSubmissions.supervisorFeedbackResponseId,
          appraisalResponseId: studentSubmissions.appraisalResponseId,
          submissionRemark: studentSubmissions.remarks,
          submissionStatus: studentSubmissions.status,
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
              submittedFileUrl: s.submittedFileUrl,
              submissionDate: s.submissionDate,
              submissionRemark: s.submissionRemark,
              submissionStatus: s.submissionStatus,
              supervisorFeedbackResponseId: s.supervisorFeedbackResponseId,
              appraisalResponseId: s.appraisalResponseId,
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
  .patch(
    '/:id/status',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateOJTStatusSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid OJT id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(ojtApplication)
          .set({ status: data.status })
          .where(eq(ojtApplication.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'OJT not found' }, 404);
        }

        return c.json({ message: 'OJT status updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .get('/student-current', requireRole(['student']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const studentAlias = alias(users, 'student');
      const coordinatorAlias = alias(users, 'coordinator');

      const [ojt] = await db
        .select()
        .from(ojtApplication)
        .where(eq(ojtApplication.studentId, userId))
        .innerJoin(studentAlias, eq(ojtApplication.studentId, studentAlias.id))
        .leftJoin(
          coordinatorAlias,
          eq(ojtApplication.coordinatorId, coordinatorAlias.id),
        )
        .leftJoin(companies, eq(ojtApplication.companyId, companies.id))
        .leftJoin(classes, eq(ojtApplication.classId, classes.id))
        .leftJoin(programs, eq(classes.programId, programs.id))
        .leftJoin(departments, eq(classes.departmentId, departments.id));

      const templates = await db.select().from(formTemplates);

      const submissions = await db
        .select({
          submissionId: studentSubmissions.id,
          ojtId: studentSubmissions.ojtId,
          templateId: studentSubmissions.templateId,
          submittedFileUrl: studentSubmissions.submittedFileUrl,
          submissionDate: studentSubmissions.submissionDate,
          supervisorFeedbackResponseId:
            studentSubmissions.supervisorFeedbackResponseId,
          appraisalResponseId: studentSubmissions.appraisalResponseId,
          submissionRemark: studentSubmissions.remarks ?? null,
          submissionStatus: studentSubmissions.status,
        })
        .from(studentSubmissions)
        .where(eq(studentSubmissions.ojtId, ojt.ojt_application.id));

      const submissionsByTemplate: Record<number, (typeof submissions)[0][]> =
        {};
      for (const sub of submissions) {
        const arr = submissionsByTemplate[sub.templateId] ?? [];
        arr.push(sub);
        submissionsByTemplate[sub.templateId] = arr;
      }

      const templateList = templates.map((tpl) => {
        const subs = submissionsByTemplate[tpl.id] ?? [];
        return {
          template: {
            templateId: tpl.id,
            isEmailToSupervisor: tpl.isEmailToSupervisor,
            canStudentView: tpl.canStudentView,
            title: tpl.title,
            fileUrl: tpl.fileUrl,
            category: tpl.category,
            updatedAt: tpl.updatedAt,
          },
          submissions: subs.map((s) => ({
            submissionId: s.submissionId,
            submissionOJTId: s.ojtId,
            submittedFileUrl: s.submittedFileUrl,
            submissionDate: s.submissionDate,
            supervisorFeedbackResponseId: s.supervisorFeedbackResponseId,
            submissionRemark: s.submissionRemark,
            submissionStatus: s.submissionStatus,
            appraisalResponseId: s.appraisalResponseId,
          })),
        };
      });

      const groupedByCategory: Record<
        'pre-ojt' | 'ojt' | 'post-ojt',
        typeof templateList
      > = {
        'pre-ojt': [],
        ojt: [],
        'post-ojt': [],
      };
      for (const t of templateList) {
        const category = t.template.category;
        if (!groupedByCategory[category]) {
          groupedByCategory[category] = [];
        }
        groupedByCategory[category].push(t);
      }

      const { password: studentPassword, ...student } = ojt.student;

      return c.json({
        coordinatorId: ojt.ojt_application.coordinatorId,
        coordinator: ojt.coordinator ?? null,
        companyId: ojt.ojt_application.companyId,
        ojtStatus: ojt.ojt_application.status,
        supervisorEmail: ojt.ojt_application.supervisorEmail,
        supervisorName: ojt.ojt_application.supervisorName,
        supervisorContactNumber: ojt.ojt_application.supervisorContactNumber,
        totalOJTHours: ojt.ojt_application.totalOJTHours,
        yearLevel: ojt.ojt_application.yearLevel,
        semester: ojt.ojt_application.semester,
        supervisorAddress: ojt.ojt_application.supervisorAddress,
        studentCoordinatorRequestId:
          ojt.ojt_application.studentCoordinatorRequestId,
        student,
        class: ojt.classes,
        program: ojt.programs,
        department: ojt.departments,
        company: ojt.companies,
        academicYear: ojt.ojt_application.academicYear ?? null,
        ...groupedByCategory,
      });
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get('/:id', requireRole(['admin', 'coordinator']), async (c) => {
    try {
      const idParam = c.req.param('id');
      const id = Number(idParam);
      if (isNaN(id)) {
        return c.json({ message: 'Invalid OJT application id' }, 400);
      }

      const studentAlias = alias(users, 'student');

      const [ojt] = await db
        .select()
        .from(ojtApplication)
        .where(eq(ojtApplication.id, id))
        .innerJoin(studentAlias, eq(ojtApplication.studentId, studentAlias.id))
        .leftJoin(classes, eq(ojtApplication.classId, classes.id));

      const templates = await db.select().from(formTemplates);

      const submissions = await db
        .select({
          submissionId: studentSubmissions.id,
          ojtId: studentSubmissions.ojtId,
          templateId: studentSubmissions.templateId,
          submittedFileUrl: studentSubmissions.submittedFileUrl,
          submissionDate: studentSubmissions.submissionDate,
          supervisorFeedbackResponseId:
            studentSubmissions.supervisorFeedbackResponseId,
          appraisalResponseId: studentSubmissions.appraisalResponseId,
          submissionRemark: studentSubmissions.remarks ?? null,
          submissionStatus: studentSubmissions.status,
        })
        .from(studentSubmissions)
        .where(eq(studentSubmissions.ojtId, id));

      const submissionsByTemplate: Record<number, (typeof submissions)[0][]> =
        {};
      for (const sub of submissions) {
        const arr = submissionsByTemplate[sub.templateId] ?? [];
        arr.push(sub);
        submissionsByTemplate[sub.templateId] = arr;
      }

      const templateList = templates.map((tpl) => {
        const subs = submissionsByTemplate[tpl.id] ?? [];
        return {
          template: {
            templateId: tpl.id,
            title: tpl.title,
            fileUrl: tpl.fileUrl,
            category: tpl.category,
            updatedAt: tpl.updatedAt,
          },
          submissions: subs.map((s) => ({
            submissionId: s.submissionId,
            submissionOJTId: s.ojtId,
            submittedFileUrl: s.submittedFileUrl,
            submissionDate: s.submissionDate,
            submissionRemark: s.submissionRemark,
            submissionStatus: s.submissionStatus,
            supervisorFeedbackResponseId: s.supervisorFeedbackResponseId,
            appraisalResponseId: s.appraisalResponseId,
          })),
        };
      });

      const groupedByCategory: Record<
        'pre-ojt' | 'ojt' | 'post-ojt',
        typeof templateList
      > = {
        'pre-ojt': [],
        ojt: [],
        'post-ojt': [],
      };
      for (const t of templateList) {
        const category = t.template.category;
        if (!groupedByCategory[category]) {
          groupedByCategory[category] = [];
        }
        groupedByCategory[category].push(t);
      }

      const payload = {
        studentName: ojt.student.fullName,
        className: ojt?.classes?.name,
        ...groupedByCategory,
      };

      return c.json(payload);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .patch(
    '/submission/:id/remark',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateOJTSubmissionRemarkSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid submission id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(studentSubmissions)
          .set({ remarks: data.remark })
          .where(eq(studentSubmissions.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Submission not found' }, 404);
        }

        return c.json({ message: 'Submission remark updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/submission/:id/status',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateOJTSubmissionStatusSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid submission id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(studentSubmissions)
          .set({ status: data.status })
          .where(eq(studentSubmissions.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Submission not found' }, 404);
        }

        return c.json({ message: 'Submission status updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/class',
    requireRole(['coordinator', 'admin']),
    zValidator('json', updateOJTClassSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid OJT id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(ojtApplication)
          .set({ classId: data.classId })
          .where(eq(ojtApplication.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'OJT not found' }, 404);
        }

        return c.json({ message: 'Student OJT class updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/personal-info',
    requireRole(['student']),
    zValidator('json', updatePersonalInfoSchema),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('json');

        const userData = {
          fullName: data.fullName,
          gender: data.gender,
        };

        const ojtData = {
          yearLevel: data.yearLevel,
          semester: data.semester,
          totalOJTHours: data.totalOJTHours,
          academicYear: data.academicYear,
        };

        await db.transaction(async (tx) => {
          await tx.update(users).set(userData).where(eq(users.id, userId));

          await tx
            .update(ojtApplication)
            .set(ojtData)
            .where(eq(ojtApplication.studentId, userId));
        });

        return c.json({ message: 'Personal info updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/supervisor-info',
    requireRole(['student']),
    zValidator('json', updateSupervisorInfoSchema),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('json');

        await db
          .update(ojtApplication)
          .set(data)
          .where(eq(ojtApplication.studentId, userId));

        return c.json({ message: 'Supervisor info updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
