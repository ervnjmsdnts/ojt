import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { db } from '../db';
import { updateUserSchema, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

export const userRoutes = new Hono();

userRoutes.get('/', requireRole(['admin']), async (c) => {
  try {
    const result = await db
      .select({
        id: users.id,
        srCode: users.srCode,
        fullName: users.fullName,
        role: users.role,
        gender: users.gender,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    return c.json(result);
  } catch (error) {
    console.log(error);
    return c.json({ message: 'Something went wrong' }, 500);
  }
});

userRoutes.get('/profile', async (c) => {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const [user] = await db
      .select({
        id: users.id,
        srCode: users.srCode,
        fullName: users.fullName,
        role: users.role,
        gender: users.gender,
      })
      .from(users)
      .where(eq(users.id, userId));

    return c.json(user);
  } catch (error) {
    console.log(error);
    return c.json({ message: 'Something went wrong' }, 500);
  }
});

userRoutes.put(
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

      const [result] = await db.update(users).set(data).where(eq(users.id, id));

      if (result.affectedRows === 0) {
        return c.json({ message: 'User not found' }, 404);
      }

      return c.json({ message: 'User updated successfully' });
    } catch (error) {
      console.log(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  },
);
