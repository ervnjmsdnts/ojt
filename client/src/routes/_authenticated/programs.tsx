import PageHeaderText from '@/components/page-header-text';
import { Input } from '@/components/ui/input';
import { SidebarInset } from '@/components/ui/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPrograms, updateProgramName } from '@/lib/api';
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
import AddProgramDialog from '@/components/programs/add-program-dialog';

export const Route = createFileRoute('/_authenticated/programs')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
  });

  const queryClient = useQueryClient();

  const [filterName, setFilterName] = useState('');

  const [updateName, setUpdateName] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const updateNameMutation = useMutation({ mutationFn: updateProgramName });

  const onUpdateName = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, data: { programId: number }) => {
      if (e.key === 'Enter') {
        if (!updateName) {
          return toast.error('Name cannot be empty');
        }
        updateNameMutation.mutate(
          { programId: data.programId, name: updateName },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['programs'] });
              setEditingRow(null);
              toast.success('Program name updated successfully');
            },
          },
        );
      }
    },
    [updateName],
  );

  const filteredPrograms = useMemo(() => {
    if (!programs) return [];

    return programs.filter((program) => {
      const nameMatches = program.name
        .toLowerCase()
        .includes(filterName.toLowerCase());

      return nameMatches;
    });
  }, [programs, filterName]);

  const { currentItems, paginate, currentPage, totalPages } =
    usePagination(filteredPrograms);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Programs</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Input
            onChange={(e) => setFilterName(e.target.value)}
            className='max-w-xs'
            placeholder='Search by name...'
          />
        </div>
        <AddProgramDialog />
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
              {isPending ? (
                <TableRowSkeleton columnCount={1} />
              ) : (
                currentItems.map((program, index) => (
                  <TableRow key={program.id}>
                    <EditableTableCell
                      editing={editingRow === index}
                      onToggleEditing={() =>
                        setEditingRow(editingRow === index ? null : index)
                      }>
                      {editingRow === index ? (
                        <Input
                          defaultValue={program.name}
                          onChange={(e) => setUpdateName(e.target.value)}
                          onKeyDown={(e) =>
                            onUpdateName(e, { programId: program.id })
                          }
                          className='w-[200px]'
                        />
                      ) : (
                        program.name
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
