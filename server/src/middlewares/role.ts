import type { MiddlewareHandler } from 'hono';

export function requireRole(allowedRoles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const role = c.get('role') as string | undefined;

    if (!role) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    if (!allowedRoles.includes(role)) {
      return c.json(
        { message: 'User is not authorize to perform this action' },
        403,
      );
    }

    await next();
  };
}
