import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from './ui/button';

type PaginationType = {
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  paginate,
}: PaginationType) {
  return (
    <div className='flex items-center gap-8'>
      <span className='text-sm'>
        Page {currentPage} of {totalPages}
      </span>
      <div className='flex items-center gap-2'>
        <Button
          size='icon'
          disabled={currentPage === 1}
          onClick={() => paginate(1)}
          variant='outline'>
          <ChevronsLeft className='w-4 h-4' />
        </Button>
        <Button
          size='icon'
          disabled={currentPage === 1}
          onClick={() => paginate(currentPage - 1)}
          variant='outline'>
          <ChevronLeft className='w-4 h-4' />
        </Button>
        <Button
          size='icon'
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => paginate(currentPage + 1)}
          variant='outline'>
          <ChevronRight className='w-4 h-4' />
        </Button>
        <Button
          size='icon'
          variant='outline'
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => paginate(totalPages)}>
          <ChevronsRight className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
