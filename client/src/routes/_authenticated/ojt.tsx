import OJTAdmin from '@/components/ojt/ojt-admin';
import OJTStudent from '@/components/ojt/ojt-student';
import { userQueryOptions } from '@/lib/api';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/ojt')({
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
    if (user.role !== 'student') return <OJTAdmin role={user.role} />;
    else return <OJTStudent />;
  }
}
