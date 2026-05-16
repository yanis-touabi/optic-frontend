import { useState, useCallback } from 'react';

export type SortOrder = 'asc' | 'desc';
export type ColumnType = 'text' | 'number' | 'date';

/**
 * Default direction for the first click on a column, based on its data type.
 *  - date   → desc (newest first)
 *  - number → desc (highest first)
 *  - text   → asc  (A → Z)
 */
function defaultDirection(type: ColumnType): SortOrder {
  return type === 'text' ? 'asc' : 'desc';
}

export interface SortState {
  sort: string | undefined;
  order: SortOrder;
}

export interface UseSortableTableReturn extends SortState {
  /** Call when a header is clicked. */
  onSort: (field: string, type: ColumnType) => void;
  /** Returns the current sort direction for a column, or undefined if not active. */
  directionFor: (field: string) => SortOrder | undefined;
}

/**
 * Manages column-sort state for a server-side paginated table.
 *
 * @param defaultSort  - Field to sort by on mount (optional)
 * @param defaultOrder - Direction to use for the default sort (optional)
 */
export function useSortableTable(
  defaultSort?: string,
  defaultOrder?: SortOrder,
): UseSortableTableReturn {
  const [state, setState] = useState<SortState>({
    sort: defaultSort,
    order: defaultOrder ?? 'desc',
  });

  const onSort = useCallback((field: string, type: ColumnType) => {
    setState((prev) => {
      if (prev.sort === field) {
        // Same column → toggle direction
        return { sort: field, order: prev.order === 'asc' ? 'desc' : 'asc' };
      }
      // New column → use type-based default direction
      return { sort: field, order: defaultDirection(type) };
    });
  }, []);

  const directionFor = useCallback(
    (field: string): SortOrder | undefined => {
      return state.sort === field ? state.order : undefined;
    },
    [state],
  );

  return { ...state, onSort, directionFor };
}
