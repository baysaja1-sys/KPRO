import { Fragment, useRef, useEffect, useState, type UIEvent } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, PanelRightClose, Download, X } from 'lucide-react';
import type { ExcelData, ColumnConfig } from '@/types';
import { RowDetail } from './RowDetail';

interface DataTableProps {
  data: ExcelData;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortConfig: { column: number; direction: 'asc' | 'desc' | null };
  onSort: (columnIndex: number) => void;
  expandedRow: number | null;
  onExpandRow: (index: number) => void;
  visibleColumns: ColumnConfig[];
  processedRows: { row: (string | number | null)[]; originalIndex: number }[];
  onTogglePanel: () => void;
  onExport: () => void;
  fileName: string;
}

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 36;
const VISIBLE_BUFFER = 5;

export function DataTable({
  data,
  searchQuery,
  onSearchChange,
  sortConfig,
  onSort,
  expandedRow,
  onExpandRow,
  visibleColumns,
  processedRows,
  onTogglePanel,
  onExport,
  fileName,
}: DataTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [tableHeight, setTableHeight] = useState(600);

  useEffect(() => {
    const updateHeight = () => {
      if (tableContainerRef.current) {
        setTableHeight(tableContainerRef.current.clientHeight - HEADER_HEIGHT);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Virtual scrolling calculations
  const totalRowHeight = processedRows.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VISIBLE_BUFFER);
  const endIndex = Math.min(
    processedRows.length,
    Math.ceil((scrollTop + tableHeight) / ROW_HEIGHT) + VISIBLE_BUFFER
  );
  const visibleRows = processedRows.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  const getSortIcon = (columnIndex: number) => {
    if (sortConfig.column !== columnIndex || !sortConfig.direction) {
      return <ArrowUpDown className="w-3 h-3 text-[#D1D5DB]" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 text-[#2A9D8F]" />
      : <ArrowDown className="w-3 h-3 text-[#2A9D8F]" />;
  };

  const formatCellValue = (value: string | number | null): string => {
    if (value === null || value === '') return '-';
    const str = String(value);
    if (str.length > 100) return str.substring(0, 100) + '...';
    return str;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between h-[48px] px-4 bg-white border-b border-[#E5E5E5] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-[#6B7280]">
            {processedRows.length.toLocaleString()} records
          </span>
          <span className="text-[11px] text-[#D1D5DB]">|</span>
          <span className="text-[11px] text-[#9CA3AF]" title={fileName}>
            {fileName.length > 40 ? fileName.substring(0, 40) + '...' : fileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search all fields..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="
                w-[240px] h-8 pl-8 pr-3 text-[13px]
                border border-[#E5E5E5] rounded-md
                placeholder:text-[#9CA3AF]
                focus:outline-none focus:border-[#2A9D8F] focus:ring-1 focus:ring-[#2A9D8F]
                transition-colors duration-150
              "
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onExport}
            className="
              flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium
              border border-[#E5E5E5] rounded-md bg-white text-[#374151]
              hover:bg-[#F9FAFB] hover:border-[#D1D5DB]
              transition-colors duration-150
            "
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={onTogglePanel}
            className="
              flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium
              border border-[#E5E5E5] rounded-md bg-white text-[#374151]
              hover:bg-[#F9FAFB] hover:border-[#D1D5DB]
              transition-colors duration-150
            "
            title="Toggle Fields Panel"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
            Fields
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto min-h-0"
        onScroll={handleScroll}
      >
        {processedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
            <p className="text-sm font-medium">No matching records found</p>
            <p className="text-xs mt-1 text-[#9CA3AF]">Try adjusting your search query</p>
          </div>
        ) : (
          <table className="w-full border-collapse" role="table">
            {/* Header */}
            <thead className="sticky top-0 z-10" role="rowgroup">
              <tr role="row">
                <th
                  className="
                    h-[36px] w-[48px] bg-[#F9FAFB] border-b border-[#E5E5E5]
                    text-[11px] font-semibold text-[#9CA3AF] text-center
                    select-none
                  "
                  role="columnheader"
                >
                  #
                </th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.index}
                    className="
                      h-[36px] px-4 bg-[#F9FAFB] border-b border-[#E5E5E5]
                      text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.05em]
                      cursor-pointer select-none whitespace-nowrap
                      hover:text-[#374151] hover:bg-[#F3F4F6]
                      transition-colors duration-150
                    "
                    role="columnheader"
                    onClick={() => onSort(col.index)}
                    style={{ minWidth: col.width }}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.name}
                      {getSortIcon(col.index)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body with virtual scrolling */}
            <tbody role="rowgroup">
              {/* Spacer for scrolled rows */}
              <tr style={{ height: offsetY }}>
                <td colSpan={visibleColumns.length + 1} />
              </tr>

              {visibleRows.map(({ row }, virtualIndex) => {
                const actualIndex = startIndex + virtualIndex;
                const isExpanded = expandedRow === actualIndex;

                return (
                  <Fragment key={actualIndex}>
                    <tr
                      role="row"
                      className={`
                        cursor-pointer transition-colors duration-100
                        ${actualIndex % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}
                        ${isExpanded ? 'bg-[#F0FDFA]' : ''}
                        hover:bg-[#F0FDFA]
                      `}
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => onExpandRow(actualIndex)}
                    >
                      <td
                        className="
                          w-[48px] text-center text-[11px] text-[#9CA3AF]
                          border-b border-[#F3F4F6]
                          select-none
                        "
                        role="cell"
                      >
                        {actualIndex + 1}
                      </td>
                      {visibleColumns.map((col) => (
                        <td
                          key={col.index}
                          className="
                            px-4 text-[13px] text-[#111827]
                            border-b border-[#F3F4F6]
                            truncate max-w-[240px]
                          "
                          role="cell"
                          title={row[col.index] !== null ? String(row[col.index]) : undefined}
                        >
                          <span className={row[col.index] === null || row[col.index] === '' ? 'text-[#D1D5DB]' : ''}>
                            {formatCellValue(row[col.index])}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Expanded row detail */}
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={visibleColumns.length + 1}
                          className="bg-[#F0FDFA] border-b border-[#E5E5E5]"
                        >
                          <RowDetail
                            row={row}
                            columns={visibleColumns}
                            allColumns={data.headers.map((name, index) => ({ index, name }))}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {/* Bottom spacer */}
              <tr style={{ height: totalRowHeight - offsetY - visibleRows.length * ROW_HEIGHT }}>
                <td colSpan={visibleColumns.length + 1} />
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
