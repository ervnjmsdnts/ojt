import AddCompanyDialog from '@/components/companies/add-company-dialog';
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
import { getCompaniesWithCount } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Archive } from 'lucide-react';
import { useMemo, useState } from 'react';

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
  const [filterName, setFilterName] = useState('');

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
        <AddCompanyDialog />
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
                currentItems.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
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
