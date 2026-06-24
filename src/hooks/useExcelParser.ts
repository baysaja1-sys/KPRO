import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { ExcelData } from '@/types';

interface ParseState {
  data: ExcelData | null;
  isLoading: boolean;
  error: string | null;
}

export function useExcelParser() {
  const [state, setState] = useState<ParseState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const parseFile = useCallback((file: File) => {
    setState({ data: null, isLoading: true, error: null });

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setState({ data: null, isLoading: false, error: 'File size exceeds 10MB limit' });
      return;
    }

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setState({ data: null, isLoading: false, error: 'Unsupported format. Use .xlsx, .xls, or .csv' });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const binaryStr = e.target?.result;
        if (!binaryStr) {
          setState({ data: null, isLoading: false, error: 'Failed to read file' });
          return;
        }

        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData: (string | number | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          raw: false,
        });

        if (jsonData.length === 0) {
          setState({ data: null, isLoading: false, error: 'File is empty' });
          return;
        }

        // Find first non-empty row as header
        let headerRowIndex = 0;
        while (headerRowIndex < jsonData.length) {
          const row = jsonData[headerRowIndex];
          if (row && row.some(cell => cell !== null && cell !== '')) {
            break;
          }
          headerRowIndex++;
        }

        if (headerRowIndex >= jsonData.length) {
          setState({ data: null, isLoading: false, error: 'No valid data found in file' });
          return;
        }

        const headers = jsonData[headerRowIndex].map((h, i) => {
          if (h !== null && h !== '') return String(h).trim();
          return `Column ${i + 1}`;
        });

        const rows = jsonData.slice(headerRowIndex + 1).filter(row =>
          row.some(cell => cell !== null && cell !== '')
        );

        const excelData: ExcelData = {
          headers,
          rows,
          fileName: file.name,
          sheetName: firstSheetName,
          totalRows: rows.length,
          totalCols: headers.length,
        };

        setState({ data: excelData, isLoading: false, error: null });
      } catch (err) {
        setState({
          data: null,
          isLoading: false,
          error: `Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    };

    reader.onerror = () => {
      setState({ data: null, isLoading: false, error: 'Failed to read file' });
    };

    reader.readAsBinaryString(file);
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, parseFile, reset };
}
