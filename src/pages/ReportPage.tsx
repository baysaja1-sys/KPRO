import { useMemo, useState } from 'react';
import { FileBarChart2 as FileBarChart2Icon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Minus as MinusIcon, Download as DownloadIcon, Calendar as CalendarIcon, Filter as FilterIcon, Copy as CopyIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import type { ExcelData } from '@/types';
import { useTableData } from '@/hooks/useTableData';
import { DataTable } from '@/sections/DataTable';
import { FieldPanel } from '@/sections/FieldPanel';

interface ReportPageProps {
  data: ExcelData;
  onExport: () => void;
  fileName: string;
}

const STATUS_OPTIONS = ['STARTWORK', 'INSTCOMP', 'CONTWORK', 'WORKFAIL', 'CANCLWORK', 'ACTCOMP', 'VALSTART', 'VALCOMP', 'COMPWORK', 'DEINSTCOMP', 'WAPPR', 'PENDWORK'];
const KENDALA_PELANGGAN_OPTIONS = ['PENDING', 'RNA', 'BATAL', 'SALAH TAGGING', 'KENDALA IZIN', 'GANTI PAKET', 'DOUBLE INPUT', 'INDIKASI CABUT PASANG', 'ALAMAT TIDAK DITEMUKAN', 'PELANGGAN MASIH RAGU', 'RUMAH KOSONG', 'KENDALA DEPOSIT', 'KENDALA MATERIAL/NTE', 'FALLOUT PELANGGAN - SALAH HOMEPASS', 'KENDALA PERANGKAT', 'FALLOUT PELANGGAN - ODP SALAH RELASI HOMEPASS'];
const KENDALA_TEKNIK_OPTIONS = ['ODP JAUH', 'TIDAK ADA ODP', 'ODP FULL', 'KENDALA JALUR/RUTE TARIKAN', 'TIANG', 'KENDALA IKR/IKG', 'ODP LOSS', 'CROSS JALAN', 'ODP RETI'];

export function ReportPage({ data, onExport, fileName }: ReportPageProps) {
  const [filters, setFilters] = useState({
    STATUS: '',
    ERROR_TYPE: '',
    SUB_ERROR: ''
  });
  const [showFieldPanel, setShowFieldPanel] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const hasActiveFilter = Boolean(filters.STATUS || filters.ERROR_TYPE || filters.SUB_ERROR);
  const activeFilterNames = [filters.STATUS, filters.ERROR_TYPE, filters.SUB_ERROR].filter(Boolean).join(' + ');

  const stats = useMemo(() => {
    const statusColIndex = data.headers.findIndex(
      h => String(h).toUpperCase().trim() === 'STATUS'
    );
    
    const counts: Record<string, number> = {};
    let completed = 0, failed = 0, inProgress = 0;

    if (statusColIndex >= 0) {
      data.rows.forEach(row => {
        const val = String(row[statusColIndex] || '').toUpperCase().trim();
        if (val) {
          counts[val] = (counts[val] || 0) + 1;
          if (['COMPWORK', 'ACTCOMP', 'VALCOMP', 'DEINSTCOMP'].includes(val)) completed++;
          else if (['WORKFAIL', 'CANCLWORK'].includes(val)) failed++;
          else inProgress++;
        }
      });
    }

    const total = data.totalRows;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0';
    
    return { counts, completed, failed, inProgress, total, completionRate, failRate };
  }, [data]);

  const statusBarData = Object.entries(stats.counts)
    .map(([name, value]) => ({ name, value, fill: '#f97316' }))
    .sort((a, b) => b.value - a.value);

  const trendData = useMemo(() => {
    const bucketCount = 7;
    const bucketSize = Math.ceil(data.rows.length / bucketCount);
    return Array.from({ length: bucketCount }, (_, i) => {
      const start = i * bucketSize;
      const end = Math.min(start + bucketSize, data.rows.length);
      const bucket = data.rows.slice(start, end);
      const statusColIndex = data.headers.findIndex(h => String(h).toUpperCase().trim() === 'STATUS');
      let done = 0, fail = 0;
      if (statusColIndex >= 0) {
        bucket.forEach(row => {
          const val = String(row[statusColIndex] || '').toUpperCase().trim();
          if (['COMPWORK', 'ACTCOMP', 'VALCOMP', 'DEINSTCOMP'].includes(val)) done++;
          else if (['WORKFAIL', 'CANCLWORK'].includes(val)) fail++;
        });
      }
      return { label: `Batch ${i + 1}`, Completed: done, Failed: fail };
    });
  }, [data]);

  const metrics = [
    { label: 'Total Records', value: stats.total.toLocaleString(), icon: FileBarChart2Icon, color: 'from-indigo-500 to-violet-600', trend: null },
    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUpIcon, color: 'from-emerald-400 to-teal-600', trend: 'up' },
    { label: 'Failure Rate', value: `${stats.failRate}%`, icon: TrendingDownIcon, color: 'from-rose-400 to-red-600', trend: 'down' },
    { label: 'Pending', value: stats.inProgress.toLocaleString(), icon: MinusIcon, color: 'from-amber-400 to-orange-500', trend: null },
  ];

  const filteredData = useMemo(() => {
    if (!hasActiveFilter) return null;

    const statusIdx = data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'STATUS');
    const subErrorIdx = data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'SUBERRORCODEAKHIR');
    const errorIdx = data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'ERRORCODEAKHIR');

    const filteredRows = data.rows.filter(row => {
      let match = true;

      if (filters.STATUS) {
        if (statusIdx < 0) match = false;
        else if (String(row[statusIdx]).toUpperCase().trim() !== filters.STATUS) match = false;
      }

      if (filters.ERROR_TYPE) {
        if (errorIdx < 0) match = false;
        else {
          const errCode = String(row[errorIdx]).toUpperCase().trim();
          if (errCode !== filters.ERROR_TYPE) match = false;
          else if (filters.SUB_ERROR) {
            if (subErrorIdx < 0) match = false;
            else {
              const subErr = String(row[subErrorIdx]).toUpperCase().trim();
              if (subErr !== filters.SUB_ERROR) match = false;
            }
          }
        }
      }

      return match;
    });

    const headerIndices = [
      data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'STO'),
      data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'WONUM'),
      data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'STATUS'),
      data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'ERRORCODEAKHIR'),
      data.headers.findIndex(h => String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '') === 'SUBERRORCODEAKHIR'),
      data.headers.findIndex(h => {
        const cleanH = String(h).toUpperCase().replace(/_/g, '').replace(/\s/g, '');
        return cleanH === 'ENGINEERMEMOAKHIR' || cleanH === 'ENGINEERINGMEMOAKHIR' || cleanH === 'ENGINERINGMEMOAKHIR';
      })
    ].filter(idx => idx !== -1);

    const newHeaders = headerIndices.map(idx => data.headers[idx]);
    const newRows = filteredRows.map(row => headerIndices.map(idx => row[idx]));

    return {
      headers: newHeaders,
      rows: newRows,
      fileName: `${data.fileName} - ${activeFilterNames}`,
      totalRows: newRows.length
    } as ExcelData;
  }, [data, hasActiveFilter, filters, activeFilterNames]);

  const {
    searchQuery,
    setSearchQuery,
    sortConfig,
    toggleSort,
    expandedRow,
    expandRow,
    columnConfigs,
    visibleColumns,
    processedRows,
    toggleColumnVisibility,
    exportToExcel,
  } = useTableData(filteredData);

  const handleCopyFilteredData = () => {
    if (!filteredData) return;
    const headers = filteredData.headers.join('\t');
    const rowsText = filteredData.rows.map(row => 
      row.map(val => val !== null ? String(val).replace(/\t/g, ' ').replace(/\n/g, ' ') : '').join('\t')
    ).join('\n');
    
    const tsvData = `${headers}\n${rowsText}`;
    navigator.clipboard.writeText(tsvData).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const clearAllFilters = () => {
    setFilters({ STATUS: '', ERROR_TYPE: '', SUB_ERROR: '' });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            <FileBarChart2Icon className="w-6 h-6 text-orange-500" />
            Report
          </h1>
          <p className="text-sm text-orange-400/80 mt-1">Laporan ringkasan data fulfillment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-[12px] text-muted-foreground">
            <CalendarIcon className="w-3.5 h-3.5" />
            {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-200 transition-all duration-200"
          >
            <DownloadIcon className="w-4 h-4" />
            Export Full Data
          </button>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-border premium-shadow shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 border-r border-slate-200 pr-3 mr-1">
          <FilterIcon className="w-4 h-4" />
          <span className="text-sm font-semibold">Filter Data:</span>
        </div>
        
        <select 
          className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${filters.STATUS ? 'bg-orange-50 border-orange-200 text-orange-700 font-medium' : 'bg-slate-50 border-slate-200'}`}
          value={filters.STATUS}
          onChange={(e) => setFilters(prev => ({ ...prev, STATUS: e.target.value }))}
        >
          <option value="">-- Status --</option>
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <select 
          className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${filters.ERROR_TYPE ? 'bg-orange-50 border-orange-200 text-orange-700 font-medium' : 'bg-slate-50 border-slate-200'}`}
          value={filters.ERROR_TYPE}
          onChange={(e) => setFilters(prev => ({ ...prev, ERROR_TYPE: e.target.value, SUB_ERROR: '' }))}
        >
          <option value="">-- Kategori Kendala --</option>
          <option value="KENDALA PELANGGAN">Kendala Pelanggan</option>
          <option value="KENDALA TEKNIK">Kendala Teknik</option>
        </select>

        {filters.ERROR_TYPE === 'KENDALA PELANGGAN' && (
          <select 
            className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${filters.SUB_ERROR ? 'bg-orange-50 border-orange-200 text-orange-700 font-medium' : 'bg-slate-50 border-slate-200'} animate-in fade-in slide-in-from-left-2`}
            value={filters.SUB_ERROR}
            onChange={(e) => setFilters(prev => ({ ...prev, SUB_ERROR: e.target.value }))}
          >
            <option value="">-- Pilih Kendala Pelanggan --</option>
            {KENDALA_PELANGGAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}

        {filters.ERROR_TYPE === 'KENDALA TEKNIK' && (
          <select 
            className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${filters.SUB_ERROR ? 'bg-orange-50 border-orange-200 text-orange-700 font-medium' : 'bg-slate-50 border-slate-200'} animate-in fade-in slide-in-from-left-2`}
            value={filters.SUB_ERROR}
            onChange={(e) => setFilters(prev => ({ ...prev, SUB_ERROR: e.target.value }))}
          >
            <option value="">-- Pilih Kendala Teknik --</option>
            {KENDALA_TEKNIK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}

        {hasActiveFilter && (
          <button 
            onClick={clearAllFilters}
            className="text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-md transition-colors ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="glass premium-shadow rounded-2xl p-5 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-medium">{m.label}</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass premium-shadow rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-1">Distribusi Status</h2>
          <p className="text-xs text-muted-foreground mb-4">Klik pada batang diagram untuk filter tabel</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusBarData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
              <Bar 
                dataKey="value" 
                name="Jumlah" 
                radius={[4, 4, 0, 0]}
                onClick={(data) => setFilters(prev => ({ ...prev, STATUS: prev.STATUS === data.name ? '' : data.name }))}
              >
                {statusBarData.map((entry, idx) => (
                  <Cell 
                    key={idx} 
                    fill={entry.fill} 
                    className="cursor-pointer transition-all duration-300 hover:brightness-110" 
                    opacity={filters.STATUS && filters.STATUS !== entry.name ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass premium-shadow rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-1">Tren Penyelesaian</h2>
          <p className="text-xs text-muted-foreground mb-4">Completed vs Failed per batch data</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
              <Line type="monotone" dataKey="Completed" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Failed" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-down Table */}
      {hasActiveFilter && filteredData && (
        <div className="flex flex-col h-[500px] glass premium-shadow rounded-2xl overflow-hidden mt-2 animate-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-white/50">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Detail Data: {activeFilterNames}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Menampilkan {filteredData.rows.length.toLocaleString()} baris data dari kombinasi filter tersebut.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyFilteredData}
                className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors border ${copySuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <CopyIcon className="w-3.5 h-3.5" />
                {copySuccess ? 'Copied!' : 'Copy Data'}
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                Download Excel
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Tutup Tabel
              </button>
            </div>
          </div>
          <div className="flex flex-1 min-h-0 relative">
            <DataTable
              data={filteredData}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortConfig={sortConfig}
              onSort={toggleSort}
              expandedRow={expandedRow}
              onExpandRow={expandRow}
              visibleColumns={visibleColumns}
              processedRows={processedRows}
              onTogglePanel={() => setShowFieldPanel(prev => !prev)}
              onExport={exportToExcel}
              fileName={filteredData.fileName}
            />
            {showFieldPanel && (
              <div className="w-[280px] flex-shrink-0 h-full border-l border-border bg-white absolute right-0 top-0 bottom-0 shadow-xl z-20">
                <FieldPanel
                  columns={columnConfigs}
                  onToggleColumn={toggleColumnVisibility}
                  onClose={() => setShowFieldPanel(false)}
                  hiddenCount={columnConfigs.filter(c => !c.visible).length}
                  totalCount={columnConfigs.length}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
