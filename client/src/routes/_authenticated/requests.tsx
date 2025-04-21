import PageHeaderText from '@/components/page-header-text';
import RequestStatusBadge from '@/components/request-status-badge';
import ApproveDialog from '@/components/requests/approve-dialog';
import RejectDialog from '@/components/requests/reject-dialog';
import ViewRegistrationFormDialog from '@/components/requests/view-registration-form-dialog';
import TableRowSkeleton from '@/components/table-row-skeleton';
import { SidebarInset } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCoordinatorRequests } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/requests')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, data } = useQuery({
    queryKey: ['requests'],
    queryFn: getCoordinatorRequests,
  });

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Student Requests</PageHeaderText>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className='text-center'>Registration Form</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date & Time</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={3} />
              ) : (
                data?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.student.fullName}</TableCell>
                    <TableCell className='flex items-center justify-center'>
                      <ViewRegistrationFormDialog
                        registrationFormUrl={request.registrationFormUrl}
                      />
                    </TableCell>
                    <TableCell>
                      <RequestStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{format(request.createdAt!, 'PPpp')}</TableCell>
                    <TableCell className='flex items-center justify-center gap-4'>
                      {request.status === 'pending' && (
                        <>
                          <ApproveDialog requestId={request.id} />
                          <RejectDialog requestId={request.id} />
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarInset>
  );
}
