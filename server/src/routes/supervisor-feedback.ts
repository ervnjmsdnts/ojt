import { Hono } from 'hono';
import { db } from '../db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  supervisorFeedbackTemplate,
  supervisorFeedbackQuestions,
  supervisorFeedbackResponse,
  supervisorFeedbackResponses,
  ojtApplication,
  supervisorFeedbackEmail,
  users,
  companies,
  classes,
  programs,
  departments,
  studentSubmissions,
  formTemplates,
} from '../db/schema';
import { z } from 'zod';
import { requireRole } from '../middlewares/role';
import { zValidator } from '@hono/zod-validator';
import { uploadFile } from '../lib/cloudinary';
import { generateAccessCode } from '../lib/utils';
import React from 'react';
import { resend } from '../lib/resend';
import { SupervisorFeedbackEmailTemplate } from '../emails/supervisor-feedback-email';

const updateFeedbackTemplateSchema = z.object({
  isActive: z.boolean().optional(),
});

const updateFeedbackQuestionsSchema = z.object({
  questions: z.array(z.string().min(1)),
});

const verifyAccessCodeSchema = z.object({
  code: z.string().min(1),
});

const createFeedbackTemplateSchema = z.object({
  studentSubmissionTemplateId: z.number().min(1),
});

export const supervisorFeedbackRoutes = new Hono()
  .post(
    '/',
    requireRole(['admin', 'coordinator']),
    zValidator('json', createFeedbackTemplateSchema),
    async (c) => {
      try {
        const userId = c.get('userId');
        const data = c.req.valid('json');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        await db.insert(supervisorFeedbackTemplate).values({
          studentSubmissionTemplateId: data.studentSubmissionTemplateId,
        });

        return c.json(
          { message: 'Feedback template created successfully' },
          201,
        );
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )

  // Get the active feedback template with questions
  .get('/', async (c) => {
    try {
      // Get the active template
      const [template] = await db
        .select({
          id: supervisorFeedbackTemplate.id,
          isActive: supervisorFeedbackTemplate.isActive,
          version: supervisorFeedbackTemplate.version,
          createdAt: supervisorFeedbackTemplate.createdAt,
          updatedAt: supervisorFeedbackTemplate.updatedAt,
        })
        .from(supervisorFeedbackTemplate)
        .where(eq(supervisorFeedbackTemplate.isActive, true))
        .orderBy(desc(supervisorFeedbackTemplate.createdAt))
        .limit(1);

      if (!template) {
        return c.json(null);
      }

      // Get questions for the template
      const questions = await db
        .select({
          id: supervisorFeedbackQuestions.id,
          question: supervisorFeedbackQuestions.question,
          createdAt: supervisorFeedbackQuestions.createdAt,
        })
        .from(supervisorFeedbackQuestions)
        .where(eq(supervisorFeedbackQuestions.templateId, template.id));

      return c.json({
        ...template,
        questions,
      });
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })

  // Get a specific template with its questions
  .get('/:id', async (c) => {
    try {
      const idParam = c.req.param('id');
      const id = Number(idParam);

      if (isNaN(id)) {
        return c.json({ message: 'Invalid template id' }, 400);
      }

      // Get the template
      const [template] = await db
        .select({
          id: supervisorFeedbackTemplate.id,
          isActive: supervisorFeedbackTemplate.isActive,
          version: supervisorFeedbackTemplate.version,
          createdAt: supervisorFeedbackTemplate.createdAt,
          updatedAt: supervisorFeedbackTemplate.updatedAt,
        })
        .from(supervisorFeedbackTemplate)
        .where(eq(supervisorFeedbackTemplate.id, id));

      if (!template) {
        return c.json({ message: 'Template not found' }, 404);
      }

      // Get the questions
      const questions = await db
        .select({
          id: supervisorFeedbackQuestions.id,
          question: supervisorFeedbackQuestions.question,
          createdAt: supervisorFeedbackQuestions.createdAt,
        })
        .from(supervisorFeedbackQuestions)
        .where(eq(supervisorFeedbackQuestions.templateId, id));

      return c.json({
        ...template,
        questions,
      });
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })

  // Update template info (not questions)
  .patch(
    '/:id',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateFeedbackTemplateSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid template id' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(supervisorFeedbackTemplate)
          .set(data)
          .where(eq(supervisorFeedbackTemplate.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'Template not found' }, 404);
        }

        return c.json({ message: 'Template updated successfully' });
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )

  // Update questions with version incrementation
  .patch(
    '/:id/questions',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updateFeedbackQuestionsSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid template id' }, 400);
        }

        const data = c.req.valid('json');

        await db.transaction(async (tx) => {
          // 1. Get the current template
          const [template] = await tx
            .select({
              id: supervisorFeedbackTemplate.id,
              version: supervisorFeedbackTemplate.version,
            })
            .from(supervisorFeedbackTemplate)
            .where(eq(supervisorFeedbackTemplate.id, id));

          if (!template) {
            throw new Error('Template not found');
          }

          // 2. Increment version
          await tx
            .update(supervisorFeedbackTemplate)
            .set({
              version: template.version + 1,
              updatedAt: sql`(UNIX_TIMESTAMP() * 1000)`,
            })
            .where(eq(supervisorFeedbackTemplate.id, id));

          // 3. Delete old questions
          await tx
            .delete(supervisorFeedbackQuestions)
            .where(eq(supervisorFeedbackQuestions.templateId, id));

          // 4. Insert new questions
          const questionsToInsert = data.questions.map((question) => ({
            templateId: id,
            question,
          }));

          await tx
            .insert(supervisorFeedbackQuestions)
            .values(questionsToInsert);
        });

        return c.json({
          message: 'Questions updated and version incremented successfully',
        });
      } catch (error: any) {
        console.error(error);
        if (error.message === 'Template not found') {
          return c.json({ message: 'Template not found' }, 404);
        }
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )

  // Submit a feedback response
  .post('/response', async (c) => {
    try {
      const formData = await c.req.formData();

      // Get the OJT application ID from the form data
      const ojtIdStr = formData.get('ojtId');
      if (!ojtIdStr) {
        return c.json({ message: 'OJT ID is required' }, 400);
      }

      const ojtId = Number(ojtIdStr);
      if (isNaN(ojtId)) {
        return c.json({ message: 'Invalid OJT ID' }, 400);
      }

      // Verify OJT exists
      const [ojt] = await db
        .select({ id: ojtApplication.id })
        .from(ojtApplication)
        .where(eq(ojtApplication.id, ojtId));

      if (!ojt) {
        return c.json({ message: 'OJT application not found' }, 404);
      }

      // Get the active template
      const [template] = await db
        .select({
          id: supervisorFeedbackTemplate.id,
          version: supervisorFeedbackTemplate.version,
          studentSubmissionTemplateId:
            supervisorFeedbackTemplate.studentSubmissionTemplateId,
        })
        .from(supervisorFeedbackTemplate)
        .where(eq(supervisorFeedbackTemplate.isActive, true));

      if (!template) {
        return c.json({ message: 'No active template found' }, 404);
      }

      const signature = formData.get('signature');
      if (!signature || !(signature instanceof File)) {
        return c.json({ message: 'Signature is required' }, 400);
      }

      const jsonData = formData.get('data');

      if (!jsonData) {
        return c.json({ message: 'Feedback data is required' }, 400);
      }

      try {
        const data = JSON.parse(jsonData.toString());

        if (!data.feedback || Object.keys(data.feedback).length === 0) {
          return c.json({ message: 'Feedback responses are required' }, 400);
        }

        const { url } = await uploadFile(signature);

        await db.transaction(async (tx) => {
          // First create supervisor feedback response
          const [responseResult] = await tx
            .insert(supervisorFeedbackResponse)
            .values({
              ojtId: ojt.id,
              templateId: template.id,
              templateVersion: template.version,
              otherCommentsAndSuggestions:
                data.otherCommentsAndSuggestions || null,
              signature: url,
            });

          const responseId = responseResult.insertId;

          // Then create student submission that references the feedback response
          await tx.insert(studentSubmissions).values({
            ojtId: ojt.id,
            templateId: template.studentSubmissionTemplateId,
            supervisorFeedbackResponseId: responseId,
          });

          // Insert the individual feedback responses
          const responsesToInsert = Object.entries(data.feedback).map(
            ([questionId, value]) => ({
              responseId,
              questionId: parseInt(questionId),
              responseValue: value as 'SA' | 'A' | 'N' | 'D' | 'SD',
            }),
          );

          await tx
            .insert(supervisorFeedbackResponses)
            .values(responsesToInsert);

          await tx
            .update(supervisorFeedbackEmail)
            .set({
              feedbackSubmitted: true,
            })
            .where(eq(supervisorFeedbackEmail.ojtId, ojt.id));
        });

        return c.json({ message: 'Feedback submitted successfully' }, 201);
      } catch (parseError: unknown) {
        console.error('Error parsing JSON data:', parseError);
        return c.json(
          {
            message: 'Invalid JSON data format',
            error:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          },
          400,
        );
      }
    } catch (error) {
      console.error('Error processing feedback submission:', error);
      return c.json(
        {
          message: 'Something went wrong',
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })

  .get(
    '/response/ojt/:ojtId',
    requireRole(['admin', 'coordinator']),
    async (c) => {
      try {
        const ojtIdParam = c.req.param('ojtId');
        const ojtId = Number(ojtIdParam);

        if (isNaN(ojtId)) {
          return c.json({ message: 'Invalid OJT ID' }, 400);
        }

        const [ojt] = await db
          .select({
            id: ojtApplication.id,
            studentName: users.fullName,
            companyName: companies.name,
            className: classes.name,
            programName: programs.name,
            departmentName: departments.name,
            supervisorName: ojtApplication.supervisorName,
          })
          .from(ojtApplication)
          .where(eq(ojtApplication.id, ojtId))
          .innerJoin(users, eq(ojtApplication.studentId, users.id))
          .leftJoin(companies, eq(ojtApplication.companyId, companies.id))
          .leftJoin(classes, eq(ojtApplication.classId, classes.id))
          .leftJoin(programs, eq(classes.programId, programs.id))
          .leftJoin(departments, eq(classes.departmentId, departments.id));

        if (!ojt) {
          return c.json({ message: 'OJT application not found' }, 404);
        }

        const responses = await db
          .select({
            id: supervisorFeedbackResponse.id,
            templateId: supervisorFeedbackResponse.templateId,
            templateVersion: supervisorFeedbackResponse.templateVersion,
            responseDate: supervisorFeedbackResponse.responseDate,
            otherCommentsAndSuggestions:
              supervisorFeedbackResponse.otherCommentsAndSuggestions,
            signature: supervisorFeedbackResponse.signature,
          })
          .from(supervisorFeedbackResponse)
          .where(eq(supervisorFeedbackResponse.ojtId, ojtId))
          .orderBy(sql`${supervisorFeedbackResponse.responseDate} DESC`);

        const detailedResponses = await Promise.all(
          responses.map(async (response) => {
            const [template] = await db
              .select({
                id: supervisorFeedbackTemplate.id,
                version: supervisorFeedbackTemplate.version,
              })
              .from(supervisorFeedbackTemplate)
              .where(eq(supervisorFeedbackTemplate.id, response.templateId));

            const questionResponses = await db
              .select({
                id: supervisorFeedbackResponses.id,
                questionId: supervisorFeedbackResponses.questionId,
                responseValue: supervisorFeedbackResponses.responseValue,
                questionText: supervisorFeedbackQuestions.question,
              })
              .from(supervisorFeedbackResponses)
              .leftJoin(
                supervisorFeedbackQuestions,
                eq(
                  supervisorFeedbackResponses.questionId,
                  supervisorFeedbackQuestions.id,
                ),
              )
              .where(eq(supervisorFeedbackResponses.responseId, response.id));

            return {
              ...response,
              template: template || null,
              questionResponses,
              ojt,
            };
          }),
        );

        return c.json(detailedResponses);
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .post('/verify', zValidator('json', verifyAccessCodeSchema), async (c) => {
    try {
      const data = c.req.valid('json');

      const [email] = await db
        .select({
          id: supervisorFeedbackEmail.id,
          feedbackSubmitted: supervisorFeedbackEmail.feedbackSubmitted,
          ojtId: supervisorFeedbackEmail.ojtId,
          email: supervisorFeedbackEmail.email,
          ojt: ojtApplication,
          company: companies,
          class: classes,
          program: programs,
          department: departments,
          student: users,
        })
        .from(supervisorFeedbackEmail)
        .where(eq(supervisorFeedbackEmail.accessCode, data.code))
        .innerJoin(
          ojtApplication,
          eq(ojtApplication.id, supervisorFeedbackEmail.ojtId),
        )
        .innerJoin(users, eq(ojtApplication.studentId, users.id))
        .leftJoin(companies, eq(ojtApplication.companyId, companies.id))
        .leftJoin(classes, eq(ojtApplication.classId, classes.id))
        .leftJoin(programs, eq(classes.programId, programs.id))
        .leftJoin(departments, eq(classes.departmentId, departments.id));

      if (!email) {
        return c.json({ valid: false, message: 'Invalid access code' }, 400);
      }

      // Get the template
      const [template] = await db
        .select({
          id: supervisorFeedbackTemplate.id,
          version: supervisorFeedbackTemplate.version,
        })
        .from(supervisorFeedbackTemplate)
        .where(eq(supervisorFeedbackTemplate.isActive, true));

      if (!template) {
        return c.json(
          { valid: false, message: 'No active template found' },
          404,
        );
      }

      return c.json({
        valid: true,
        ojtId: email.ojtId,
        ojt: email.ojt,
        studentName: email.student.fullName,
        supervisorName: email.ojt?.supervisorName,
        templateId: template.id,
        feedbackSubmitted: email.feedbackSubmitted,
        company: email.company,
        class: email.class,
        program: email.program,
        department: email.department,
      });
    } catch (error) {
      console.error(error);
      return c.json({ valid: false, message: 'Something went wrong' }, 500);
    }
  })
  .get('/email/check', requireRole(['student']), async (c) => {
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
        return c.json({ message: 'OJT application not found' }, 404);
      }

      const [email] = await db
        .select({ id: supervisorFeedbackEmail.id })
        .from(supervisorFeedbackEmail)
        .where(eq(supervisorFeedbackEmail.ojtId, ojt.id));

      if (email) {
        return c.json({ sent: true }, 200);
      }

      return c.json({ sent: false }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .post('/email', requireRole(['student']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const [ojt] = await db
        .select({
          id: ojtApplication.id,
          studentId: ojtApplication.studentId,
          supervisorEmail: ojtApplication.supervisorEmail,
          supervisorName: ojtApplication.supervisorName,
          companyId: ojtApplication.companyId,
        })
        .from(ojtApplication)
        .where(eq(ojtApplication.studentId, userId));

      if (!ojt) {
        return c.json({ message: 'OJT application not found' }, 404);
      }

      const [email] = await db
        .select({ id: supervisorFeedbackEmail.id })
        .from(supervisorFeedbackEmail)
        .where(eq(supervisorFeedbackEmail.ojtId, ojt.id));

      if (email) {
        return c.json({ message: 'Email already sent' }, 400);
      }

      const [student] = await db
        .select({
          fullName: users.fullName,
        })
        .from(users)
        .where(eq(users.id, ojt.studentId));

      if (!student) {
        return c.json({ message: 'Student not found' }, 404);
      }

      const [company] = await db
        .select({
          name: companies.name,
        })
        .from(companies)
        .where(eq(companies.id, ojt.companyId!));

      if (!company) {
        return c.json({ message: 'Company not found' }, 404);
      }

      if (!ojt.supervisorEmail) {
        return c.json({ message: 'Supervisor email not found' }, 400);
      }

      const accessCode = generateAccessCode();

      await db.insert(supervisorFeedbackEmail).values({
        ojtId: ojt.id,
        email: ojt.supervisorEmail!,
        accessCode: accessCode,
      });

      //LocaHost
      const feedbackUrl = `https://d71d-136-158-67-3.ngrok-free.app/feedback?code=${accessCode}`;

      const emailElement = React.createElement(
        SupervisorFeedbackEmailTemplate,
        {
          studentName: student.fullName,
          supervisorName: ojt.supervisorName!,
          companyName: company.name,
          accessCode: accessCode,
          feedbackUrl: feedbackUrl,
        },
      );

      await resend.emails.send({
        from: 'noreply@bsuojtportal.xyz',
        to: ojt.supervisorEmail!,
        subject: 'Supervisor Feedback Request - BSU OJT Portal',
        react: emailElement,
      });

      return c.json(
        { message: 'Feedback request email sent successfully' },
        200,
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get('/response/all', requireRole(['admin', 'coordinator']), async (c) => {
    try {
      // Extract query parameters
      const departmentIdStr = c.req.query('departmentId');
      const programIdStr = c.req.query('programId');

      const departmentId = departmentIdStr
        ? parseInt(departmentIdStr)
        : undefined;
      const programId = programIdStr ? parseInt(programIdStr) : undefined;

      // Build base query
      let query = db
        .select({
          id: supervisorFeedbackResponse.id,
          ojtId: supervisorFeedbackResponse.ojtId,
          templateId: supervisorFeedbackResponse.templateId,
          templateVersion: supervisorFeedbackResponse.templateVersion,
          responseDate: supervisorFeedbackResponse.responseDate,
          otherCommentsAndSuggestions:
            supervisorFeedbackResponse.otherCommentsAndSuggestions,
          signature: supervisorFeedbackResponse.signature,
        })
        .from(supervisorFeedbackResponse)
        .orderBy(sql`${supervisorFeedbackResponse.responseDate} DESC`);

      // Execute the query
      const responses = await query;

      const detailedResponses = await Promise.all(
        responses.map(async (response) => {
          const [template] = await db
            .select({
              id: supervisorFeedbackTemplate.id,
              version: supervisorFeedbackTemplate.version,
            })
            .from(supervisorFeedbackTemplate)
            .where(eq(supervisorFeedbackTemplate.id, response.templateId));

          const questionResponses = await db
            .select({
              id: supervisorFeedbackResponses.id,
              questionId: supervisorFeedbackResponses.questionId,
              responseValue: supervisorFeedbackResponses.responseValue,
              questionText: supervisorFeedbackQuestions.question,
            })
            .from(supervisorFeedbackResponses)
            .leftJoin(
              supervisorFeedbackQuestions,
              eq(
                supervisorFeedbackResponses.questionId,
                supervisorFeedbackQuestions.id,
              ),
            )
            .where(eq(supervisorFeedbackResponses.responseId, response.id));

          // Get student, company and department info
          const [ojtInfo] = await db
            .select({
              studentName: users.fullName,
              companyName: companies.name,
              departmentName: departments.name,
              programName: programs.name,
              supervisorName: ojtApplication.supervisorName,
              departmentId: departments.id,
              programId: programs.id,
            })
            .from(ojtApplication)
            .where(eq(ojtApplication.id, response.ojtId))
            .innerJoin(users, eq(ojtApplication.studentId, users.id))
            .leftJoin(companies, eq(ojtApplication.companyId, companies.id))
            .leftJoin(classes, eq(ojtApplication.classId, classes.id))
            .leftJoin(programs, eq(classes.programId, programs.id))
            .leftJoin(departments, eq(classes.departmentId, departments.id));

          return {
            ...response,
            template: template || null,
            questionResponses,
            student: ojtInfo
              ? {
                  name: ojtInfo.studentName,
                  company: ojtInfo.companyName,
                  department: ojtInfo.departmentName,
                  program: ojtInfo.programName,
                  supervisor: ojtInfo.supervisorName,
                  departmentId: ojtInfo.departmentId,
                  programId: ojtInfo.programId,
                }
              : null,
          };
        }),
      );

      // Apply filters after fetching all the data with related info
      let filteredResponses = detailedResponses;

      if (departmentId) {
        filteredResponses = filteredResponses.filter(
          (response) => response.student?.departmentId === departmentId,
        );
      }

      if (programId) {
        filteredResponses = filteredResponses.filter(
          (response) => response.student?.programId === programId,
        );
      }

      return c.json(filteredResponses);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get(
    '/response/unanswered',
    requireRole(['admin', 'coordinator']),
    async (c) => {
      try {
        // Extract query parameters
        const departmentIdStr = c.req.query('departmentId');
        const programIdStr = c.req.query('programId');

        const departmentId = departmentIdStr
          ? parseInt(departmentIdStr)
          : undefined;
        const programId = programIdStr ? parseInt(programIdStr) : undefined;

        // Find all active OJT applications
        let ojtQuery = db
          .select({
            id: ojtApplication.id,
            studentName: users.fullName,
            departmentName: departments.name,
            programName: programs.name,
            departmentId: departments.id,
            programId: programs.id,
          })
          .from(ojtApplication)
          .innerJoin(users, eq(ojtApplication.studentId, users.id))
          .leftJoin(classes, eq(ojtApplication.classId, classes.id))
          .leftJoin(programs, eq(classes.programId, programs.id))
          .leftJoin(departments, eq(classes.departmentId, departments.id));

        const ojtApplications = await ojtQuery;

        // Find OJTs that have feedback responses
        const feedbackResponses = await db
          .select({
            ojtId: supervisorFeedbackResponse.ojtId,
          })
          .from(supervisorFeedbackResponse);

        const respondedOjtIds = new Set(feedbackResponses.map((r) => r.ojtId));

        // Filter OJTs that haven't responded
        let unansweredOjts = ojtApplications.filter(
          (ojt) => !respondedOjtIds.has(ojt.id),
        );

        // Apply department and program filters
        if (departmentId) {
          unansweredOjts = unansweredOjts.filter(
            (ojt) => ojt.departmentId === departmentId,
          );
        }

        if (programId) {
          unansweredOjts = unansweredOjts.filter(
            (ojt) => ojt.programId === programId,
          );
        }

        return c.json({
          count: unansweredOjts.length,
          unansweredOjts,
        });
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
