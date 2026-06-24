import { useState, useMemo, useCallback } from 'react';
import type { ExcelData, SortConfig, ColumnConfig } from '@/types';

export function useTableData(data: ExcelData | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: -1, direction: null });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [columnOrder, setColumnOrder] = useState<number[]>([]);

  // Initialize column configs
  const columnConfigs = useMemo<ColumnConfig[]>(() => {
    if (!data) return [];
    const order = columnOrder.length === data.headers.length ? columnOrder : data.headers.map((_, i) => i);
    return order.map((originalIndex) => ({
      index: originalIndex,
      name: data.headers[originalIndex],
      visible: !hiddenColumns.has(originalIndex),
      width: Math.min(Math.max(String(data.headers[originalIndex]).length * 10, 80), 240),
    }));
  }, [data, hiddenColumns, columnOrder]);

  const visibleColumns = useMemo(() =>
    columnConfigs.filter(col => col.visible),
    [columnConfigs]
  );

  // Filter and sort rows
  const processedRows = useMemo(() => {
    if (!data) return [];

    let rows = data.rows.map((row, index) => ({ row, originalIndex: index }));

    // Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      rows = rows.filter(({ row }) =>
        row.some(cell =>
          cell !== null && String(cell).toLowerCase().includes(query)
        )
      );
    }

    // Sort
    if (sortConfig.column >= 0 && sortConfig.direction) {
      rows.sort((a, b) => {
        const aVal = a.row[sortConfig.column];
        const bVal = b.row[sortConfig.column];

        if (aVal === null || aVal === '') return 1;
        if (bVal === null || bVal === '') return -1;

        const aStr = String(aVal);
        const bStr = String(bVal);

        // Try numeric comparison
        const aNum = parseFloat(aStr);
        const bNum = parseFloat(bStr);

        if (!isNaN(aNum) && !isNaN(bNum) && aStr === String(aNum) && bStr === String(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Date comparison
        const aDate = new Date(aStr);
        const bDate = new Date(bStr);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime()) && aStr.includes('-')) {
          return sortConfig.direction === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        // String comparison
        return sortConfig.direction === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return rows;
  }, [data, searchQuery, sortConfig]);

  const toggleSort = useCallback((columnIndex: number) => {
    setSortConfig(prev => {
      if (prev.column === columnIndex) {
        if (prev.direction === 'asc') return { column: columnIndex, direction: 'desc' };
        if (prev.direction === 'desc') return { column: -1, direction: null };
        return { column: columnIndex, direction: 'asc' };
      }
      return { column: columnIndex, direction: 'asc' };
    });
  }, []);

  const toggleColumnVisibility = useCallback((columnIndex: number) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnIndex)) {
        next.delete(columnIndex);
      } else {
        next.add(columnIndex);
      }
      return next;
    });
  }, []);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumnOrder(prev => {
      const current = prev.length > 0 ? prev : (data?.headers.map((_, i) => i) || []);
      const newOrder = [...current];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      return newOrder;
    });
  }, [data]);

  const expandRow = useCallback((index: number) => {
    setExpandedRow(prev => prev === index ? null : index);
  }, []);

  const exportToCSV = useCallback(() => {
    if (!data) return;

    const visibleHeaders = visibleColumns.map(col => col.name);
    const csvRows = [visibleHeaders.join(',')];

    processedRows.forEach(({ row }) => {
      const values = visibleColumns.map(col => {
        const val = row[col.index];
        if (val === null || val === '') return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = data.fileName.replace(/\.[^.]+$/, '') + '_filtered.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }, [data, visibleColumns, processedRows]);

  return {
    searchQuery,
    setSearchQuery,
    sortConfig,
    toggleSort,
    expandedRow,
    expandRow,
    hiddenColumns,
    toggleColumnVisibility,
    columnConfigs,
    visibleColumns,
    processedRows,
    moveColumn,
    exportToCSV,
  };
}
