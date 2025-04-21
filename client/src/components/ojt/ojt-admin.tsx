import CategoryBadge from '@/components/category-badge';
import DoubleClickTooltip from '@/components/double-click-tooltip';
import { EditableTableCell } from '@/components/editable-table-cell';
import PageHeaderText from '@/components/page-header-text';
import Pagination from '@/components/pagination';
import TableRowSkeleton from '@/components/table-row-skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  getOJTsAdmin,
  getOJTsCoordinator,
  UpdateOJTStatus,
  updateOJTStatus,
} from '@/lib/api';
import { OJTStatus } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { View } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

export default function OJTAdmin({
  role,
}: {
  role: 'student' | 'coordinator' | 'admin';
}) {
  const { isPending: ojtsAdminPending, data: ojtsAdmin } = useQuery({
    queryKey: ['ojts'],
    queryFn: getOJTsAdmin,
    enabled: role === 'admin',
  });
  const { isPending: ojtsCoordinatorPending, data: ojtsCoordinator } = useQuery(
    {
      queryKey: ['ojts'],
      queryFn: getOJTsCoordinator,
      enabled: role === 'coordinator',
    },
  );

  const ojts = role === 'admin' ? ojtsAdmin : ojtsCoordinator;

  const isPending =
    role === 'admin' ? ojtsAdminPending : ojtsCoordinatorPending;

  const queryClient = useQueryClient();

  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState<OJTStatus | 'any'>('any');

  const [editingRow, setEditingRow] = useState<number | null>(null);

  const { mutate } = useMutation({ mutationFn: updateOJTStatus });

  const onUpdateStatus = (data: UpdateOJTStatus) => {
    mutate(data, {
      onSuccess: ({ message }) => {
        toast.success(message, {});
        setEditingRow(null);
        queryClient.invalidateQueries({
          queryKey: ['ojts'],
        });
      },
    });
  };

  const filteredOJTs = useMemo(() => {
    if (!ojts) return [];

    return ojts.filter((ojt) => {
      const nameMatches = ojt.student.fullName
        .toLowerCase()
        .includes(filterName.toLowerCase());

      const statusMatches =
        filterStatus === 'any' ? true : ojt.status === filterStatus;

      return nameMatches && statusMatches;
    });
  }, [ojts, filterName, filterStatus]);

  const { currentItems, paginate, currentPage, totalPages } =
    usePagination(filteredOJTs);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>OJTs</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Input
            onChange={(e) => setFilterName(e.target.value)}
            className='max-w-xs'
            placeholder='Search by name...'
          />
          <Select
            defaultValue='any'
            onValueChange={(value) =>
              setFilterStatus(value as OJTStatus | 'any')
            }>
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='Select category...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Any</SelectItem>
              <SelectItem value='pre-ojt'>Pre-OJT</SelectItem>
              <SelectItem value='ojt'>OJT</SelectItem>
              <SelectItem value='post-ojt'>Post-OJT</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>
                  <DoubleClickTooltip text='OJT Status' />
                </TableHead>
                <TableHead>Class</TableHead>
                {role === 'admin' && <TableHead>Coordinator</TableHead>}
                <TableHead>Company</TableHead>
                <TableHead className='text-center'>Submissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={5} />
              ) : (
                currentItems.map((ojt, index) => (
                  <TableRow key={ojt.id}>
                    <TableCell>{ojt.student.fullName}</TableCell>
                    <EditableTableCell
                      editing={editingRow === index}
                      onToggleEditing={() =>
                        setEditingRow(editingRow === index ? null : index)
                      }>
                      {editingRow === index ? (
                        <Select
                          defaultValue={ojt.status}
                          onValueChange={(value) =>
                            onUpdateStatus({
                              status: value as OJTStatus,
                              ojtId: ojt.id,
                            })
                          }>
                          <SelectTrigger className='w-[120px]'>
                            <SelectValue placeholder='Select status...' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='pre-ojt'>Pre-OJT</SelectItem>
                            <SelectItem value='ojt'>OJT</SelectItem>
                            <SelectItem value='post-ojt'>Post-OJT</SelectItem>
                            <SelectItem value='completed'>Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <CategoryBadge category={ojt.status as OJTStatus} />
                      )}
                    </EditableTableCell>
                    <TableCell>
                      {ojt?.class ? ojt.class.name : 'Not assigned yet'}
                    </TableCell>
                    {role === 'admin' && (
                      <TableCell>
                        {ojt?.coordinator
                          ? ojt.coordinator.fullName
                          : 'Not assigned yet'}
                      </TableCell>
                    )}
                    <TableCell>
                      {ojt?.company ? ojt.company.name : 'Not assigned yet'}
                    </TableCell>
                    <TableCell className='grid place-items-center'>
                      <Button size='icon' asChild>
                        <Link
                          to='/ojt/$id'
                          params={{ id: ojt.id.toString() }}
                          className='grid place-items-center'>
                          <View />
                        </Link>
                      </Button>
                    </TableCell>
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
