import { X, GripVertical, Eye, EyeOff } from 'lucide-react';
import type { ColumnConfig } from '@/types';

interface FieldPanelProps {
  columns: ColumnConfig[];
  onToggleColumn: (index: number) => void;
  onClose: () => void;
  hiddenCount: number;
  totalCount: number;
}

export function FieldPanel({ columns, onToggleColumn, onClose, hiddenCount, totalCount }: FieldPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E5E5E5] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between h-[48px] px-4 border-b border-[#E5E5E5] flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-[#111827]">Fields</h3>
          <span className="text-[11px] text-[#9CA3AF]">
            {totalCount - hiddenCount} of {totalCount} shown
          </span>
        </div>
        <button
          onClick={onClose}
          className="
            p-1 rounded-md text-[#9CA3AF]
            hover:text-[#374151] hover:bg-[#F3F4F6]
            transition-colors duration-150
          "
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Show/Hide All */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#F3F4F6]">
        <button
          onClick={() => {
            columns.forEach(col => {
              if (!col.visible) onToggleColumn(col.index);
            });
          }}
          className="text-[11px] font-medium text-[#2A9D8F] hover:text-[#1F7A70] transition-colors"
        >
          Show all
        </button>
        <span className="text-[#D1D5DB]">|</span>
        <button
          onClick={() => {
            columns.forEach(col => {
              if (col.visible) onToggleColumn(col.index);
            });
          }}
          className="text-[11px] font-medium text-[#6B7280] hover:text-[#374151] transition-colors"
        >
          Hide all
        </button>
      </div>

      {/* Field list */}
      <div className="flex-1 overflow-y-auto">
        {columns.map((col) => (
          <div
            key={col.index}
            className={`
              flex items-center gap-2 h-[36px] px-4
              hover:bg-[#F9FAFB]
              transition-colors duration-100
              ${!col.visible ? 'opacity-50' : ''}
            `}
          >
            <GripVertical className="w-3 h-3 text-[#D1D5DB] flex-shrink-0 cursor-grab" />

            <button
              onClick={() => onToggleColumn(col.index)}
              className={`
                flex items-center justify-center w-5 h-5 rounded flex-shrink-0
                transition-colors duration-150
                ${col.visible
                  ? 'text-[#2A9D8F] hover:text-[#1F7A70]'
                  : 'text-[#D1D5DB] hover:text-[#9CA3AF]'
                }
              `}
            >
              {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <span
              className={`
                text-[13px] truncate flex-1 min-w-0
                ${col.visible ? 'text-[#374151]' : 'text-[#9CA3AF]'}
              `}
              title={col.name}
            >
              {col.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
