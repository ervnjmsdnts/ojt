import PageHeaderText from '@/components/page-header-text';
import Pagination from '@/components/pagination';
import AddDailyReportDialog from '@/components/reports/add-daily-report-dialog';
import MonthlyReportDialog from '@/components/reports/monthly-report-dialog';
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
import usePagination from '@/hooks/use-pagination';
import { getReports } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/reports/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: getReports,
  });

  const { currentItems, paginate, currentPage, totalPages } = usePagination(
    reports!,
  );

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Daily Reports</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'></div>
        <div className='flex items-center gap-2'>
          <AddDailyReportDialog />
          <MonthlyReportDialog />
        </div>
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Accomplishments</TableHead>
                <TableHead>No. of Working Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={4} />
              ) : (
                currentItems?.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      {format(new Date(report.date!), 'EEEE')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.date!), 'PP')}
                    </TableCell>
                    <TableCell className='whitespace-pre-wrap'>
                      {report.accomplishments}
                    </TableCell>
                    <TableCell>{report.numberOfWorkingHours}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className='self-end'>
          <Pagination
            totalPages={totalPages}
            paginate={paginate}
            currentPage={currentPage}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
