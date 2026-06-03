import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  searchPlaceholder?: string;
  loading?: boolean;
  onRowSelectionChange?: (rows: T[]) => void;
  pageSize?: number;
}

export default function DataTable<T extends object>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  loading = false,
  onRowSelectionChange,
  pageSize = 20,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(next);
      if (onRowSelectionChange) {
        const selectedRows = Object.keys(next)
          .filter((k) => next[k])
          .map((k) => data[Number(k)]);
        onRowSelectionChange(selectedRows);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
    enableRowSelection: true,
  });

  const th: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 500,
    color: '#52525b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #27272a',
    whiteSpace: 'nowrap',
    background: '#09090b',
  };

  const td: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 14,
    color: '#fafafa',
    borderBottom: '1px solid #1f1f22',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#18181b', borderRadius: 6, border: '1px solid #27272a', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #27272a', background: '#09090b' }}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          style={{
            width: '100%', maxWidth: 320, background: '#27272a', border: '1px solid #3f3f46',
            borderRadius: 4, color: '#fafafa', padding: '7px 12px', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} style={{ ...th, cursor: header.column.getCanSort() ? 'pointer' : 'default', userSelect: 'none' }}
                    onClick={header.column.getToggleSortingHandler()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc' ? <ChevronUp size={13} color="#d4a017" /> :
                        header.column.getIsSorted() === 'desc' ? <ChevronDown size={13} color="#d4a017" /> :
                        <ChevronsUpDown size={13} color="#3f3f46" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} style={{ ...td, textAlign: 'center', color: '#52525b', padding: '40px 0' }}>Loading...</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ ...td, textAlign: 'center', color: '#52525b', padding: '40px 0' }}>No records found</td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={{ background: row.getIsSelected() ? 'rgba(212,160,23,0.05)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!row.getIsSelected()) (e.currentTarget as HTMLTableRowElement).style.background = '#1f1f22'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = row.getIsSelected() ? 'rgba(212,160,23,0.05)' : 'transparent'; }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={td}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid #27272a', background: '#09090b' }}>
        <span style={{ fontSize: 12, color: '#52525b' }}>
          {table.getFilteredRowModel().rows.length} records
          {Object.keys(rowSelection).length > 0 && ` · ${Object.keys(rowSelection).length} selected`}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: table.getCanPreviousPage() ? '#fafafa' : '#52525b', cursor: table.getCanPreviousPage() ? 'pointer' : 'not-allowed' }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, color: '#a1a1aa', padding: '0 8px' }}>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: table.getCanNextPage() ? '#fafafa' : '#52525b', cursor: table.getCanNextPage() ? 'pointer' : 'not-allowed' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
