import { useCallback, useState, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { CloudUpload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  statusText?: string;
  error: string | null;
}

export function Dropzone({ onFileSelect, isLoading, statusText, error }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      setElapsed(0);
      interval = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="flex items-center justify-center flex-1 p-8 bg-gradient-to-br from-orange-50 via-red-50 to-white">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full max-w-[480px] h-[300px]
          border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer shadow-lg
          ${isDragOver
            ? 'border-orange-400 bg-orange-50 scale-[1.01]'
            : 'border-orange-200 bg-white hover:border-orange-400 hover:shadow-orange-100'
          }
        `}
        onClick={() => !isLoading && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm font-medium text-orange-700">
              {statusText || 'Parsing data...'}
              {isLoading && elapsed > 0 && <span className="ml-1 opacity-70">({elapsed}s)</span>}
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-400 shadow-lg shadow-orange-200">
              {isDragOver ? (
                <FileSpreadsheet className="w-8 h-8 text-white" />
              ) : (
                <CloudUpload className="w-8 h-8 text-white" />
              )}
            </div>
            <p className="text-base font-bold text-foreground mb-1">
              Drop your Excel or CSV file here
            </p>
            <p className="text-xs text-orange-400/80 mb-5">
              Supports .xlsx, .xls, .csv up to 100MB
            </p>
            <button
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200 hover:from-orange-600 hover:to-red-600 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('file-input')?.click();
              }}
            >
              Browse Files
            </button>

            {error && (
              <div className="flex items-center gap-2 mt-4 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
