import { Button } from '@/components/ui/button';
import { api, userQueryOptions } from '@/lib/api';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import Logo from '@/components/logo';
export const Route = createFileRoute('/_authenticated-no-sidebar')({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    let user = null;

    try {
      user = await queryClient.fetchQuery(userQueryOptions);
    } catch (error) {
      user = null;
    }

    if (!user) throw redirect({ to: '/login' });

    return { user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const signOut = async () => {
    await api.auth.logout.$post();
    window.location.reload();
  };

  return (
    <div className='w-screen h-screen flex flex-col'>
      <div className='flex items-center p-4 border-b justify-between'>
        <div className='flex items-center gap-2'>
          <Logo isLarge />
          <p className='text-sidebar-foreground/70'>
            Student Internship Portal
          </p>
        </div>
        <Button onClick={signOut}>Logout</Button>
      </div>
      <div className='flex-1'>
        <Outlet />
      </div>
    </div>
  );
}
