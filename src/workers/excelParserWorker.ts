import * as XLSX from 'xlsx';
import type { ExcelData } from '../types';

self.onmessage = async (e: MessageEvent) => {
  try {
    const file = e.data as File;
    const arrayBuffer = await file.arrayBuffer();
    
    postMessage({ type: 'progress', message: 'Membaca file Excel...' });

    let jsonData: (string | number | null)[][] = [];
    let firstSheetName = 'Sheet1';

    try {
      // Fast bypass for HTML disguised as XLS
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 1024));
      let headerStr = '';
      for (let i = 0; i < headerBytes.length; i++) {
        headerStr += String.fromCharCode(headerBytes[i]);
      }
      
      const isHtml = headerStr.toLowerCase().includes('<html') || 
                     headerStr.toLowerCase().includes('<table') || 
                     headerStr.toLowerCase().includes('<style');

      if (isHtml) {
        postMessage({ type: 'progress', message: 'Membaca file HTML berukuran sangat besar (format lama)...' });
        
        // Convert ArrayBuffer to string manually
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        
        postMessage({ type: 'progress', message: 'Mengekstrak baris data HTML secara cepat...' });
        const rowsText = text.split(/<tr[^>]*>/i);
        
        for (let i = 1; i < rowsText.length; i++) {
          const rowText = rowsText[i];
          const cellMatches = [...rowText.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
          const rowData = cellMatches.map(m => {
            let cellText = m[1].replace(/<[^>]+>/g, '').trim();
            cellText = cellText.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
            return cellText;
          });
          if (rowData.length > 0) {
            jsonData.push(rowData);
          }
          if (i % 5000 === 0) {
            postMessage({ type: 'progress', message: `Mengekstrak data... (${i} baris)` });
          }
        }
      } else {
        // Try parsing normally as Excel
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        postMessage({ type: 'progress', message: 'Mengekstrak baris data Excel...' });
        jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          raw: false,
        });
      }
    } catch (err: any) {
      throw err;
    }

    postMessage({ type: 'progress', message: `Mengekstrak ${jsonData.length} baris data...` });

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

    postMessage({ type: 'progress', message: `Memfilter ${jsonData.length} baris (menghapus baris kosong)...` });

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
      
      // Every 5000 rows, yield progress to keep the UI informed
      if (i % 5000 === 0) {
        postMessage({ type: 'progress', message: `Menyaring data... (${i} dari ${jsonData.length} baris)` });
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
