import { serve } from '@hono/node-server';
import app, { injectWS } from './app';

const server = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
injectWS(server);
