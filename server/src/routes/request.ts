import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import {
  classes,
  ojtApplication,
  studentCoordinatorRequest,
  users,
} from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import React from 'react';
import { EmailTemplate } from '../emails/request-coordinator-email';
import { resend } from '../lib/resend';
import { alias } from 'drizzle-orm/mysql-core';

const requestCoordinatorSchema = z.object({
  coordinatorId: z.number().min(1),
});

const changeStatusSchema = z.object({
  requestId: z.number().min(1),
});

export const requestRoutes = new Hono()
  .post(
    '/',
    requireRole(['student']),
    zValidator('json', requestCoordinatorSchema),
    async (c) => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('json');

        const [ojt] = await db
          .select()
          .from(ojtApplication)
          .where(eq(ojtApplication.studentId, userId))
          .innerJoin(users, eq(ojtApplication.studentId, users.id))
          .leftJoin(classes, eq(ojtApplication.classId, classes.id));

        if (!ojt) {
          return c.json({ message: 'OJT not found' }, 404);
        }

        const [coordinator] = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
          })
          .from(users)
          .where(eq(users.id, data.coordinatorId));

        if (!coordinator) {
          return c.json({ message: 'Coordinator not found' }, 404);
        }

        const emailElement = React.createElement(EmailTemplate, {
          coordinatorName: coordinator.fullName,
          studentName: ojt.users.fullName,
          studentClass: ojt.classes!.name,
          studentRegistrationForm: ojt.ojt_application.registrationFormUrl!,
        });

        await resend.emails.send({
          from: 'noreply@bsuojtportal.xyz',
          to: coordinator.email,
          subject: 'Requesting Coordinator',
          react: emailElement,
        });

        await db.transaction(async (tx) => {
          const [result] = await tx
            .insert(studentCoordinatorRequest)
            .values({ coordinatorId: coordinator.id, studentId: ojt.users.id });

          await tx
            .update(ojtApplication)
            .set({ studentCoordinatorRequestId: result.insertId })
            .where(eq(ojtApplication.id, ojt.ojt_application.id));
        });

        return c.json({ message: 'Email request has been sent' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .get('/', requireRole(['coordinator']), async (c) => {
    try {
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const coordinatorAlias = alias(users, 'coordinator');
      const studentAlias = alias(users, 'student');

      const result = await db
        .select({
          id: studentCoordinatorRequest.id,
          status: studentCoordinatorRequest.status,
          registrationFormUrl: ojtApplication.registrationFormUrl,
          createdAt: studentCoordinatorRequest.createdAt,
          student: {
            fullName: studentAlias.fullName,
          },
          coordinator: {
            fullName: coordinatorAlias.fullName,
          },
        })
        .from(studentCoordinatorRequest)
        .innerJoin(
          ojtApplication,
          eq(studentCoordinatorRequest.studentId, ojtApplication.studentId),
        )
        .innerJoin(
          studentAlias,
          eq(studentCoordinatorRequest.studentId, studentAlias.id),
        )
        .innerJoin(
          coordinatorAlias,
          eq(studentCoordinatorRequest.coordinatorId, coordinatorAlias.id),
        )
        .where(eq(studentCoordinatorRequest.coordinatorId, userId))
        .orderBy(desc(studentCoordinatorRequest.createdAt));

      return c.json(result);
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  .post(
    '/approve',
    requireRole(['coordinator']),
    zValidator('json', changeStatusSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');
        const [request] = await db
          .select()
          .from(studentCoordinatorRequest)
          .where(eq(studentCoordinatorRequest.id, data.requestId));

        if (!request) {
          return c.json({ message: 'Request not found' }, 404);
        }

        const [ojt] = await db
          .select({ id: ojtApplication.id })
          .from(ojtApplication)
          .where(eq(ojtApplication.studentId, request.studentId));

        await db.transaction(async (tx) => {
          await tx
            .update(studentCoordinatorRequest)
            .set({ status: 'approved' })
            .where(eq(studentCoordinatorRequest.id, request.id));

          await tx
            .update(ojtApplication)
            .set({
              coordinatorId: request.coordinatorId,
              studentCoordinatorRequestId: null,
            })
            .where(eq(ojtApplication.id, ojt.id));
        });

        return c.json({ message: 'Approved request' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  .post(
    '/reject',
    requireRole(['coordinator']),
    zValidator('json', changeStatusSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');
        const [request] = await db
          .select()
          .from(studentCoordinatorRequest)
          .where(eq(studentCoordinatorRequest.id, data.requestId));

        if (!request) {
          return c.json({ message: 'Request not found' }, 404);
        }

        const [ojt] = await db
          .select({ id: ojtApplication.id })
          .from(ojtApplication)
          .where(eq(ojtApplication.studentId, request.studentId));

        await db.transaction(async (tx) => {
          await tx
            .update(studentCoordinatorRequest)
            .set({ status: 'rejected' })
            .where(eq(studentCoordinatorRequest.id, request.id));

          await tx
            .update(ojtApplication)
            .set({ studentCoordinatorRequestId: null })
            .where(eq(ojtApplication.id, ojt.id));
        });

        return c.json({ message: 'Rejected request' });
      } catch (error) {
        console.log(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
