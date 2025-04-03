import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { TableCell, TableRow } from './ui/table';

export default function TableRowSkeleton({
  columnCount,
}: {
  columnCount: number;
}) {
  return new Array(10).fill('').map((_, index) => (
    <TableRow key={index}>
      {new Array(columnCount).fill('').map((_, index) => (
        <TableCell
          key={index}
          className={cn(
            index === columnCount - 1 && 'grid place-items-center',
          )}>
          <Skeleton className='h-4 w-[100px]' />
        </TableCell>
      ))}
    </TableRow>
  ));
}
