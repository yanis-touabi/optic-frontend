import * as React from 'react';
import { cn } from '@/lib/utils';
import { TableHead } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ColumnType, SortOrder } from '@/hooks/use-sortable-table';

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Field name sent to the server (must match an allowed sort field). */
  field: string;
  /** Data type of the column — determines default sort direction. */
  type: ColumnType;
  /** Current sort direction for this field, or undefined if not active. */
  direction: SortOrder | undefined;
  /** Called when the user clicks this header. */
  onSort: (field: string, type: ColumnType) => void;
  children: React.ReactNode;
}

/**
 * A `<th>` that shows the current sort direction and triggers a sort on click.
 *
 * Visual states:
 *  - Inactive column  → neutral double-arrow icon (muted)
 *  - Active column    → up or down arrow in the primary colour
 */
export function SortableTableHead({
  field,
  type,
  direction,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps) {
  const isActive = direction !== undefined;

  const Icon = isActive
    ? direction === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={cn('select-none', className)} {...props}>
      <button
        type="button"
        onClick={() => onSort(field, type)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded px-1 py-0.5 -mx-1',
          'transition-colors duration-150',
          'hover:bg-muted/60 hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground font-medium',
        )}
      >
        {children}
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-all duration-200',
            isActive ? 'opacity-100 text-primary' : 'opacity-40',
          )}
        />
      </button>
    </TableHead>
  );
}
