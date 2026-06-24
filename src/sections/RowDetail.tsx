interface RowDetailProps {
  row: (string | number | null)[];
  columns: { index: number; name: string }[];
  allColumns: { index: number; name: string }[];
}

export function RowDetail({ row, columns, allColumns }: RowDetailProps) {
  // Show all columns in detail view, not just visible ones
  const displayColumns = allColumns.length > 0 ? allColumns : columns;

  return (
    <div className="p-5 animate-in fade-in slide-in-from-top-2 duration-250">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
        {displayColumns.map((col) => {
          const value = row[col.index];
          return (
            <div key={col.index} className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-[0.03em] truncate">
                {col.name}
              </span>
              <span
                className={`
                  text-[13px] text-[#111827] mt-0.5 break-words
                  ${value === null || value === '' ? 'text-[#D1D5DB]' : ''}
                `}
                title={value !== null ? String(value) : undefined}
              >
                {value !== null && value !== '' ? String(value) : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
