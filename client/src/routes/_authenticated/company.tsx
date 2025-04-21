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
import {
  getCompaniesWithCount,
  updateCompanyName,
  updateCompanyAddress,
  updateCompanyFile,
  userQueryOptions,
} from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CSVLink } from 'react-csv';
import DoubleClickTooltip from '@/components/double-click-tooltip';
import ViewMemorandumDialog from '@/components/companies/view-memorandum-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { File, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/company')({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    try {
      const data = await queryClient.fetchQuery(userQueryOptions);
      return { user: data };
    } catch (error) {
      return { user: null };
    }
  },
  component: RouteComponent,
});

type CompanyWithCount = {
  id: number;
  name: string;
  maleCount: number;
  address?: string;
  femaleCount: number;
  memorandumUrl: string | null;
};

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const {
    isPending,
    error,
    data: companies,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompaniesWithCount,
  });

  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [filterName, setFilterName] = useState('');

  const [updateName, setUpdateName] = useState('');
  const [updateAddress, setUpdateAddress] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingMemorandum, setEditingMemorandum] = useState<number | null>(
    null,
  );
  const [editingAddress, setEditingAddress] = useState<number | null>(null);

  const updateNameMutation = useMutation({ mutationFn: updateCompanyName });
  const updateFileMutation = useMutation({ mutationFn: updateCompanyFile });
  const updateAddressMutation = useMutation({
    mutationFn: updateCompanyAddress,
  });

  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    companyId: number,
  ) {
    e.preventDefault();
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    updateFileMutation.mutate(
      { companyId, file: selectedFile },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['companies'] });
          toast.success('Memorandum updated successfully');
        },
        onError: (error) => {
          console.log(error);
          toast.error('Failed to update memorandum');
        },
        onSettled: () => {
          setEditingMemorandum(null);
          e.target.value = '';
        },
      },
    );
  }

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

  const onUpdateAddress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, data: { companyId: number }) => {
      if (e.key === 'Enter') {
        if (!updateAddress) {
          return toast.error('Address cannot be empty');
        }
        updateAddressMutation.mutate(
          { companyId: data.companyId, address: updateAddress },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['companies'] });
              setEditingAddress(null);
              toast.success('Company address updated successfully');
            },
          },
        );
      }
    },
    [updateAddress],
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
    usePagination<CompanyWithCount>(
      filteredCompanies.map((company) => ({
        ...company,
        address: company.address ?? undefined,
      })),
    );

  const isAdminOrCoordinator = user?.role !== 'student';

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
        {isAdminOrCoordinator && (
          <div className='flex items-center gap-2'>
            <Button asChild>
              <CSVLink data={csvData} filename='company_data'>
                Export CSV
              </CSVLink>
            </Button>
            <AddCompanyDialog />
          </div>
        )}
      </div>
      <div className='flex flex-1 flex-col gap-4'>
        <div className='border h-full rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {isAdminOrCoordinator ? (
                    <DoubleClickTooltip text='Name' />
                  ) : (
                    'Name'
                  )}
                </TableHead>
                <TableHead>
                  {isAdminOrCoordinator ? (
                    <DoubleClickTooltip text='Address' />
                  ) : (
                    'Address'
                  )}
                </TableHead>
                <TableHead>
                  {isAdminOrCoordinator ? (
                    <DoubleClickTooltip text='Memorandum' />
                  ) : (
                    'Memorandum'
                  )}
                </TableHead>
                {isAdminOrCoordinator && (
                  <>
                    <TableHead>Male Count</TableHead>
                    <TableHead>Female Count</TableHead>
                  </>
                )}
                {/* <TableHead className='text-center'>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRowSkeleton columnCount={4} />
              ) : (
                currentItems.map((company, index) => (
                  <TableRow key={company.id}>
                    {isAdminOrCoordinator ? (
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
                    ) : (
                      <TableCell>{company.name}</TableCell>
                    )}
                    {isAdminOrCoordinator ? (
                      <EditableTableCell
                        editing={editingAddress === index}
                        onToggleEditing={() =>
                          setEditingAddress(
                            editingAddress === index ? null : index,
                          )
                        }>
                        {editingAddress === index ? (
                          <Input
                            defaultValue={company.address}
                            onChange={(e) => setUpdateAddress(e.target.value)}
                            onKeyDown={(e) =>
                              onUpdateAddress(e, { companyId: company.id })
                            }
                          />
                        ) : (
                          company.address
                        )}
                      </EditableTableCell>
                    ) : (
                      <TableCell>{company.address}</TableCell>
                    )}
                    {isAdminOrCoordinator ? (
                      <EditableTableCell
                        editing={editingMemorandum === index}
                        onToggleEditing={() =>
                          setEditingMemorandum(
                            editingMemorandum === index ? null : index,
                          )
                        }>
                        {editingMemorandum === index ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                disabled={updateFileMutation.isPending}
                                onClick={handleFileSelect}
                                size='icon'>
                                {updateFileMutation.isPending ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <File />
                                )}
                                <Input
                                  type='file'
                                  ref={fileInputRef}
                                  accept='.pdf,application/pdf'
                                  className='hidden'
                                  onChange={(e) =>
                                    handleFileChange(e, company.id)
                                  }
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Change File</TooltipContent>
                          </Tooltip>
                        ) : (
                          <ViewMemorandumDialog
                            memorandumUrl={company.memorandumUrl}
                          />
                        )}
                      </EditableTableCell>
                    ) : (
                      <TableCell>
                        <ViewMemorandumDialog
                          memorandumUrl={company.memorandumUrl}
                        />
                      </TableCell>
                    )}
                    {isAdminOrCoordinator && (
                      <>
                        <TableCell>{company.maleCount}</TableCell>
                        <TableCell>{company.femaleCount}</TableCell>
                      </>
                    )}
                    {/* <TableCell>
                      <div className='flex justify-center'>
                        <Button variant='destructive' size='icon'>
                          <Archive />
                        </Button>
                      </div>
                    </TableCell> */}
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
