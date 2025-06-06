import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import {
  insertUserSchema,
  updateUserSchema,
  users,
  passwordResetTokens,
} from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import React from 'react';
import { resend } from '../lib/resend';
import { NewUserEmailTemplate } from '../emails/new-user-email';
import { uploadFile } from '../lib/cloudinary';
import { PasswordResetEmailTemplate } from '../emails/password-reset-email';
import crypto from 'crypto';
import env from '../lib/env';

const updateRoleSchema = z.object({
  role: z.enum(['coordinator', 'student', 'admin']),
});

const updateFullNameSchema = z.object({
  fullName: z.string().min(1),
});

const updatePasswordAdminSchema = z.object({
  password: z.string().min(1),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(1),
});

const updatePersonalInfoSchema = z.object({
  fullName: z.string().min(1),
  gender: z.enum(['male', 'female']),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(1),
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
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.isActive, true))
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
  .delete('/:id', requireRole(['admin']), async (c) => {
    try {
      const idParam = c.req.param('id');
      const id = Number(idParam);

      if (isNaN(id)) {
        return c.json({ message: 'Invalid user id provided' }, 400);
      }

      const [result] = await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, id));

      if (result.affectedRows === 0) {
        return c.json({ message: 'User not found' }, 404);
      }

      return c.json({ message: 'User archived successfully' });
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
  .patch(
    '/:id/password',
    requireRole(['admin']),
    zValidator('json', updatePasswordAdminSchema),
    async (c) => {
      try {
        const idParam = c.req.param('id');
        const id = Number(idParam);

        if (isNaN(id)) {
          return c.json({ message: 'Invalid user id provided' }, 400);
        }

        const data = c.req.valid('json');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.password, salt);

        const [result] = await db
          .update(users)
          .set({ password: hash })
          .where(eq(users.id, id));

        if (result.affectedRows === 0) {
          return c.json({ message: 'User not found' }, 404);
        }

        return c.json({ message: 'User password updated successfully' });
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
  )
  .post(
    '/forgot-password',
    zValidator('json', forgotPasswordSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, data.email));

        if (!user) {
          return c.json({
            message:
              'If an account exists with this email, you will receive a password reset link',
          });
        }

        // Generate a random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 3600000; // 1 hour from now

        // Store the token in the database
        await db.insert(passwordResetTokens).values({
          userId: user.id,
          token,
          expiresAt,
        });

        const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

        const emailElement = React.createElement(PasswordResetEmailTemplate, {
          fullName: user.fullName,
          resetUrl,
        });

        await resend.emails.send({
          from: 'noreply@bsuojtportal.xyz',
          to: user.email,
          subject: 'Reset Your Password - BSU OJT Portal',
          react: emailElement,
        });

        return c.json({
          message:
            'If an account exists with this email, you will receive a password reset link',
        });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .post(
    '/reset-password',
    zValidator('json', resetPasswordSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');

        // Find the token
        const [tokenRecord] = await db
          .select()
          .from(passwordResetTokens)
          .where(eq(passwordResetTokens.token, data.token));

        if (!tokenRecord) {
          return c.json({ message: 'Invalid or expired token' }, 400);
        }

        // Check if token is expired
        if (tokenRecord.expiresAt < Date.now()) {
          await db
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.id, tokenRecord.id));
          return c.json({ message: 'Token has expired' }, 400);
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.newPassword, salt);

        // Update the user's password
        await db
          .update(users)
          .set({ password: hash })
          .where(eq(users.id, tokenRecord.userId));

        // Delete the used token
        await db
          .delete(passwordResetTokens)
          .where(eq(passwordResetTokens.id, tokenRecord.id));

        return c.json({ message: 'Password has been reset successfully' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
