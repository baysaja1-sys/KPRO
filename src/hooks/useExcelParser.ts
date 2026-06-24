import { useState, useCallback, useRef } from 'react';
import type { ExcelData } from '@/types';

interface ParseState {
  data: ExcelData | null;
  isLoading: boolean;
  statusText: string;
  error: string | null;
}

export function useExcelParser() {
  const [state, setState] = useState<ParseState>({
    data: null,
    isLoading: false,
    statusText: '',
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);

  const parseFile = useCallback((file: File) => {
    setState({ data: null, isLoading: true, statusText: 'Memulai unggahan...', error: null });

    const MAX_SIZE = 100 * 1024 * 1024; // Increased to 100MB for huge files
    if (file.size > MAX_SIZE) {
      setState({ data: null, isLoading: false, statusText: '', error: 'File size exceeds 100MB limit' });
      return;
    }

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setState({ data: null, isLoading: false, statusText: '', error: 'Unsupported format. Use .xlsx, .xls, or .csv' });
      return;
    }

    // Terminate existing worker if there is one
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    // Create a new Web Worker
    const worker = new Worker(new URL('../workers/excelParserWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, message, data, error } = e.data;
      if (type === 'progress') {
        setState(s => ({ ...s, statusText: message }));
      } else if (type === 'done') {
        setState({ data, isLoading: false, statusText: '', error: null });
        worker.terminate();
        workerRef.current = null;
      } else if (type === 'error') {
        setState({ data: null, isLoading: false, statusText: '', error: `Failed to parse file: ${error}` });
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = () => {
      setState({ data: null, isLoading: false, statusText: '', error: 'Worker crashed unexpectedly' });
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage(file);
  }, []);

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState({ data: null, isLoading: false, statusText: '', error: null });
  }, []);

  return { ...state, parseFile, reset };
}
