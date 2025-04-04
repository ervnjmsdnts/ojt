import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { TableCell, TableHead, TableRow } from './ui/table';

export default function TableRowSkeleton({
  columnCount,
  isHeader = false,
  rowCount = 10,
}: {
  columnCount: number;
  isHeader?: boolean;
  rowCount?: number;
}) {
  if (isHeader) {
    return (
      <TableRow>
        {new Array(columnCount).fill('').map((_, i) => (
          <TableHead key={i}>
            <Skeleton className='h-4 w-[100px]' />
          </TableHead>
        ))}
      </TableRow>
    );
  }

  return new Array(rowCount).fill('').map((_, index) => (
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
