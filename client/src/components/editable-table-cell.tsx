import React, { useEffect, useRef } from 'react';
import { TableCell } from './ui/table';
import { cn } from '@/lib/utils';

interface EditableTableCellProps {
  editing: boolean;
  onToggleEditing: () => void;
  children: React.ReactNode;
}

export function EditableTableCell({
  editing,
  onToggleEditing,
  children,
}: EditableTableCellProps) {
  const ref = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideCell = ref.current?.contains(target);
      const isInsideDropdown = !!(target as HTMLElement).closest(
        '[data-select-dropdown]',
      );

      if (!isInsideCell && !isInsideDropdown && editing) {
        onToggleEditing();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editing, onToggleEditing]);

  return (
    <TableCell
      className={cn(editing && 'w-[200px]')}
      ref={ref}
      onDoubleClick={onToggleEditing}>
      {children}
    </TableCell>
  );
}
