import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ExcelData } from '@/types';

interface CategoryBarChartProps {
  data: ExcelData;
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#10B981', '#F43F5E'];

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  const { chartData, title } = useMemo(() => {
    if (!data.headers || data.headers.length === 0) return { chartData: [], title: '' };

    // Find a good categorical column (like Witel, Regional, Type, Category, Zone)
    let targetIndex = data.headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('witel') || lower.includes('regional') || lower.includes('category') || 
             lower.includes('type') || lower.includes('zone') || lower.includes('sto');
    });

    // If none found, find a column with 2 to 15 unique values
    if (targetIndex === -1) {
      let bestCol = -1;
      let maxUnique = 0;
      
      for (let i = 0; i < data.headers.length; i++) {
        const uniqueVals = new Set();
        let count = 0;
        for (const row of data.rows) {
          if (row[i]) {
            uniqueVals.add(String(row[i]).trim());
          }
          if (count++ > 100) break; // Check first 100 rows for speed
        }
        
        if (uniqueVals.size >= 2 && uniqueVals.size <= 15) {
          if (uniqueVals.size > maxUnique) {
            maxUnique = uniqueVals.size;
            bestCol = i;
          }
        }
      }
      targetIndex = bestCol;
    }

    if (targetIndex === -1) {
      return { chartData: [], title: '' }; // No suitable column
    }

    const title = data.headers[targetIndex];
    const counts: Record<string, number> = {};

    data.rows.forEach(row => {
      const val = row[targetIndex];
      if (val !== null && val !== undefined && val !== '') {
        const key = String(val).trim();
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    // Convert to array and take top 8
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], idx) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        value,
        color: COLORS[idx % COLORS.length]
      }));

    return { chartData: sorted, title: `Top by ${title}` };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No categorical data available
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              itemStyle={{ fontWeight: 600 }}
              formatter={(value: number) => [value, 'Count']}
              labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
