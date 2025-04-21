import { Hono } from 'hono';
import { db } from '../db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  studentFeedbackTemplate,
  feedbackQuestions,
  studentFeedbackResponse,
  feedbackResponses,
  ojtApplication,
  users,
  departments,
  programs,
  classes,
} from '../db/schema';
import { z } from 'zod';
import { requireRole } from '../middlewares/role';
import { zValidator } from '@hono/zod-validator';
import { uploadFile } from '../lib/cloudinary';

const updateFeedbackTemplateSchema = z.object({
  isActive: z.boolean().optional(),
});

const updateFeedbackQuestionsSchema = z.object({
  questions: z.array(z.string().min(1)),
});

const submitFeedbackResponseSchema = z.object({
  ojtId: z.number(),
  templateId: z.number(),
  responses: z.array(
    z.object({
      questionId: z.number(),
      responseValue: z.enum(['SA', 'A', 'N', 'D', 'SD']),
    }),
  ),
  problems: z.string().optional(),
  otherConcerns: z.string().optional(),
  signature: z.string().optional(),
});

export const studentFeedbackRoutes = new Hono()
  .post('/', requireRole(['admin', 'coordinator']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      await db.insert(studentFeedbackTemplate).values({});

      return c.json({ message: 'Feedback template created successfully' }, 201);
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })

  // Get the active feedback template with questions
  .get('/', requireRole(['admin', 'coordinator', 'student']), async (c) => {
    try {
      // Get the active template
      const [template] = await db
        .select({
          id: studentFeedbackTemplate.id,
          isActive: studentFeedbackTemplate.isActive,
          version: studentFeedbackTemplate.version,
          createdAt: studentFeedbackTemplate.createdAt,
          updatedAt: studentFeedbackTemplate.updatedAt,
        })
        .from(studentFeedbackTemplate)
        .where(eq(studentFeedbackTemplate.isActive, true))
        .orderBy(desc(studentFeedbackTemplate.createdAt))
        .limit(1);

      if (!template) {
        return c.json(null);
      }

      // Get questions for the template
      const questions = await db
        .select({
          id: feedbackQuestions.id,
          question: feedbackQuestions.question,
          createdAt: feedbackQuestions.createdAt,
        })
        .from(feedbackQuestions)
        .where(eq(feedbackQuestions.templateId, template.id));

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
  .get('/:id', requireRole(['admin', 'coordinator', 'student']), async (c) => {
    try {
      const idParam = c.req.param('id');
      const id = Number(idParam);

      if (isNaN(id)) {
        return c.json({ message: 'Invalid template id' }, 400);
      }

      // Get the template
      const [template] = await db
        .select({
          id: studentFeedbackTemplate.id,
          isActive: studentFeedbackTemplate.isActive,
          version: studentFeedbackTemplate.version,
          createdAt: studentFeedbackTemplate.createdAt,
          updatedAt: studentFeedbackTemplate.updatedAt,
        })
        .from(studentFeedbackTemplate)
        .where(eq(studentFeedbackTemplate.id, id));

      if (!template) {
        return c.json({ message: 'Template not found' }, 404);
      }

      // Get the questions
      const questions = await db
        .select({
          id: feedbackQuestions.id,
          question: feedbackQuestions.question,
          createdAt: feedbackQuestions.createdAt,
        })
        .from(feedbackQuestions)
        .where(eq(feedbackQuestions.templateId, id));

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
          .update(studentFeedbackTemplate)
          .set(data)
          .where(eq(studentFeedbackTemplate.id, id));

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
              id: studentFeedbackTemplate.id,
              version: studentFeedbackTemplate.version,
            })
            .from(studentFeedbackTemplate)
            .where(eq(studentFeedbackTemplate.id, id));

          if (!template) {
            throw new Error('Template not found');
          }

          // 2. Increment version
          await tx
            .update(studentFeedbackTemplate)
            .set({
              version: template.version + 1,
              updatedAt: sql`(UNIX_TIMESTAMP() * 1000)`,
            })
            .where(eq(studentFeedbackTemplate.id, id));

          // 3. Delete old questions
          await tx
            .delete(feedbackQuestions)
            .where(eq(feedbackQuestions.templateId, id));

          // 4. Insert new questions
          const questionsToInsert = data.questions.map((question) => ({
            templateId: id,
            question,
          }));

          await tx.insert(feedbackQuestions).values(questionsToInsert);
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
  .post('/response', requireRole(['student']), async (c) => {
    try {
      const formData = await c.req.formData();
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      // Get current OJT
      const [ojt] = await db
        .select({ id: ojtApplication.id })
        .from(ojtApplication)
        .where(eq(ojtApplication.studentId, userId));

      if (!ojt) {
        return c.json({ message: 'No active OJT found' }, 404);
      }

      // Get the active template
      const [template] = await db
        .select({
          id: studentFeedbackTemplate.id,
          version: studentFeedbackTemplate.version,
        })
        .from(studentFeedbackTemplate)
        .where(eq(studentFeedbackTemplate.isActive, true));

      if (!template) {
        return c.json({ message: 'No active template found' }, 404);
      }

      const signature = formData.get('signature');
      if (!signature || !(signature instanceof File)) {
        return c.json({ message: 'Signature is required' }, 400);
      }

      const jsonData = formData.get('data');
      console.log('Raw JSON data received:', jsonData);

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
          const [responseResult] = await tx
            .insert(studentFeedbackResponse)
            .values({
              ojtId: ojt.id,
              templateId: template.id,
              templateVersion: template.version,
              problems: data.problemsMet || null,
              otherConcerns: data.otherConcerns || null,
              signature: url,
            });

          const responseId = responseResult.insertId;

          const responsesToInsert = Object.entries(data.feedback).map(
            ([questionId, value]) => ({
              responseId,
              questionId: parseInt(questionId),
              responseValue: value as 'SA' | 'A' | 'N' | 'D' | 'SD',
            }),
          );

          await tx.insert(feedbackResponses).values(responsesToInsert);
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
    '/response/ojt',
    requireRole(['admin', 'coordinator', 'student']),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const [studentOjt] = await db
          .select({ id: ojtApplication.id })
          .from(ojtApplication)
          .where(eq(ojtApplication.studentId, userId));

        if (!studentOjt) {
          return c.json(
            { message: 'This OJT application does not belong to you' },
            403,
          );
        }

        const responses = await db
          .select({
            id: studentFeedbackResponse.id,
            templateId: studentFeedbackResponse.templateId,
            templateVersion: studentFeedbackResponse.templateVersion,
            responseDate: studentFeedbackResponse.responseDate,
            problems: studentFeedbackResponse.problems,
            otherConcerns: studentFeedbackResponse.otherConcerns,
            signature: studentFeedbackResponse.signature,
          })
          .from(studentFeedbackResponse)
          .where(eq(studentFeedbackResponse.ojtId, studentOjt.id))
          .orderBy(sql`${studentFeedbackResponse.responseDate} DESC`);

        const detailedResponses = await Promise.all(
          responses.map(async (response) => {
            const [template] = await db
              .select({
                id: studentFeedbackTemplate.id,
                version: studentFeedbackTemplate.version,
              })
              .from(studentFeedbackTemplate)
              .where(eq(studentFeedbackTemplate.id, response.templateId));

            const questionResponses = await db
              .select({
                id: feedbackResponses.id,
                questionId: feedbackResponses.questionId,
                responseValue: feedbackResponses.responseValue,
                questionText: feedbackQuestions.question,
              })
              .from(feedbackResponses)
              .leftJoin(
                feedbackQuestions,
                eq(feedbackResponses.questionId, feedbackQuestions.id),
              )
              .where(eq(feedbackResponses.responseId, response.id));

            return {
              ...response,
              template: template || null,
              questionResponses,
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

  // Add new route to get all feedback responses
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
          id: studentFeedbackResponse.id,
          ojtId: studentFeedbackResponse.ojtId,
          templateId: studentFeedbackResponse.templateId,
          templateVersion: studentFeedbackResponse.templateVersion,
          responseDate: studentFeedbackResponse.responseDate,
          problems: studentFeedbackResponse.problems,
          otherConcerns: studentFeedbackResponse.otherConcerns,
          signature: studentFeedbackResponse.signature,
        })
        .from(studentFeedbackResponse)
        .orderBy(sql`${studentFeedbackResponse.responseDate} DESC`);

      // If no filters, execute the query as is
      const responses = await query;

      const detailedResponses = await Promise.all(
        responses.map(async (response) => {
          const [template] = await db
            .select({
              id: studentFeedbackTemplate.id,
              version: studentFeedbackTemplate.version,
            })
            .from(studentFeedbackTemplate)
            .where(eq(studentFeedbackTemplate.id, response.templateId));

          const questionResponses = await db
            .select({
              id: feedbackResponses.id,
              questionId: feedbackResponses.questionId,
              responseValue: feedbackResponses.responseValue,
              questionText: feedbackQuestions.question,
            })
            .from(feedbackResponses)
            .leftJoin(
              feedbackQuestions,
              eq(feedbackResponses.questionId, feedbackQuestions.id),
            )
            .where(eq(feedbackResponses.responseId, response.id));

          // Get student and department info
          const [ojtInfo] = await db
            .select({
              studentName: users.fullName,
              departmentName: departments.name,
              programName: programs.name,
              departmentId: departments.id,
              programId: programs.id,
            })
            .from(ojtApplication)
            .where(eq(ojtApplication.id, response.ojtId))
            .innerJoin(users, eq(ojtApplication.studentId, users.id))
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
                  department: ojtInfo.departmentName,
                  program: ojtInfo.programName,
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

  // Add endpoint to get count of OJTs without feedback responses
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
            ojtId: studentFeedbackResponse.ojtId,
          })
          .from(studentFeedbackResponse);

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
