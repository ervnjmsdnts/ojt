import { Hono } from 'hono';

import { requireRole } from '../middlewares/role';
import {
  createAuthClient,
  getFormResponses,
  getFormStructure,
  mapResponsesToQuestions,
} from '../lib/googleForm';
import { db } from '../db';
import {
  formTemplates,
  logs,
  ojtApplication,
  studentSubmissions,
  users,
} from '../db/schema';
import { eq } from 'drizzle-orm';

export const formRoutes = new Hono()
  .get('/:formId', requireRole(['coordinator', 'admin']), async (c) => {
    try {
      const formId = c.req.param('formId');

      const auth = await createAuthClient();

      const questions = await getFormStructure(auth, formId);

      const responses = await getFormResponses(auth, formId);

      const parsed = mapResponsesToQuestions(responses, questions);

      return c.json(parsed);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get(
    '/:formId/:userId',
    requireRole(['coordinator', 'admin', 'student']),
    async (c) => {
      try {
        const formId = c.req.param('formId');
        const userIdParam = c.req.param('userId');

        const userId = Number(userIdParam);

        if (isNaN(userId)) {
          return c.json({ message: 'Invalid user id provided' }, 400);
        }

        const auth = await createAuthClient();

        const questions = await getFormStructure(auth, formId);

        const responses = await getFormResponses(auth, formId);

        const [user] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          return c.json({ message: 'User not found' }, 404);
        }

        const parsed = mapResponsesToQuestions(responses, questions);

        const filterByUser = parsed.find(
          (res) => res.respondentEmail === user.email,
        );

        if (!filterByUser) {
          return c.json({ message: 'No response found from user' }, 400);
        }

        return c.json(filterByUser);
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .post('/webhook', async (c) => {
    try {
      const body = await c.req.json<{ email: string; formId: string }>();

      if (!body.email) {
        return c.json({ message: 'No email provided' }, 400);
      }

      if (!body.formId) {
        return c.json({ message: 'No form ID provided' }, 400);
      }

      const { email, formId } = body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return c.json({ message: `User not found for ${email}` }, 404);
      }

      const [ojt] = await db
        .select({ id: ojtApplication.id })
        .from(ojtApplication)
        .where(eq(ojtApplication.studentId, user.id));

      if (!ojt) {
        return c.json({ message: 'No OJT found for this user' }, 404);
      }

      const [template] = await db
        .select()
        .from(formTemplates)
        .where(eq(formTemplates.formId, formId));

      await db.transaction(async (tx) => {
        await tx.insert(studentSubmissions).values({
          ojtId: ojt.id,
          templateId: template.id,
          submittedGoogleForm: true,
        });

        await tx.insert(logs).values({
          ojtId: ojt.id,
          text: `Completed form of ${template.title}`,
        });
      });

      return c.json({ message: 'Google Form submission recorded' });
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
