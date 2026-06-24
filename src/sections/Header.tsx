import { Table2, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
}

export function Header({ onReset, hasData }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-[48px] px-4 bg-white border-b border-[#E5E5E5] flex-shrink-0 z-20">
      <div className="flex items-center gap-2.5">
        <Table2 className="w-5 h-5 text-[#2A9D8F]" />
        <h1 className="text-[15px] font-semibold text-[#2D2D2D] tracking-tight">
          SheetView
        </h1>
        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded">
          Excel Reader
        </span>
      </div>

      {hasData && (
        <button
          onClick={onReset}
          className="
            flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium
            rounded-md text-[#6B7280]
            hover:bg-[#F3F4F6] hover:text-[#374151]
            transition-colors duration-150
          "
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New File
        </button>
      )}
    </header>
  );
}
