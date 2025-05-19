import { Hono } from 'hono';
import { db } from '../db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  appraisalTemplates,
  appraisalCategories,
  appraisalQuestions,
  appraisalResponse,
  appraisalResponses,
  ojtApplication,
  appraisalEmail,
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
import { AppraisalEmailTemplate } from '../emails/appraisal-email';
import env from '../lib/env';

export const appraisalRoutes = new Hono()
  .post(
    '/',
    requireRole(['admin', 'coordinator']),
    zValidator(
      'json',
      z.object({
        formTemplateId: z.number().min(1),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get('userId');
        const data = c.req.valid('json');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const [formTemplate] = await db
          .select()
          .from(formTemplates)
          .where(eq(formTemplates.id, data.formTemplateId));

        if (!formTemplate) {
          return c.json({ message: 'Form template not found' }, 404);
        }

        await db.insert(appraisalTemplates).values({
          formTemplateId: data.formTemplateId,
        });

        return c.json(
          { message: 'Appraisal template created successfully' },
          201,
        );
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )

  // Get the active appraisal template with categories and questions
  .get('/', async (c) => {
    try {
      // Get the active template
      const [template] = await db
        .select({
          id: appraisalTemplates.id,
          isActive: appraisalTemplates.isActive,
          version: appraisalTemplates.version,
          createdAt: appraisalTemplates.createdAt,
          updatedAt: appraisalTemplates.updatedAt,
        })
        .from(appraisalTemplates)
        .where(eq(appraisalTemplates.isActive, true))
        .orderBy(desc(appraisalTemplates.createdAt))
        .limit(1);

      if (!template) {
        return c.json(null);
      }

      // Get categories for the template
      const categories = await db
        .select({
          id: appraisalCategories.id,
          name: appraisalCategories.name,
          displayOrder: appraisalCategories.displayOrder,
          createdAt: appraisalCategories.createdAt,
        })
        .from(appraisalCategories)
        .where(eq(appraisalCategories.templateId, template.id))
        .orderBy(appraisalCategories.displayOrder);

      // Get questions for each category
      const categoriesWithQuestions = await Promise.all(
        categories.map(async (category) => {
          const questions = await db
            .select({
              id: appraisalQuestions.id,
              question: appraisalQuestions.question,
              createdAt: appraisalQuestions.createdAt,
            })
            .from(appraisalQuestions)
            .where(eq(appraisalQuestions.categoryId, category.id));

          return {
            ...category,
            questions,
          };
        }),
      );

      return c.json({
        ...template,
        categories: categoriesWithQuestions,
      });
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })

  // Get a specific template with its categories and questions
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
          id: appraisalTemplates.id,
          isActive: appraisalTemplates.isActive,
          version: appraisalTemplates.version,
          createdAt: appraisalTemplates.createdAt,
          updatedAt: appraisalTemplates.updatedAt,
        })
        .from(appraisalTemplates)
        .where(eq(appraisalTemplates.id, id));

      if (!template) {
        return c.json({ message: 'Template not found' }, 404);
      }

      // Get categories for the template
      const categories = await db
        .select({
          id: appraisalCategories.id,
          name: appraisalCategories.name,
          displayOrder: appraisalCategories.displayOrder,
          createdAt: appraisalCategories.createdAt,
        })
        .from(appraisalCategories)
        .where(eq(appraisalCategories.templateId, template.id))
        .orderBy(appraisalCategories.displayOrder);

      // Get questions for each category
      const categoriesWithQuestions = await Promise.all(
        categories.map(async (category) => {
          const questions = await db
            .select({
              id: appraisalQuestions.id,
              question: appraisalQuestions.question,
              createdAt: appraisalQuestions.createdAt,
            })
            .from(appraisalQuestions)
            .where(eq(appraisalQuestions.categoryId, category.id));

          return {
            ...category,
            questions,
          };
        }),
      );

      return c.json({
        ...template,
        categories: categoriesWithQuestions,
      });
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })

  // Update template info (not categories or questions)
  .patch(
    '/:id',
    requireRole(['admin', 'coordinator']),
    zValidator(
      'json',
      z.object({
        isActive: z.boolean().optional(),
      }),
    ),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid template id' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(appraisalTemplates)
          .set(data)
          .where(eq(appraisalTemplates.id, id));

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

  // Add or update categories
  .patch(
    '/:id/categories',
    requireRole(['admin', 'coordinator']),
    zValidator(
      'json',
      z.object({
        categories: z.array(
          z.object({
            id: z.number().optional(),
            name: z.string().min(1),
            displayOrder: z.number().default(0),
          }),
        ),
      }),
    ),
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
              id: appraisalTemplates.id,
              version: appraisalTemplates.version,
            })
            .from(appraisalTemplates)
            .where(eq(appraisalTemplates.id, id));

          if (!template) {
            throw new Error('Template not found');
          }

          // 2. Increment version
          await tx
            .update(appraisalTemplates)
            .set({
              version: template.version + 1,
              updatedAt: sql`(UNIX_TIMESTAMP() * 1000)`,
            })
            .where(eq(appraisalTemplates.id, id));

          // 3. Delete old categories (this will cascade delete questions)
          await tx
            .delete(appraisalCategories)
            .where(eq(appraisalCategories.templateId, id));

          // 4. Insert new categories
          for (const category of data.categories) {
            await tx.insert(appraisalCategories).values({
              templateId: id,
              name: category.name,
              displayOrder: category.displayOrder,
            });
          }
        });

        return c.json({
          message: 'Categories updated and version incremented successfully',
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

  // Add questions to a category
  .patch(
    '/category/:categoryId/questions',
    requireRole(['admin', 'coordinator']),
    zValidator(
      'json',
      z.object({
        questions: z.array(z.string().min(1)),
      }),
    ),
    async (c) => {
      try {
        const categoryIdParam = c.req.param('categoryId');
        const categoryId = Number(categoryIdParam);

        if (isNaN(categoryId)) {
          return c.json({ message: 'Invalid category id' }, 400);
        }

        const data = c.req.valid('json');

        await db.transaction(async (tx) => {
          // 1. Get the category to ensure it exists and get template ID
          const [category] = await tx
            .select({
              id: appraisalCategories.id,
              templateId: appraisalCategories.templateId,
            })
            .from(appraisalCategories)
            .where(eq(appraisalCategories.id, categoryId));

          if (!category) {
            throw new Error('Category not found');
          }

          // 2. Get the template
          const [template] = await tx
            .select({
              id: appraisalTemplates.id,
              version: appraisalTemplates.version,
            })
            .from(appraisalTemplates)
            .where(eq(appraisalTemplates.id, category.templateId));

          if (!template) {
            throw new Error('Template not found');
          }

          // 3. Increment version
          await tx
            .update(appraisalTemplates)
            .set({
              version: template.version + 1,
              updatedAt: sql`(UNIX_TIMESTAMP() * 1000)`,
            })
            .where(eq(appraisalTemplates.id, template.id));

          // 4. Delete old questions for this category
          await tx
            .delete(appraisalQuestions)
            .where(eq(appraisalQuestions.categoryId, categoryId));

          // 5. Insert new questions
          const questionsToInsert = data.questions.map((question) => ({
            categoryId,
            question,
          }));

          await tx.insert(appraisalQuestions).values(questionsToInsert);
        });

        return c.json({
          message: 'Questions updated and version incremented successfully',
        });
      } catch (error: any) {
        console.error(error);
        if (error.message === 'Category not found') {
          return c.json({ message: 'Category not found' }, 404);
        }
        if (error.message === 'Template not found') {
          return c.json({ message: 'Template not found' }, 404);
        }
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )

  // Submit an appraisal response
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
          id: appraisalTemplates.id,
          version: appraisalTemplates.version,
          formTemplateId: appraisalTemplates.formTemplateId,
        })
        .from(appraisalTemplates)
        .where(eq(appraisalTemplates.isActive, true));

      if (!template) {
        return c.json({ message: 'No active template found' }, 404);
      }

      const signature = formData.get('signature');
      if (!signature || !(signature instanceof File)) {
        return c.json({ message: 'Signature is required' }, 400);
      }

      const jsonData = formData.get('data');

      if (!jsonData) {
        return c.json({ message: 'Appraisal data is required' }, 400);
      }

      try {
        const data = JSON.parse(jsonData.toString());

        if (!data.ratings || Object.keys(data.ratings).length === 0) {
          return c.json({ message: 'Ratings are required' }, 400);
        }

        const { url } = await uploadFile(signature);

        // Calculate the total points from all ratings
        const ratings = Object.values(data.ratings) as number[];
        const totalPoints = ratings.reduce((sum, rating) => sum + rating, 0);

        await db.transaction(async (tx) => {
          // First create appraisal response
          const [responseResult] = await tx.insert(appraisalResponse).values({
            ojtId: ojt.id,
            templateId: template.id,
            comments: data.comments || null,
            supervisorSignature: url,
            totalPoints: totalPoints,
          });

          const responseId = responseResult.insertId;

          // Then create student submission that references the appraisal response
          await tx.insert(studentSubmissions).values({
            ojtId: ojt.id,
            templateId: template.formTemplateId,
            appraisalResponseId: responseId,
          });

          // Insert the individual question ratings
          const ratingsToInsert = Object.entries(data.ratings).map(
            ([questionId, rating]) => ({
              responseId,
              questionId: parseInt(questionId),
              rating: Number(rating),
            }),
          );

          await tx.insert(appraisalResponses).values(ratingsToInsert);

          await tx
            .update(appraisalEmail)
            .set({
              feedbackSubmitted: true,
            })
            .where(eq(appraisalEmail.ojtId, ojt.id));
        });

        return c.json({ message: 'Appraisal submitted successfully' }, 201);
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
      console.error('Error processing appraisal submission:', error);
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
            supervisorEmail: ojtApplication.supervisorEmail,
            supervisorContactNumber: ojtApplication.supervisorContactNumber,
            supervisorAddress: ojtApplication.supervisorAddress,
            companyAddress: companies.address,
            totalOJTHours: ojtApplication.totalOJTHours,
            semester: ojtApplication.semester,
            yearLevel: ojtApplication.yearLevel,
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
            id: appraisalResponse.id,
            templateId: appraisalResponse.templateId,
            responseDate: appraisalResponse.createdAt,
            comments: appraisalResponse.comments,
            supervisorSignature: appraisalResponse.supervisorSignature,
            supervisorSignatureDate: appraisalResponse.supervisorSignatureDate,
            totalPoints: appraisalResponse.totalPoints,
          })
          .from(appraisalResponse)
          .where(eq(appraisalResponse.ojtId, ojtId))
          .orderBy(sql`${appraisalResponse.createdAt} DESC`);

        const detailedResponses = await Promise.all(
          responses.map(async (response) => {
            const [template] = await db
              .select({
                id: appraisalTemplates.id,
                version: appraisalTemplates.version,
              })
              .from(appraisalTemplates)
              .where(eq(appraisalTemplates.id, response.templateId));

            // Get all categories for this template
            const categories = await db
              .select({
                id: appraisalCategories.id,
                name: appraisalCategories.name,
                displayOrder: appraisalCategories.displayOrder,
              })
              .from(appraisalCategories)
              .where(eq(appraisalCategories.templateId, response.templateId))
              .orderBy(appraisalCategories.displayOrder);

            // Get all question ratings with category info
            const questionResponses = await db
              .select({
                id: appraisalResponses.id,
                questionId: appraisalResponses.questionId,
                rating: appraisalResponses.rating,
                questionText: appraisalQuestions.question,
                categoryId: appraisalQuestions.categoryId,
              })
              .from(appraisalResponses)
              .leftJoin(
                appraisalQuestions,
                eq(appraisalResponses.questionId, appraisalQuestions.id),
              )
              .where(eq(appraisalResponses.responseId, response.id));

            // Group questions by category
            const questionsByCategory = categories.map((category) => {
              const categoryQuestions = questionResponses.filter(
                (q) => q.categoryId === category.id,
              );
              return {
                ...category,
                questions: categoryQuestions,
              };
            });

            return {
              ...response,
              template: template || null,
              categories: questionsByCategory,
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
  .post(
    '/verify',
    zValidator(
      'json',
      z.object({
        code: z.string().min(1),
      }),
    ),
    async (c) => {
      try {
        const data = c.req.valid('json');

        const [email] = await db
          .select({
            id: appraisalEmail.id,
            feedbackSubmitted: appraisalEmail.feedbackSubmitted,
            ojtId: appraisalEmail.ojtId,
            email: appraisalEmail.email,
            ojt: ojtApplication,
            company: companies,
            class: classes,
            program: programs,
            department: departments,
            student: users,
          })
          .from(appraisalEmail)
          .where(eq(appraisalEmail.accessCode, data.code))
          .innerJoin(
            ojtApplication,
            eq(ojtApplication.id, appraisalEmail.ojtId),
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
            id: appraisalTemplates.id,
            version: appraisalTemplates.version,
          })
          .from(appraisalTemplates)
          .where(eq(appraisalTemplates.isActive, true));

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
          semester: email.ojt?.semester,
          yearLevel: email.ojt?.yearLevel,
          totalOJTHours: email.ojt?.totalOJTHours,
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
    },
  )
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
        .select({ id: appraisalEmail.id })
        .from(appraisalEmail)
        .where(eq(appraisalEmail.ojtId, ojt.id));

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
        .select({ id: appraisalEmail.id })
        .from(appraisalEmail)
        .where(eq(appraisalEmail.ojtId, ojt.id));

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

      await db.insert(appraisalEmail).values({
        ojtId: ojt.id,
        email: ojt.supervisorEmail!,
        accessCode: accessCode,
      });

      // LocalHost
      const appraisalUrl = `${env.FRONTEND_URL}/appraisal?code=${accessCode}`;

      const emailElement = React.createElement(AppraisalEmailTemplate, {
        studentName: student.fullName,
        supervisorName: ojt.supervisorName!,
        companyName: company.name,
        accessCode: accessCode,
        appraisalUrl: appraisalUrl,
      });

      await resend.emails.send({
        from: 'noreply@bsuojtportal.xyz',
        to: ojt.supervisorEmail!,
        subject: 'Student Appraisal Request - BSU OJT Portal',
        react: emailElement,
      });

      return c.json(
        { message: 'Appraisal request email sent successfully' },
        200,
      );
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
