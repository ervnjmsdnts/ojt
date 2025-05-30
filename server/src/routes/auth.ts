import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  insertUserSchema,
  ojtApplication,
  sessions,
  users,
} from '../db/schema';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { uploadFile } from '../lib/cloudinary';

const loginSchema = z.object({
  srCode: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  srCode: z.string().min(1),
  email: z.string().email().min(1),
  classId: z.coerce.number(),
  registrationForm: z.instanceof(File),
  password: z.string().min(1),
  fullName: z.string().min(1),
  yearLevel: z.string().min(1),
  semester: z.string().min(1),
  gender: z.enum(['male', 'female']),
});

export const authRoute = new Hono()
  .post('/login', zValidator('json', loginSchema), async (c) => {
    try {
      const user = c.req.valid('json');

      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.srCode, user.srCode));

      if (!userRecord) {
        return c.json({ message: 'Invalid credentials' }, 401);
      }

      const isValidPassword = await bcrypt.compare(
        user.password,
        userRecord.password,
      );

      if (!isValidPassword) {
        return c.json({ message: 'Invalid credentials' }, 401);
      }

      const sessionId = nanoid();

      await db.insert(sessions).values({ sessionId, userId: userRecord.id });

      setCookie(c, 'session_id', sessionId, {
        httpOnly: true,
        path: '/',
      });

      return c.json({ message: 'Logged in' }, 200);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .post('/register', zValidator('form', registerSchema), async (c) => {
    try {
      const { classId, registrationForm, ...user } = c.req.valid('form');

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);

      user.password = hash;

      const validateUser = insertUserSchema.parse(user);

      await db.transaction(async (tx) => {
        const [result] = await tx.insert(users).values(validateUser);

        const { url } = await uploadFile(registrationForm);

        await tx.insert(ojtApplication).values({
          studentId: result.insertId,
          classId,
          yearLevel: user.yearLevel,
          semester: user.semester,
          registrationFormUrl: url,
        });
      });

      return c.json({ message: 'User created' }, 201);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .post('/logout', async (c) => {
    try {
      const sessionId = getCookie(c, 'session_id');
      if (sessionId) {
        await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
        deleteCookie(c, 'session_id', { path: '/' });
      }
      return c.json({ success: true });
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  });
