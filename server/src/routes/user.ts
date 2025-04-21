import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import { insertUserSchema, updateUserSchema, users } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import React from 'react';
import { resend } from '../lib/resend';
import { NewUserEmailTemplate } from '../emails/new-user-email';
import { uploadFile } from '../lib/cloudinary';

const updateRoleSchema = z.object({
  role: z.enum(['coordinator', 'student', 'admin']),
});

const updateFullNameSchema = z.object({
  fullName: z.string().min(1),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(1),
});

const updatePersonalInfoSchema = z.object({
  fullName: z.string().min(1),
  gender: z.enum(['male', 'female']),
});

export const userRoutes = new Hono()
  .get('/', requireRole(['admin']), async (c) => {
    try {
      const result = await db
        .select({
          id: users.id,
          srCode: users.srCode,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          gender: users.gender,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .get('/profile', async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const [user] = await db
        .select({
          id: users.id,
          srCode: users.srCode,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          profilePictureUrl: users.profilePictureUrl,
          gender: users.gender,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      return c.json(user);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .put(
    '/:id',
    requireRole(['admin']),
    zValidator('json', updateUserSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        const idParam = c.req.param('id');
        const id = Number(idParam);
        if (isNaN(id)) {
          return c.json({ message: 'Invalid user id provided' }, 400);
        }

        const [result] = await db
          .update(users)
          .set(data)
          .where(eq(users.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'User not found' }, 404);
        }

        return c.json({ message: 'User updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/role',
    requireRole(['admin']),
    zValidator('json', updateRoleSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid user id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(users)
          .set({ role: data.role })
          .where(eq(users.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'User not found' }, 404);
        }

        return c.json({ message: 'User role updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/:id/name',
    requireRole(['admin']),
    zValidator('json', updateFullNameSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid user id provided' }, 400);
        }

        const data = c.req.valid('json');

        const [result] = await db
          .update(users)
          .set({ fullName: data.fullName })
          .where(eq(users.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'User not found' }, 404);
        }

        return c.json({ message: 'User full name updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .post(
    '/',
    requireRole(['admin']),
    zValidator('json', insertUserSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');
        const originalPassword = data.password;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.password, salt);

        data.password = hash;

        const validateUser = insertUserSchema.parse(data);

        await db.insert(users).values(validateUser);

        const emailElement = React.createElement(NewUserEmailTemplate, {
          fullName: data.fullName,
          srCode: data.srCode,
          email: data.email,
          password: originalPassword,
        });

        await resend.emails.send({
          from: 'noreply@bsuojtportal.xyz',
          to: data.email,
          subject: 'Welcome to BSU OJT Portal',
          react: emailElement,
        });

        return c.json({ message: 'User created and welcome email sent' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/profile-picture',
    requireRole(['admin', 'coordinator', 'student']),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const file = await c.req.formData();
        const profilePicture = file.get('profilePicture') as File;

        if (!profilePicture) {
          return c.json({ message: 'Profile picture is required' }, 400);
        }

        const { url } = await uploadFile(profilePicture);

        await db
          .update(users)
          .set({ profilePictureUrl: url })
          .where(eq(users.id, userId));

        return c.json({
          message: 'Profile picture updated successfully',
          profilePictureUrl: url,
        });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/change-password',
    requireRole(['admin', 'coordinator', 'student']),
    zValidator('json', updatePasswordSchema),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('json');

        const [user] = await db
          .select({ password: users.password })
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          return c.json({ message: 'User not found' }, 404);
        }

        const isPasswordCorrect = await bcrypt.compare(
          data.currentPassword,
          user.password,
        );

        if (!isPasswordCorrect) {
          return c.json({ message: 'Current password is incorrect' }, 400);
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.newPassword, salt);

        await db
          .update(users)
          .set({ password: hash })
          .where(eq(users.id, userId));

        return c.json({ message: 'Password updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .patch(
    '/personal-info',
    requireRole(['admin', 'coordinator']),
    zValidator('json', updatePersonalInfoSchema),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('json');

        await db.update(users).set(data).where(eq(users.id, userId));

        return c.json({ message: 'Personal info updated successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
