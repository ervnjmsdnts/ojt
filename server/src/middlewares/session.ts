import { type MiddlewareHandler } from 'hono';
import { db } from '../db';
import { sessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getCookie } from 'hono/cookie';

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const sessionId = getCookie(c, 'session_id');

  if (sessionId) {
    const [sessionRecord] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId));

    if (sessionRecord) {
      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.id, sessionRecord.userId));

      if (userRecord) {
        c.set('userId', userRecord.id);
        c.set('role', userRecord.role);
      }
    }
  }

  await next();
};
