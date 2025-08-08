/**
 * AccessibleTable component with comprehensive WCAG 2.1 AA compliance
 * Enhanced table with keyboard navigation, sorting, and screen reader support
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  useAccessibilityAnnouncements,
  useAccessibilityFocus 
} from "@/contexts/accessibility-context";
import { 
  handleTableNavigation, 
  handleArrowNavigation,
  KEYBOARD_KEYS 
} from "@/lib/accessibility/keyboard-navigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | 'none';
}

interface AccessibleTableProps {
  children: React.ReactNode;
  /**
   * Caption for the table (required for accessibility)
   */
  caption: string;
  /**
   * Additional description for screen readers
   */
  description?: string;
  /**
   * Whether the table is sortable
   */
  sortable?: boolean;
  /**
   * Current sort configuration
   */
  sortConfig?: SortConfig;
  /**
   * Callback when sort changes
   */
  onSortChange?: (config: SortConfig) => void;
  /**
   * Whether to enable keyboard navigation
   */
  keyboardNavigation?: boolean;
  /**
   * Summary for complex tables
   */
  summary?: string;
}

export function AccessibleTable({
  children,
  caption,
  description,
  sortable = false,
  sortConfig,
  onSortChange,
  keyboardNavigation = false,
  summary,
  ...props
}: AccessibleTableProps) {
  const { announce } = useAccessibilityAnnouncements();
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [currentCell, setCurrentCell] = React.useState({ row: 0, col: 0 });
  const [focusedCell, setFocusedCell] = React.useState<HTMLElement | null>(null);
  
  const captionId = React.useId();
  const descriptionId = React.useId();

  // Handle keyboard navigation within table
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (!keyboardNavigation || !tableRef.current) return;

    const cells = Array.from(tableRef.current.querySelectorAll('td, th'));
    const rows = Array.from(tableRef.current.querySelectorAll('tr'));
    const currentRow = rows[currentCell.row];
    const cellsInRow = currentRow ? Array.from(currentRow.querySelectorAll('td, th')) : [];

    const totalRows = rows.length;
    const totalCols = cellsInRow.length;

    const handled = handleTableNavigation(
      event.nativeEvent,
      currentCell.row,
      currentCell.col,
      totalRows,
      totalCols,
      (newRow, newCol) => {
        setCurrentCell({ row: newRow, col: newCol });
        
        // Focus the new cell
        const newRowElement = rows[newRow];
        if (newRowElement) {
          const newCellElement = newRowElement.querySelectorAll('td, th')[newCol] as HTMLElement;
          if (newCellElement) {
            newCellElement.focus();
            setFocusedCell(newCellElement);
            
            // Announce the cell content
            const cellText = newCellElement.textContent || '';
            const rowHeader = newRowElement.querySelector('th')?.textContent || '';
            const colHeader = tableRef.current?.querySelector(`thead tr th:nth-child(${newCol + 1})`)?.textContent || '';
            
            announce(`${colHeader || `Column ${newCol + 1}`}, ${rowHeader || `Row ${newRow + 1}`}: ${cellText}`, 'polite');
          }
        }
      }
    );

    if (handled) {
      event.preventDefault();
    }
  }, [keyboardNavigation, currentCell, announce]);

  return (
    <div className="relative">
      <Table
        ref={tableRef}
        onKeyDown={handleKeyDown}
        aria-labelledby={captionId}
        aria-describedby={[description && descriptionId, summary && `${captionId}-summary`].filter(Boolean).join(' ')}
        role="table"
        {...props}
      >
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        
        {summary && (
          <caption id={`${captionId}-summary`} className="sr-only">
            {summary}
          </caption>
        )}
        
        {children}
      </Table>
      
      {description && (
        <div id={descriptionId} className="sr-only">
          {description}
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced table header with sorting capabilities
 */
interface AccessibleTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function AccessibleTableHeader({ children, className }: AccessibleTableHeaderProps) {
  return (
    <TableHeader className={className}>
      {children}
    </TableHeader>
  );
}

/**
 * Enhanced table body
 */
interface AccessibleTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function AccessibleTableBody({ children, className }: AccessibleTableBodyProps) {
  return (
    <TableBody className={className}>
      {children}
    </TableBody>
  );
}

/**
 * Enhanced table row with proper semantics
 */
interface AccessibleTableRowProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Whether this row is selected
   */
  selected?: boolean;
  /**
   * Row index for accessibility
   */
  rowIndex?: number;
}

export function AccessibleTableRow({ 
  children, 
  className, 
  selected = false,
  rowIndex
}: AccessibleTableRowProps) {
  return (
    <TableRow 
      className={cn(
        selected && "bg-muted/50",
        className
      )}
      aria-selected={selected}
      aria-rowindex={rowIndex}
    >
      {children}
    </TableRow>
  );
}

/**
 * Enhanced sortable table header cell
 */
interface AccessibleTableHeadProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Whether this column is sortable
   */
  sortable?: boolean;
  /**
   * Sort key for this column
   */
  sortKey?: string;
  /**
   * Current sort direction
   */
  sortDirection?: 'asc' | 'desc' | 'none';
  /**
   * Callback when sort is requested
   */
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  /**
   * Scope for header cells
   */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  /**
   * Column span
   */
  colSpan?: number;
  /**
   * Row span
   */
  rowSpan?: number;
}

export function AccessibleTableHead({
  children,
  className,
  sortable = false,
  sortKey,
  sortDirection = 'none',
  onSort,
  scope = 'col',
  colSpan,
  rowSpan
}: AccessibleTableHeadProps) {
  const { announce } = useAccessibilityAnnouncements();
  
  const handleSort = React.useCallback(() => {
    if (!sortable || !sortKey || !onSort) return;
    
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(sortKey, newDirection);
    
    announce(`Table sorted by ${children} ${newDirection === 'asc' ? 'ascending' : 'descending'}`, 'polite');
  }, [sortable, sortKey, sortDirection, onSort, children, announce]);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (sortable && (event.key === KEYBOARD_KEYS.ENTER || event.key === KEYBOARD_KEYS.SPACE)) {
      event.preventDefault();
      handleSort();
    }
  }, [sortable, handleSort]);

  const getSortIcon = () => {
    if (!sortable) return null;
    
    switch (sortDirection) {
      case 'asc':
        return <ChevronUp className="ml-2 h-4 w-4" aria-hidden="true" />;
      case 'desc':
        return <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />;
      default:
        return <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />;
    }
  };

  const getSortLabel = () => {
    if (!sortable) return '';
    
    switch (sortDirection) {
      case 'asc':
        return 'sorted ascending';
      case 'desc':
        return 'sorted descending';
      default:
        return 'not sorted';
    }
  };

  if (sortable) {
    return (
      <TableHead
        className={cn(
          "cursor-pointer select-none hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        scope={scope}
        colSpan={colSpan}
        rowSpan={rowSpan}
        tabIndex={0}
        role="columnheader button"
        aria-sort={sortDirection === 'none' ? 'none' : sortDirection}
        aria-label={`${children}, ${getSortLabel()}, activate to sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
        onClick={handleSort}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center">
          {children}
          {getSortIcon()}
        </div>
      </TableHead>
    );
  }

  return (
    <TableHead
      className={className}
      scope={scope}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </TableHead>
  );
}

/**
 * Enhanced table cell with proper semantics
 */
interface AccessibleTableCellProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Headers this cell is associated with
   */
  headers?: string;
  /**
   * Scope for header cells used as row headers
   */
  scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
  /**
   * Column span
   */
  colSpan?: number;
  /**
   * Row span
   */
  rowSpan?: number;
  /**
   * Whether this cell contains numeric data
   */
  numeric?: boolean;
}

export function AccessibleTableCell({
  children,
  className,
  headers,
  scope,
  colSpan,
  rowSpan,
  numeric = false
}: AccessibleTableCellProps) {
  return (
    <TableCell
      className={cn(
        numeric && "text-right tabular-nums",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        className
      )}
      headers={headers}
      scope={scope}
      colSpan={colSpan}
      rowSpan={rowSpan}
      tabIndex={-1} // Allow programmatic focus but not tab navigation
    >
      {children}
    </TableCell>
  );
}

/**
 * Table with built-in sorting functionality
 */
interface SortableTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    sortable?: boolean;
    numeric?: boolean;
    render?: (value: T[keyof T], item: T) => React.ReactNode;
  }>;
  caption: string;
  description?: string;
  onRowSelect?: (item: T, index: number) => void;
  selectedRows?: number[];
}

export function SortableTable<T>({
  data,
  columns,
  caption,
  description,
  onRowSelect,
  selectedRows = []
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: '',
    direction: 'none'
  });

  const sortedData = React.useMemo(() => {
    if (sortConfig.direction === 'none') return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = React.useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  }, []);

  return (
    <AccessibleTable
      caption={caption}
      description={description}
      sortable
      keyboardNavigation
    >
      <AccessibleTableHeader>
        <AccessibleTableRow>
          {columns.map((column) => (
            <AccessibleTableHead
              key={String(column.key)}
              sortable={column.sortable}
              sortKey={String(column.key)}
              sortDirection={sortConfig.key === column.key ? sortConfig.direction : 'none'}
              onSort={handleSort}
            >
              {column.header}
            </AccessibleTableHead>
          ))}
        </AccessibleTableRow>
      </AccessibleTableHeader>
      
      <AccessibleTableBody>
        {sortedData.map((item, index) => (
          <AccessibleTableRow
            key={index}
            selected={selectedRows.includes(index)}
            rowIndex={index + 1}
          >
            {columns.map((column) => (
              <AccessibleTableCell
                key={String(column.key)}
                numeric={column.numeric}
              >
                {column.render 
                  ? column.render(item[column.key], item)
                  : String(item[column.key])
                }
              </AccessibleTableCell>
            ))}
          </AccessibleTableRow>
        ))}
      </AccessibleTableBody>
    </AccessibleTable>
  );
}