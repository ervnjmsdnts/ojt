import AddCompanyDialog from '@/components/companies/add-company-dialog';
import { EditableTableCell } from '@/components/editable-table-cell';
import PageHeaderText from '@/components/page-header-text';
import Pagination from '@/components/pagination';
import TableRowSkeleton from '@/components/table-row-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getCompaniesWithCount, updateCompanyName } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Archive } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CSVLink } from 'react-csv';

export const Route = createFileRoute('/_authenticated/company')({
  component: RouteComponent,
});

type CompanyWithCount = {
  id: number;
  name: string;
  maleCount: number;
  femaleCount: number;
};

function RouteComponent() {
  const {
    isPending,
    error,
    data: companies,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompaniesWithCount,
  });

  const queryClient = useQueryClient();

  const [filterName, setFilterName] = useState('');

  const [updateName, setUpdateName] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const updateNameMutation = useMutation({ mutationFn: updateCompanyName });

  const onUpdateName = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, data: { companyId: number }) => {
      if (e.key === 'Enter') {
        if (!updateName) {
          return toast.error('Name cannot be empty');
        }
        updateNameMutation.mutate(
          { companyId: data.companyId, name: updateName },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['companies'] });
              setEditingRow(null);
              toast.success('Company name updated successfully');
            },
          },
        );
      }
    },
    [updateName],
  );

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];

    return companies.filter((company) => {
      const nameMatches = company.name
        .toLowerCase()
        .includes(filterName.toLowerCase());

      return nameMatches;
    });
  }, [companies, filterName]);

  if (error) {
    return <p>Error</p>;
  }

  const csvData = useMemo(
    () =>
      filteredCompanies.map((company, index) => ({
        'No.': index + 1,
        'Company Name': company.name,
        'Male Count': company.maleCount,
        'Female Count': company.femaleCount,
        'Total Students': company.totalStudents,
      })),
    [filteredCompanies],
  );

  const { currentItems, paginate, currentPage, totalPages } =
    usePagination<CompanyWithCount>(filteredCompanies);

  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>Company</PageHeaderText>
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Input
            onChange={(e) => setFilterName(e.target.value)}
            className='max-w-xs'
            placeholder='Search by name...'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Button asChild>
            <CSVLink data={csvData} filename='company_data'>
              Export CSV
            </CSVLink>
          </Button>
          <AddCompanyDialog />
        </div>
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Male Count</TableHead>
                <TableHead>Female Count</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={4} />
              ) : (
                currentItems.map((company, index) => (
                  <TableRow key={company.id}>
                    <EditableTableCell
                      editing={editingRow === index}
                      onToggleEditing={() =>
                        setEditingRow(editingRow === index ? null : index)
                      }>
                      {editingRow === index ? (
                        <Input
                          defaultValue={company.name}
                          onChange={(e) => setUpdateName(e.target.value)}
                          onKeyDown={(e) =>
                            onUpdateName(e, { companyId: company.id })
                          }
                          className='w-[200px]'
                        />
                      ) : (
                        company.name
                      )}
                    </EditableTableCell>
                    <TableCell>{company.maleCount}</TableCell>
                    <TableCell>{company.femaleCount}</TableCell>
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
