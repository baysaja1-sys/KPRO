import { useMemo, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ExcelData } from '@/types';

interface MonitoringPageProps {
  data: ExcelData;
}

const STATUS_COLORS: Record<string, string> = {
  compwork: '#10B981',
  complete: '#10B981',
  done: '#10B981',
  canclwork: '#EF4444',
  cancel: '#EF4444',
  failed: '#EF4444',
  workfail: '#EF4444',
  booked: '#F59E0B',
  pending: '#F59E0B',
  in_progress: '#3B82F6',
};

export function MonitoringPage({ data }: MonitoringPageProps) {
  const [refreshKey] = useState(0);

  const analysis = useMemo(() => {
    const statusColIndex = data.headers.findIndex(
      h => String(h).toLowerCase().includes('status') && !String(h).toLowerCase().includes('status_')
    );
    const statusCounts: Record<string, number> = {};
    let completed = 0, failed = 0, inProgress = 0;

    if (statusColIndex >= 0) {
      data.rows.forEach(row => {
        const val = String(row[statusColIndex] || '').toLowerCase().trim() || 'unknown';
        statusCounts[val] = (statusCounts[val] || 0) + 1;
        if (val === 'compwork' || val === 'complete' || val === 'done' || val === 'finished') completed++;
        else if (val === 'canclwork' || val === 'cancel' || val === 'failed' || val === 'workfail') failed++;
        else inProgress++;
      });
    }

    const pieData = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      color: STATUS_COLORS[name] || '#8B5CF6',
    }));

    // Simulate live area chart (10 time slices)
    const sliceCount = 10;
    const sliceSize = Math.ceil(data.rows.length / sliceCount);
    const areaData = Array.from({ length: sliceCount }, (_, i) => {
      const slice = data.rows.slice(i * sliceSize, (i + 1) * sliceSize);
      let c = 0, f = 0, p = 0;
      if (statusColIndex >= 0) {
        slice.forEach(row => {
          const v = String(row[statusColIndex] || '').toLowerCase().trim();
          if (v === 'compwork' || v === 'complete' || v === 'done') c++;
          else if (v === 'canclwork' || v === 'cancel' || v === 'failed' || v === 'workfail') f++;
          else p++;
        });
      }
      return { time: `T${i + 1}`, Selesai: c, Gagal: f, Proses: p };
    });

    const health = failed / data.totalRows < 0.1 ? 'Baik' : failed / data.totalRows < 0.3 ? 'Perhatian' : 'Kritis';
    const healthColor = health === 'Baik' ? 'text-emerald-600' : health === 'Perhatian' ? 'text-amber-600' : 'text-red-600';
    const healthBg = health === 'Baik' ? 'bg-emerald-50' : health === 'Perhatian' ? 'bg-amber-50' : 'bg-red-50';

    return { pieData, areaData, completed, failed, inProgress, health, healthColor, healthBg };
  }, [data, refreshKey]);

  const statusItems = [
    { label: 'Selesai', value: analysis.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Gagal', value: analysis.failed, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Proses', value: analysis.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            <Activity className="w-6 h-6 text-orange-500" />
            Monitoring
          </h1>
          <p className="text-sm text-orange-400/80 mt-1">Pantau status dan progres data secara real-time</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 ${analysis.healthBg} rounded-xl`}>
          <RefreshCw className={`w-4 h-4 ${analysis.healthColor}`} />
          <span className={`text-sm font-semibold ${analysis.healthColor}`}>Status Sistem: {analysis.health}</span>
        </div>
      </div>

      {/* Status Pills */}
      <div className="grid grid-cols-3 gap-4">
        {statusItems.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="glass premium-shadow rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-medium">{item.label}</p>
                <p className="text-3xl font-bold text-foreground">{item.value.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass premium-shadow rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-foreground mb-1">Tren Status per Segmen</h2>
          <p className="text-xs text-muted-foreground mb-4">Distribusi status dari awal hingga akhir data</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={analysis.areaData}>
              <defs>
                <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGagal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
              <Area type="monotone" dataKey="Selesai" stroke="#10B981" strokeWidth={2} fill="url(#colorSelesai)" />
              <Area type="monotone" dataKey="Gagal" stroke="#EF4444" strokeWidth={2} fill="url(#colorGagal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass premium-shadow rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-1">Komposisi Status</h2>
          <p className="text-xs text-muted-foreground mb-4">Persentase tiap status</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={analysis.pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                {analysis.pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                formatter={(val: number, name: string) => [`${val} (${((val / data.totalRows) * 100).toFixed(1)}%)`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {analysis.pieData.slice(0, 4).map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
