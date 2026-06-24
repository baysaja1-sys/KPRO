import { useMemo } from 'react';
import { Rows3, Columns3, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ExcelData } from '@/types';

interface SummaryCardsProps {
  data: ExcelData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const stats = useMemo(() => {
    const statusColIndex = data.headers.findIndex(
      h => String(h).toLowerCase().includes('status') && !String(h).toLowerCase().includes('status_')
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
      gradient: 'from-orange-500 to-amber-400',
      bgGlow: 'bg-orange-50',
      border: 'border-orange-200',
      glow: '#f97316',
    },
    {
      label: 'Columns',
      value: data.totalCols.toString(),
      icon: Columns3,
      gradient: 'from-red-500 to-orange-400',
      bgGlow: 'bg-red-50',
      border: 'border-red-200',
      glow: '#ef4444',
    },
    {
      label: 'Completed',
      value: stats.completed.toLocaleString(),
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-400',
      bgGlow: 'bg-emerald-50',
      border: 'border-emerald-200',
      glow: '#10b981',
    },
    {
      label: 'In Progress',
      value: stats.inProgress.toLocaleString(),
      icon: Clock,
      gradient: 'from-amber-500 to-yellow-400',
      bgGlow: 'bg-amber-50',
      border: 'border-amber-200',
      glow: '#f59e0b',
    },
    {
      label: 'Failed/Cancelled',
      value: stats.failed.toLocaleString(),
      icon: XCircle,
      gradient: 'from-rose-500 to-red-400',
      bgGlow: 'bg-rose-50',
      border: 'border-rose-200',
      glow: '#f43f5e',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-6 py-4 bg-transparent flex-shrink-0">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex flex-col gap-3 p-5 bg-white/80 backdrop-blur-sm rounded-2xl border ${card.border} shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group cursor-default`}
        >
          {/* Subtle glow */}
          <div
            className="absolute -inset-1 opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-xl rounded-2xl"
            style={{ backgroundColor: card.glow }}
          />

          <div className="flex items-center gap-3 relative z-10">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md flex-shrink-0`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-[12px] text-muted-foreground font-semibold truncate">{card.label}</p>
          </div>

          <p className="text-2xl font-black text-foreground leading-tight tracking-tight relative z-10">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
