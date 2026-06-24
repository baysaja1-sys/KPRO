import * as XLSX from 'xlsx';
import type { ExcelData } from '../types';

self.onmessage = async (e: MessageEvent) => {
  try {
    const file = e.data as File;
    const arrayBuffer = await file.arrayBuffer();
    
    postMessage({ type: 'progress', message: 'Membaca file Excel...' });

    // Read the workbook
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    postMessage({ type: 'progress', message: 'Mengekstrak baris data...' });

    const jsonData: (string | number | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: false,
    });

    if (jsonData.length === 0) {
      throw new Error('File is empty');
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
      throw new Error('No valid data found in file');
    }

    postMessage({ type: 'progress', message: 'Memproses ribuan baris...' });

    const headers = Array.from({ length: jsonData[headerRowIndex].length }, (_, i) => {
      const h = jsonData[headerRowIndex][i];
      if (h !== null && h !== undefined && h !== '') return String(h).trim();
      return `Column ${i + 1}`;
    });

    // Optimize row filtering for performance
    const rows = [];
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      let hasData = false;
      for (let j = 0; j < row.length; j++) {
        if (row[j] !== null && row[j] !== '') {
          hasData = true;
          break;
        }
      }
      if (hasData) rows.push(row);
      
      // Every 10000 rows, yield progress to keep the UI informed
      if (i % 10000 === 0) {
        postMessage({ type: 'progress', message: `Memproses data... (${i} baris)` });
      }
    }

    const excelData: ExcelData = {
      headers,
      rows,
      fileName: file.name,
      sheetName: firstSheetName,
      totalRows: rows.length,
      totalCols: headers.length,
    };

    postMessage({ type: 'progress', message: 'Menyelesaikan...' });
    postMessage({ type: 'done', data: excelData });
  } catch (err) {
    postMessage({ type: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
  }
};
