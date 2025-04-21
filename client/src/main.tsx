import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './index.css';

const queryClient = new QueryClient();

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { TooltipProvider } from './components/ui/tooltip';
import { ChatProvider } from './context/ChatContext';

// Create a new router instance
const router = createRouter({ routeTree, context: { queryClient } });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('root')!;
const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider>
          <RouterProvider router={router} />
          <Toaster richColors />
        </ChatProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);
