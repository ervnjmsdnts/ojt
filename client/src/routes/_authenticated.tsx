import AppSidebar from '@/components/side-bar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { userQueryOptions } from '@/lib/api';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    try {
      const data = await queryClient.fetchQuery(userQueryOptions);
      return { user: data };
    } catch (error) {
      return { user: null };
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  if (!user) {
    return navigate({ to: '/' });
  }
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <Outlet />
    </SidebarProvider>
  );
}
