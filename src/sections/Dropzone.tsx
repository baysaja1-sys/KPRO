import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { CloudUpload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

export function Dropzone({ onFileSelect, isLoading, error }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

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
    <div className="flex items-center justify-center flex-1 p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full max-w-[480px] h-[280px]
          border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
          ${isDragOver
            ? 'border-[#2A9D8F] bg-[#F0FDFA]'
            : 'border-[#D1D5DB] bg-white hover:border-[#9CA3AF]'
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
            <Loader2 className="w-8 h-8 text-[#2A9D8F] animate-spin" />
            <p className="text-sm font-medium text-[#374151]">Parsing data...</p>
          </div>
        ) : (
          <>
            {isDragOver ? (
              <FileSpreadsheet className="w-10 h-10 text-[#2A9D8F] mb-4" />
            ) : (
              <CloudUpload className="w-10 h-10 text-[#9CA3AF] mb-4" />
            )}
            <p className="text-sm font-medium text-[#374151] mb-1">
              Drop your Excel or CSV file here
            </p>
            <p className="text-xs text-[#9CA3AF] mb-5">
              Supports .xlsx, .xls, .csv up to 10MB
            </p>
            <button
              className="
                px-4 py-1.5 text-xs font-medium rounded-md
                border border-[#D1D5DB] bg-white text-[#374151]
                hover:bg-[#F9FAFB] hover:border-[#9CA3AF]
                transition-colors duration-150
              "
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
