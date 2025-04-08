import PageHeaderText from '@/components/page-header-text';
import { Input } from '@/components/ui/input';
import { SidebarInset } from '@/components/ui/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getClasses,
  getDepartments,
  getPrograms,
  UpdateClassDepartment,
  updateClassDepartment,
  updateClassName,
  UpdateClassProgram,
  updateClassProgram,
} from '@/lib/api';
import { useCallback, useMemo, useState } from 'react';
import usePagination from '@/hooks/use-pagination';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TableRowSkeleton from '@/components/table-row-skeleton';
import DoubleClickTooltip from '@/components/double-click-tooltip';
import Pagination from '@/components/pagination';
import { EditableTableCell } from '@/components/editable-table-cell';
import { toast } from 'sonner';
import AddClassDialog from '@/components/classes/add-class-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Route = createFileRoute('/_authenticated/classes')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending: classesPending, data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses,
  });
  const { isPending: programsPending, data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
  });
  const { isPending: departmentsPending, data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const isPending = useMemo(
    () => classesPending || programsPending || departmentsPending,
    [classesPending, programsPending, departmentsPending],
  );

  const queryClient = useQueryClient();

  const [filterName, setFilterName] = useState('');

  const [updateName, setUpdateName] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingRowProgram, setEditingRowProgram] = useState<number | null>(
    null,
  );
  const [editingRowDepartment, setEditingRowDepartment] = useState<
    number | null
  >(null);

  const updateNameMutation = useMutation({ mutationFn: updateClassName });
  const updateProgramMutation = useMutation({ mutationFn: updateClassProgram });
  const updateDepartmentMutation = useMutation({
    mutationFn: updateClassDepartment,
  });

  const onUpdateProgram = (data: UpdateClassProgram) => {
    updateProgramMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] });
        setEditingRowProgram(null);
        toast.success('Class program updated successfully');
      },
    });
  };

  const onUpdateDepartment = (data: UpdateClassDepartment) => {
    updateDepartmentMutation.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] });
        setEditingRowDepartment(null);
        toast.success('Class department updated successfully');
      },
    });
  };

  const onUpdateName = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, data: { classId: number }) => {
      if (e.key === 'Enter') {
        if (!updateName) {
          return toast.error('Name cannot be empty');
        }
        updateNameMutation.mutate(
          { classId: data.classId, name: updateName },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['classes'] });
              setEditingRow(null);
              toast.success('Class name updated successfully');
            },
          },
        );
      }
    },
    [updateName],
  );

  const filteredClasses = useMemo(() => {
    if (!classes) return [];

    return classes.filter((c) => {
      const nameMatches = c.name
        .toLowerCase()
        .includes(filterName.toLowerCase());

      return nameMatches;
    });
  }, [classes, filterName]);

  const { currentItems, paginate, currentPage, totalPages } =
    usePagination(filteredClasses);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Classes</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Input
            onChange={(e) => setFilterName(e.target.value)}
            className='max-w-xs'
            placeholder='Search by name...'
          />
        </div>
        <AddClassDialog />
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <DoubleClickTooltip text='Name' />
                </TableHead>
                <TableHead>
                  <DoubleClickTooltip text='Program' />
                </TableHead>
                <TableHead>
                  <DoubleClickTooltip text='Department' />
                </TableHead>
                {/* <TableHead className='text-center'>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={3} />
              ) : (
                currentItems.map((c, index) => (
                  <TableRow key={c.id}>
                    <EditableTableCell
                      editing={editingRow === index}
                      onToggleEditing={() =>
                        setEditingRow(editingRow === index ? null : index)
                      }>
                      {editingRow === index ? (
                        <Input
                          defaultValue={c.name}
                          onChange={(e) => setUpdateName(e.target.value)}
                          onKeyDown={(e) => onUpdateName(e, { classId: c.id })}
                          className='w-[200px]'
                        />
                      ) : (
                        c.name
                      )}
                    </EditableTableCell>
                    <EditableTableCell
                      editing={editingRowProgram === index}
                      onToggleEditing={() =>
                        setEditingRowProgram(
                          editingRowProgram === index ? null : index,
                        )
                      }>
                      {editingRowProgram === index ? (
                        <Select
                          defaultValue={c.program.id?.toString()}
                          onValueChange={(value) =>
                            onUpdateProgram({
                              classId: c.id,
                              programId: Number(value),
                            })
                          }>
                          <SelectTrigger className='w-[120px]'>
                            <SelectValue placeholder='Select program...' />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map((program) => (
                              <SelectItem
                                key={program.id}
                                value={program.id.toString()}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        c.program.name
                      )}
                    </EditableTableCell>
                    <EditableTableCell
                      editing={editingRowDepartment === index}
                      onToggleEditing={() =>
                        setEditingRowDepartment(
                          editingRowDepartment === index ? null : index,
                        )
                      }>
                      {editingRowDepartment === index ? (
                        <Select
                          defaultValue={c.department.id?.toString()}
                          onValueChange={(value) =>
                            onUpdateDepartment({
                              classId: c.id,
                              departmentId: Number(value),
                            })
                          }>
                          <SelectTrigger className='w-[120px]'>
                            <SelectValue placeholder='Select department...' />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((department) => (
                              <SelectItem
                                key={department.id}
                                value={department.id.toString()}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        c.department.name
                      )}
                    </EditableTableCell>
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
