import { Hono } from 'hono';
import { requireRole } from '../middlewares/role';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, inArray } from 'drizzle-orm';
import { ojtApplication, users } from '../db/schema';
import { StreamChat } from 'stream-chat';
import env from '../lib/env';

const streamChat = StreamChat.getInstance(
  env.STREAM_API_KEY,
  env.STREAM_API_SECRET,
);

// Validate chat token request
const chatTokenSchema = z.object({
  userId: z.string(),
});

// Create chat channel schema
const createChannelSchema = z.object({
  targetUserId: z.number(),
});

export const chatRoutes = new Hono()
  // Get Stream Chat token for authentication
  .post(
    '/token',
    requireRole(['admin', 'coordinator', 'student']),
    zValidator('json', chatTokenSchema),
    async (c) => {
      try {
        const userId = c.get('userId');
        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('json');

        // Query user to get name for token generation
        const [user] = await db
          .select({
            fullName: users.fullName,
            role: users.role,
            profilePictureUrl: users.profilePictureUrl,
          })
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          return c.json({ message: 'User not found' }, 404);
        }

        // Generate Stream Chat token
        const token = streamChat.createToken(data.userId);

        return c.json({
          token,
          user: {
            id: data.userId,
            name: user.fullName,
            role: user.role,
            image: user.profilePictureUrl,
          },
        });
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  )
  // Get available chats for the current user
  .get('/contacts', requireRole(['coordinator', 'student']), async (c) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      // Get user details to determine role
      const [user] = await db
        .select({
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return c.json({ message: 'User not found' }, 404);
      }

      // Different query logic based on user role
      if (user.role === 'student') {
        // Students can only chat with their assigned coordinator
        const [application] = await db
          .select({
            coordinatorId: ojtApplication.coordinatorId,
          })
          .from(ojtApplication)
          .where(eq(ojtApplication.studentId, userId));

        if (!application || !application.coordinatorId) {
          return c.json({ contacts: [] });
        }

        const [coordinator] = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            srCode: users.srCode,
            profilePictureUrl: users.profilePictureUrl,
          })
          .from(users)
          .where(eq(users.id, application.coordinatorId));

        if (!coordinator) {
          return c.json({ contacts: [] });
        }

        return c.json({
          contacts: [coordinator],
        });
      } else if (user.role === 'coordinator') {
        // Coordinators can chat with all students assigned to them
        const studentIds = await db
          .select({
            studentId: ojtApplication.studentId,
          })
          .from(ojtApplication)
          .where(eq(ojtApplication.coordinatorId, userId));

        if (studentIds.length === 0) {
          return c.json({ contacts: [] });
        }

        const students = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            srCode: users.srCode,
            profilePictureUrl: users.profilePictureUrl,
          })
          .from(users)
          .where(
            inArray(
              users.id,
              studentIds.map((s) => s.studentId),
            ),
          );

        return c.json({
          contacts: students,
        });
      }

      return c.json({ contacts: [] });
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  // Explicitly create a user in Stream Chat
  .post('/create-user', requireRole(['coordinator', 'student']), async (c) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const data = await c.req.json();
      const targetUserId = data.userId;

      if (!targetUserId) {
        return c.json({ message: 'User ID is required' }, 400);
      }

      // Get user info from database
      const [targetUser] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          srCode: users.srCode,
          role: users.role,
          profilePictureUrl: users.profilePictureUrl,
        })
        .from(users)
        .where(eq(users.id, parseInt(targetUserId)));

      if (!targetUser) {
        return c.json({ message: 'User not found' }, 404);
      }

      // Create user in Stream Chat
      try {
        console.log(
          `Creating Stream Chat user: ${targetUser.id} (${targetUser.fullName})`,
        );
        await streamChat.upsertUser({
          id: targetUser.id.toString(),
          name: targetUser.fullName,
          role: 'user',
          image: targetUser.profilePictureUrl,
        });
        return c.json({
          success: true,
          message: 'User created in Stream Chat',
          user: {
            id: targetUser.id,
            name: targetUser.fullName,
          },
        });
      } catch (error) {
        console.error('Error creating user in Stream Chat:', error);
        return c.json(
          {
            success: false,
            message: 'Failed to create user in Stream Chat',
          },
          500,
        );
      }
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Something went wrong' }, 500);
    }
  })
  // Create a new chat channel
  .post(
    '/channel',
    requireRole(['coordinator', 'student']),
    zValidator('json', createChannelSchema),
    async (c) => {
      try {
        const userId = c.get('userId');
        if (!userId) {
          return c.json({ message: 'Unauthorized' }, 401);
        }

        const data = c.req.valid('json');

        // Get user details to determine role
        const [user] = await db
          .select({
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          return c.json({ message: 'User not found' }, 404);
        }

        // Verify the relationship between coordinator and student
        if (user.role === 'student') {
          // Students can only create channels with their assigned coordinator
          const [application] = await db
            .select({
              coordinatorId: ojtApplication.coordinatorId,
            })
            .from(ojtApplication)
            .where(eq(ojtApplication.studentId, userId));

          if (
            !application ||
            !application.coordinatorId ||
            application.coordinatorId !== data.targetUserId
          ) {
            return c.json(
              { message: 'You can only chat with your assigned coordinator' },
              403,
            );
          }
        } else if (user.role === 'coordinator') {
          // Coordinators can only create channels with their assigned students
          const [application] = await db
            .select({
              id: ojtApplication.id,
            })
            .from(ojtApplication)
            .where(
              and(
                eq(ojtApplication.coordinatorId, userId),
                eq(ojtApplication.studentId, data.targetUserId),
              ),
            );

          if (!application) {
            return c.json(
              { message: 'You can only chat with your assigned students' },
              403,
            );
          }
        }

        // Get user info for both participants
        const [currentUser] = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            profilePictureUrl: users.profilePictureUrl,
          })
          .from(users)
          .where(eq(users.id, userId));

        const [targetUser] = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            profilePictureUrl: users.profilePictureUrl,
          })
          .from(users)
          .where(eq(users.id, data.targetUserId));

        if (!currentUser || !targetUser) {
          return c.json({ message: 'User not found' }, 404);
        }

        // Create unique channel ID
        const channelId = [userId, data.targetUserId].sort().join('-');

        // First, create both users in Stream Chat
        console.log('Creating users in Stream Chat before channel creation...');

        try {
          // Create current user
          await streamChat.upsertUser({
            id: userId.toString(),
            name: currentUser.fullName,
            role: 'user',
            image: currentUser.profilePictureUrl,
          });
          console.log(
            `Created current user: ${userId} (${currentUser.fullName})`,
          );

          // Create target user
          await streamChat.upsertUser({
            id: data.targetUserId.toString(),
            name: targetUser.fullName,
            role: 'user',
            image: targetUser.profilePictureUrl,
          });
          console.log(
            `Created target user: ${data.targetUserId} (${targetUser.fullName})`,
          );
        } catch (userError: any) {
          console.error('Error creating users in Stream Chat:', userError);
          return c.json(
            {
              message: 'Failed to create users in Stream Chat',
              error: userError.message,
            },
            500,
          );
        }

        // Create channel in Stream Chat
        try {
          console.log('Creating Stream Chat channel...');
          const channel = streamChat.channel('messaging', channelId, {
            members: [userId.toString(), data.targetUserId.toString()],
            created_by_id: userId.toString(),
            name: `Chat with ${targetUser.fullName}`,
          });

          await channel.create();
          console.log(`Channel created successfully: ${channelId}`);

          return c.json({
            channel: {
              id: channelId,
              type: 'messaging',
              name: `Chat with ${targetUser.fullName}`,
            },
          });
        } catch (channelError: any) {
          console.error('Error creating channel in Stream Chat:', channelError);
          return c.json(
            {
              message: 'Failed to create chat channel',
              error: channelError.message,
            },
            500,
          );
        }
      } catch (error) {
        console.error(error);
        return c.json({ message: 'Something went wrong' }, 500);
      }
    },
  );
