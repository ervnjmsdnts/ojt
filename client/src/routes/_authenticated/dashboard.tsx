import DashboardAdmin from '@/components/dashboards/dashboard-admin';
import DashboardStudent from '@/components/dashboards/dashboard-student';
import { userQueryOptions } from '@/lib/api';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard')({
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
  if (user) {
    if (user.role === 'student') return <DashboardStudent userId={user.id} />;
    else return <DashboardAdmin role={user.role} userId={user.id} />;
  }
}
