import { useMemo } from 'react';
import { ClipboardCheck, Star, Target, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import type { ExcelData } from '@/types';

interface EvaluasiPageProps {
  data: ExcelData;
}

export function EvaluasiPage({ data }: EvaluasiPageProps) {
  const eval_ = useMemo(() => {
    const statusColIndex = data.headers.findIndex(
      h => String(h).toLowerCase().includes('status') && !String(h).toLowerCase().includes('status_')
    );
    let completed = 0, failed = 0, inProgress = 0;
    if (statusColIndex >= 0) {
      data.rows.forEach(row => {
        const val = String(row[statusColIndex] || '').toLowerCase().trim();
        if (val === 'compwork' || val === 'complete' || val === 'done' || val === 'finished') completed++;
        else if (val === 'canclwork' || val === 'cancel' || val === 'failed' || val === 'workfail') failed++;
        else inProgress++;
      });
    }
    const total = data.totalRows;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const failRate = total > 0 ? (failed / total) * 100 : 0;
    const pendingRate = total > 0 ? (inProgress / total) * 100 : 0;

    // Score 0–100
    const score = Math.max(0, Math.round(completionRate - failRate * 0.5));
    const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';
    const gradeColor = grade === 'A' ? 'text-emerald-600' : grade === 'B' ? 'text-indigo-600' : grade === 'C' ? 'text-amber-600' : 'text-red-600';
    const gradeBg = grade === 'A' ? 'bg-emerald-50' : grade === 'B' ? 'bg-indigo-50' : grade === 'C' ? 'bg-amber-50' : 'bg-red-50';

    const radarData = [
      { subject: 'Ketuntasan', value: Math.round(completionRate) },
      { subject: 'Keandalan', value: Math.max(0, Math.round(100 - failRate * 2)) },
      { subject: 'Efisiensi', value: Math.round(completionRate * 0.9) },
      { subject: 'Konsistensi', value: Math.max(0, Math.round(100 - pendingRate)) },
      { subject: 'Kualitas', value: Math.round(score) },
    ];

    const barData = [
      { name: 'Selesai', value: Math.round(completionRate), fill: '#10B981' },
      { name: 'Gagal', value: Math.round(failRate), fill: '#EF4444' },
      { name: 'Proses', value: Math.round(pendingRate), fill: '#F59E0B' },
    ];

    const insights = [];
    if (completionRate >= 80) insights.push({ type: 'good', text: `Tingkat penyelesaian sangat baik (${completionRate.toFixed(1)}%)` });
    else if (completionRate >= 60) insights.push({ type: 'warn', text: `Tingkat penyelesaian perlu ditingkatkan (${completionRate.toFixed(1)}%)` });
    else insights.push({ type: 'bad', text: `Tingkat penyelesaian sangat rendah (${completionRate.toFixed(1)}%)` });

    if (failRate < 10) insights.push({ type: 'good', text: `Tingkat kegagalan terkendali (${failRate.toFixed(1)}%)` });
    else if (failRate < 25) insights.push({ type: 'warn', text: `Tingkat kegagalan perlu diperhatikan (${failRate.toFixed(1)}%)` });
    else insights.push({ type: 'bad', text: `Tingkat kegagalan sangat tinggi (${failRate.toFixed(1)}%)` });

    if (inProgress > 0) insights.push({ type: 'warn', text: `${inProgress.toLocaleString()} item masih dalam proses` });

    return { completed, failed, inProgress, score, grade, gradeColor, gradeBg, radarData, barData, insights, completionRate, failRate };
  }, [data]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            <ClipboardCheck className="w-6 h-6 text-orange-500" />
            Evaluasi
          </h1>
          <p className="text-sm text-orange-400/80 mt-1">Penilaian performa dan analisis kualitas data</p>
        </div>
        <div className={`flex items-center gap-3 px-5 py-3 ${eval_.gradeBg} rounded-2xl`}>
          <Star className={`w-5 h-5 ${eval_.gradeColor}`} />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Nilai Performa</p>
            <p className={`text-2xl font-black ${eval_.gradeColor} leading-none`}>Grade {eval_.grade}</p>
          </div>
        </div>
      </div>

      {/* Score + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="glass premium-shadow rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
          <Target className="w-8 h-8 text-indigo-500" />
          <div className="text-center">
            <p className="text-[13px] text-muted-foreground font-medium">Skor Keseluruhan</p>
            <p className="text-6xl font-black text-indigo-600 leading-none mt-1">{eval_.score}</p>
            <p className="text-[12px] text-muted-foreground mt-1">dari 100</p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
            <div
              className="bg-gradient-to-r from-indigo-400 to-violet-500 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${eval_.score}%` }}
            />
          </div>
        </div>

        {/* Insights */}
        <div className="glass premium-shadow rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-base font-bold text-foreground mb-4">Temuan & Rekomendasi</h2>
          <div className="flex flex-col gap-3">
            {eval_.insights.map((ins, i) => {
              const Icon = ins.type === 'good' ? ThumbsUp : ins.type === 'bad' ? ThumbsDown : AlertCircle;
              const colors = {
                good: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                warn: 'bg-amber-50 border-amber-200 text-amber-700',
                bad: 'bg-red-50 border-red-200 text-red-700',
              };
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${colors[ins.type as keyof typeof colors]}`}>
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-[13px] font-medium">{ins.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass premium-shadow rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-1">Radar Performa</h2>
          <p className="text-xs text-muted-foreground mb-4">Evaluasi multi-dimensi berdasarkan data</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={eval_.radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Radar name="Skor" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass premium-shadow rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-1">Distribusi Persentase</h2>
          <p className="text-xs text-muted-foreground mb-4">Proporsi status dalam persentase (%)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eval_.barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                formatter={(val: number) => [`${val}%`, 'Persentase']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48}>
                {eval_.barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
