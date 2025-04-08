import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { SidebarInset } from '../ui/sidebar';
import { getStudentDashboard } from '@/lib/api';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardStudent() {
  const { isPending, data: dashboard } = useQuery({
    queryFn: getStudentDashboard,
    queryKey: ['dashboard'],
  });
  return (
    <SidebarInset className='py-4 px-8 flex flex-row gap-4'>
      <div className='w-3/4 flex flex-col gap-4'>
        <div className='grid grid-cols-3 gap-2'>
          <Card>
            <CardHeader>
              <CardTitle>Pre-OJT</CardTitle>
              <CardDescription>Number of Approved Submissions</CardDescription>
            </CardHeader>
            <CardContent className='flex justify-end'>
              <p>1/5</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>OJT</CardTitle>
              <CardDescription>Number of Hours</CardDescription>
            </CardHeader>
            <CardContent className='flex justify-end'>
              <p>16/320 hrs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Post-OJT</CardTitle>
              <CardDescription>Number of Approved Submissions</CardDescription>
            </CardHeader>
            <CardContent className='flex justify-end'>
              <p>1/5</p>
            </CardContent>
          </Card>
        </div>
        <Card className='h-full'>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
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
      <div className='w-1/4 flex flex-col gap-4'>
        <Card className='h-2/5 overflow-y-auto'>
          <CardHeader>
            <CardTitle>Links</CardTitle>
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
        <Card className='h-3/5'>
          <CardHeader>
            <CardTitle>Chat with Coordinator</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Implementing...</p>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
