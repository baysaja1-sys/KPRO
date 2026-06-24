import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ExcelData } from '@/types';

interface StatusPieChartProps {
  data: ExcelData;
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = useMemo(() => {
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

    const result = [];
    if (completed > 0) result.push({ name: 'Completed', value: completed, color: '#10B981' });
    if (inProgress > 0) result.push({ name: 'In Progress', value: inProgress, color: '#F59E0B' });
    if (failed > 0) result.push({ name: 'Failed/Cancelled', value: failed, color: '#EF4444' });
    if (other > 0) result.push({ name: 'Other', value: other, color: '#8B5CF6' });

    return result;
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No status data available
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            itemStyle={{ fontWeight: 600 }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
