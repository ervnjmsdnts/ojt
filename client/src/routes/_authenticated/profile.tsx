import CategoryBadge from '@/components/category-badge';
import PageHeaderText from '@/components/page-header-text';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarInset } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentOJT } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { User2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();

  const { isPending: studentOJTPending, data: studentOJT } = useQuery({
    queryKey: ['student-ojt'],
    queryFn: getCurrentOJT,
    enabled: user.role === 'student',
  });

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Profile</PageHeaderText>
      <Avatar className='w-32 h-32'>
        <AvatarFallback>
          <User2 className='w-24 h-24' />
        </AvatarFallback>
      </Avatar>
      <div className='grid gap-2'>
        <p>
          <span className='font-semibold'>Name: </span>
          {user.fullName}
        </p>
        <p>
          <span className='font-semibold'>
            {user.role === 'student' ? 'SR-Code' : 'Employee Code'}:{' '}
          </span>
          {user.srCode}
        </p>
        <p>
          <span className='font-semibold'>Email Address: </span>
          {user.email}
        </p>
        {user.role === 'student' && (
          <>
            <p className='flex gap-1 items-center'>
              <span className='font-semibold'>Class: </span>
              {studentOJTPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                studentOJT?.class?.name
              )}
            </p>
            <p className='flex gap-1 items-center'>
              <span className='font-semibold'>Coordinator: </span>
              {studentOJTPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                studentOJT?.coordinator?.fullName
              )}
            </p>
            <p className='flex gap-1 items-center'>
              <span className='font-semibold'>Company: </span>
              {studentOJTPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                studentOJT?.company?.name
              )}
            </p>
            <p className='flex gap-1 items-center'>
              <span className='font-semibold'>OJT Status: </span>
              {studentOJTPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                <CategoryBadge category={studentOJT?.ojtStatus!} />
              )}
            </p>
          </>
        )}
      </div>
    </SidebarInset>
  );
}
