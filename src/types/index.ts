export interface ExcelData {
  headers: string[];
  rows: (string | number | null)[][];
  fileName: string;
  sheetName: string;
  totalRows: number;
  totalCols: number;
}

export interface SortConfig {
  column: number;
  direction: 'asc' | 'desc' | null;
}

export interface ColumnConfig {
  index: number;
  name: string;
  visible: boolean;
  width: number;
}
