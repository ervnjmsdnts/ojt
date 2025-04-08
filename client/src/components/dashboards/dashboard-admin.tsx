import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SidebarInset } from '../ui/sidebar';
import { getAdminDashboard, getCoordinatorDashboard } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import TableRowSkeleton from '../table-row-skeleton';
import { Button } from '../ui/button';
import AddLinkDialog from './add-link-dialog';
import AddNotificationDialog from './add-notification-dialog';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardAdmin({
  role,
}: {
  role: 'student' | 'coordinator' | 'admin';
}) {
  const isAdmin = role === 'admin';
  const isCoordinator = role === 'coordinator';

  const { isPending: ojtsAdminPending, data: ojtsAdmin } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getAdminDashboard,
    enabled: isAdmin,
  });
  const { isPending: ojtsCoordinatorPending, data: ojtsCoordinator } = useQuery(
    {
      queryKey: ['dashboard'],
      queryFn: getCoordinatorDashboard,
      enabled: isCoordinator,
    },
  );

  const dashboard = isCoordinator ? ojtsCoordinator : ojtsAdmin;
  const isPending = isCoordinator ? ojtsCoordinatorPending : ojtsAdminPending;

  return (
    <SidebarInset className='py-4 px-8 flex flex-row gap-4'>
      <div className='w-3/4 flex flex-col gap-4'>
        <div className='grid grid-cols-3 gap-2'>
          <Card>
            <CardHeader>
              <CardTitle>Pre-OJT</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                <p>{dashboard?.ojts.preOJTCount}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>OJT</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                <p>{dashboard?.ojts.ojtCount}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Post-OJT</CardTitle>
            </CardHeader>
            <CardContent className='flex justify-end'>
              {isPending ? (
                <Skeleton className='h-5 w-10' />
              ) : (
                <p>{dashboard?.ojts.postOJTCount}</p>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle>Student Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className='grid gap-2 w-full'>
                {new Array(5).fill('').map((_, index) => (
                  <Skeleton className='w-full h-10' key={index} />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRowSkeleton columnCount={3} />
                  ) : (
                    dashboard?.logs.map((item) => (
                      <TableRow key={item.logs.id}>
                        <TableCell>{item.users.fullName}</TableCell>
                        <TableCell>{item.classes?.name}</TableCell>
                        <TableCell>{item.logs.text}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <div className='w-1/4 flex flex-col gap-4'>
        <div className='h-2/5 grid gap-4'>
          {isCoordinator && (
            <Card className='overflow-y-auto'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle>Links</CardTitle>
                  <AddLinkDialog />
                </div>
              </CardHeader>
              <CardContent className='grid gap-2'>
                {isPending ? (
                  <div className='flex items-center justify-center'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                  </div>
                ) : (
                  dashboard?.links.map((link) => (
                    <Button
                      variant='link'
                      className='w-full justify-start p-0 border-b rounded-none'
                      asChild>
                      <a
                        href={
                          link.url.includes('https')
                            ? link.url
                            : `https://${link.url}`
                        }
                        target='_blank'>
                        {link.name}
                      </a>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          )}
          <Card className='overflow-y-auto'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Notifications</CardTitle>
                <AddNotificationDialog />
              </div>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className='flex items-center justify-center'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                </div>
              ) : (
                <div className='grid gap-2'>
                  {dashboard?.notifications.map((notification) => (
                    <div
                      className='border-b py-2 grid gap-1'
                      key={notification.id}>
                      <p className='text-xs text-muted-foreground'>
                        {format(notification.createdAt!, 'PPp')}
                      </p>
                      <p className='text-sm whitespace-pre-wrap'>
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className={cn('h-3/5', isAdmin && 'h-full')}>
          <CardHeader>
            <CardTitle>Chat with Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Implementing...</p>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
