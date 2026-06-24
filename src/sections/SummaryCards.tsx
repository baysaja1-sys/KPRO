import { useMemo } from 'react';
import { Rows3, Columns3, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ExcelData } from '@/types';

interface SummaryCardsProps {
  data: ExcelData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const stats = useMemo(() => {
    // Find status column
    const statusColIndex = data.headers.findIndex(
      h => h.toLowerCase().includes('status') && !h.toLowerCase().includes('status_')
    );

    let completed = 0;
    let inProgress = 0;
    let failed = 0;
    let other = 0;

    if (statusColIndex >= 0) {
      data.rows.forEach(row => {
        const val = String(row[statusColIndex] || '').toLowerCase().trim();
        if (val === 'compwork' || val === 'complete' || val === 'done' || val === 'finished') {
          completed++;
        } else if (val === 'canclwork' || val === 'cancel' || val === 'failed' || val === 'workfail') {
          failed++;
        } else if (val === 'booked' || val === 'pending' || val === 'in_progress' || val === '') {
          inProgress++;
        } else {
          other++;
        }
      });
    }

    return { completed, inProgress, failed, other };
  }, [data]);

  const cards = [
    {
      label: 'Total Rows',
      value: data.totalRows.toLocaleString(),
      icon: Rows3,
      color: '#2A9D8F',
      bgColor: '#F0FDFA',
    },
    {
      label: 'Columns',
      value: data.totalCols.toString(),
      icon: Columns3,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      label: 'Completed',
      value: stats.completed.toLocaleString(),
      icon: CheckCircle2,
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      label: 'In Progress',
      value: stats.inProgress.toLocaleString(),
      icon: Clock,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      label: 'Failed/Cancelled',
      value: stats.failed.toLocaleString(),
      icon: XCircle,
      color: '#EF4444',
      bgColor: '#FEF2F2',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6 bg-transparent flex-shrink-0 relative z-10">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-2 p-5 glass premium-shadow rounded-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
        >
          {/* Subtle background glow effect */}
          <div className="absolute -inset-1 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl rounded-2xl" style={{ backgroundColor: card.color }}></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 shadow-sm"
              style={{ backgroundColor: card.bgColor }}
            >
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <p className="text-[13px] text-muted-foreground font-medium truncate">{card.label}</p>
          </div>
          
          <div className="relative z-10 mt-1">
            <p className="text-2xl font-bold text-foreground leading-tight tracking-tight">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
