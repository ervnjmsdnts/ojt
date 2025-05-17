import AppSidebar from '@/components/side-bar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { userOJTOptions, userQueryOptions } from '@/lib/api';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    let user = null;

    try {
      user = await queryClient.fetchQuery(userQueryOptions);
    } catch (error) {
      user = null;
    }

    if (!user) throw redirect({ to: '/login' });
    if (user.role === 'student') {
      const ojt = await queryClient.fetchQuery(userOJTOptions);
      if (ojt && !ojt.coordinatorId && !ojt.studentCoordinatorRequestId)
        throw redirect({ to: '/assign-coordinator' });
      if (ojt && ojt.ojtStatus === 'ojt' && !ojt.companyId)
        throw redirect({ to: '/assign-company' });
    }

    return { user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user: initialUser } = Route.useRouteContext();

  // Keep the user data fresh by using useQuery to access the latest data
  const { data: latestUser } = useQuery({
    ...userQueryOptions,
    initialData: initialUser,
  });

  // Use the latest user data
  const user = latestUser || initialUser;

  return (
    <>
      <SidebarProvider>
        <AppSidebar user={user} />
        <Outlet />
      </SidebarProvider>
    </>
  );
}
