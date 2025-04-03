import { EditableTableCell } from '@/components/editable-table-cell';
import PageHeaderText from '@/components/page-header-text';
import Pagination from '@/components/pagination';
import RoleBadge from '@/components/role-badge';
import TableRowSkeleton from '@/components/table-row-skeleton';
import { Button } from '@/components/ui/button';
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
import AddUserDialog from '@/components/users/add-user-dialog';
import usePagination from '@/hooks/use-pagination';
import { getUsers, UpdateRole, updateUserRole } from '@/lib/api';
import { Role } from '@/lib/types';
import { toUpperCase } from '@/lib/utils';
import { User } from '@server/sharedTypes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Archive } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/users')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    isPending,
    error,
    data: users,
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'any'>('any');

  const { mutate } = useMutation({ mutationFn: updateUserRole });

  const onUpdateRole = (data: UpdateRole) => {
    mutate(data, {
      onSuccess: ({ message }) => {
        toast.success(message, {});
        setEditingRow(null);
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) => {
      const nameMatches = user.fullName
        .toLowerCase()
        .includes(filterName.toLowerCase());

      const roleMatches =
        filterRole === 'any' ? true : user.role === filterRole;

      return nameMatches && roleMatches;
    });
  }, [users, filterName, filterRole]);

  if (error) return <p>Error</p>;

  const { currentItems, paginate, currentPage, totalPages } =
    usePagination<User>(filteredUsers!);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Users</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Input
            onChange={(e) => setFilterName(e.target.value)}
            className='max-w-xs'
            placeholder='Search by name...'
          />
          <Select
            defaultValue='any'
            onValueChange={(value) => setFilterRole(value as Role | 'any')}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='Select role...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Any</SelectItem>
              <SelectItem value='student'>Student</SelectItem>
              <SelectItem value='coordinator'>Coordinator</SelectItem>
              <SelectItem value='admin'>Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AddUserDialog />
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SR Code</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={5} />
              ) : (
                currentItems?.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.srCode}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <EditableTableCell
                      editing={editingRow === index}
                      onToggleEditing={() =>
                        setEditingRow(editingRow === index ? null : index)
                      }>
                      {editingRow === index ? (
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) =>
                            onUpdateRole({
                              role: value as Role,
                              userId: user.id,
                            })
                          }>
                          <SelectTrigger className='w-[120px]'>
                            <SelectValue placeholder='Select role...' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='student' disabled>
                              Student
                            </SelectItem>
                            <SelectItem value='coordinator'>
                              Coordinator
                            </SelectItem>
                            <SelectItem value='admin'>Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <RoleBadge role={user.role} />
                      )}
                    </EditableTableCell>
                    <TableCell>{toUpperCase(user.gender)}</TableCell>
                    <TableCell>
                      <div className='flex justify-center'>
                        <Button variant='destructive' size='icon'>
                          <Archive />
                        </Button>
                      </div>
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
