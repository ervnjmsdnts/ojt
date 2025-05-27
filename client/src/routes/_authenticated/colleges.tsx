import PageHeaderText from '@/components/page-header-text';
import { Input } from '@/components/ui/input';
import { SidebarInset } from '@/components/ui/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDepartments, updateDepartmentName } from '@/lib/api';
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
import AddDepartmentDialog from '@/components/departments/add-department-dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/colleges')({
  component: RouteComponent,
});

function RouteComponent() {
  const [filterName, setFilterName] = useState('');

  const [updateName, setUpdateName] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const data = [
    { id: 1, name: 'Alangilan' },
    { id: 2, name: 'Malvar' },
  ];

  const { currentItems, paginate, currentPage, totalPages } =
    usePagination(data);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Colleges</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Input
            onChange={(e) => setFilterName(e.target.value)}
            className='max-w-xs'
            placeholder='Search by name...'
          />
        </div>
        <Button>Add College</Button>
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <DoubleClickTooltip text='Name' />
                </TableHead>
                {/* <TableHead className='text-center'>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((department, index) => (
                <TableRow key={department.id}>
                  <EditableTableCell
                    editing={editingRow === index}
                    onToggleEditing={() =>
                      setEditingRow(editingRow === index ? null : index)
                    }>
                    {editingRow === index ? (
                      <Input
                        // defaultValue={department.name}
                        // onChange={(e) => setUpdateName(e.target.value)}
                        // onKeyDown={(e) =>
                        //   onUpdateName(e, { departmentId: department.id })
                        // }
                        className='w-[200px]'
                      />
                    ) : (
                      department.name
                    )}
                  </EditableTableCell>
                </TableRow>
              ))}
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
