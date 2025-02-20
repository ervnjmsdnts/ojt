import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { Hono } from 'hono';

const app = new Hono();

app.use(logger());

app.get('/api/test', (c) => {
  return c.json({ message: 'hi' });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
