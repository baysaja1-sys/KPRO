import { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutGrid, Calendar, RefreshCw, Edit3, Check, X, Download } from 'lucide-react';
import { useDashboard2 } from '@/hooks/useDashboard2';
import type { ExcelData } from '@/types';
import type { AreaRow } from '@/hooks/useDashboard2';
import * as XLSX from 'xlsx';

interface Dashboard2PageProps {
  data: ExcelData;
}

// ─── localStorage helpers ───────────────────────────────────────────────────
const LS_KEY = 'kpro_hsa_osa_map';
type HsaOsaMap = Record<string, { hsa: string; osa: string }>;

function loadHsaOsa(): HsaOsaMap {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveHsaOsa(map: HsaOsaMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

// ─── Color helpers ───────────────────────────────────────────────────────────
function pctColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-700 font-bold';
  if (pct >= 75) return 'text-blue-700 font-semibold';
  if (pct >= 50) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

function pctBg(pct: number): string {
  if (pct >= 90) return 'bg-emerald-50';
  if (pct >= 75) return 'bg-blue-50';
  if (pct >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

// ─── Editable cell ───────────────────────────────────────────────────────────
function EditableCell({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onChange(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[100px]">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          className="w-full text-[11px] border border-orange-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
        <button onClick={commit} className="text-emerald-600 hover:text-emerald-700"><Check className="w-3 h-3" /></button>
        <button onClick={cancel} className="text-red-500 hover:text-red-600"><X className="w-3 h-3" /></button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Klik untuk edit"
      className="group flex items-center gap-1 text-left w-full hover:bg-orange-50 rounded px-1 py-0.5 transition-colors"
    >
      <span className={`text-[11px] ${value ? 'text-slate-700 font-medium' : 'text-slate-400 italic'}`}>
        {value || placeholder}
      </span>
      <Edit3 className="w-2.5 h-2.5 text-orange-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
    </button>
  );
}

// ─── Number cell (hides zero as dash or colored) ─────────────────────────────
function NumCell({ v, highlight = false, className = '' }: { v: number; highlight?: boolean; className?: string }) {
  if (v === 0) return <span className="text-slate-300">-</span>;
  return <span className={`${highlight ? 'font-semibold text-slate-800' : 'text-slate-700'} ${className}`}>{v.toLocaleString()}</span>;
}

function PctCell({ v }: { v: number }) {
  if (v === 0) return <span className="text-slate-300">-</span>;
  return <span className={pctColor(v)}>{v.toFixed(2)}%</span>;
}

// ─── Table header cell ────────────────────────────────────────────────────────
function TH({ children, rowSpan = 1, colSpan = 1, className = '' }: {
  children: React.ReactNode;
  rowSpan?: number;
  colSpan?: number;
  className?: string;
}) {
  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={`border border-slate-300 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

// ─── Table data cell ──────────────────────────────────────────────────────────
function TD({ children, className = '', title = '' }: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td title={title} className={`border border-slate-200 px-2 py-1 text-center text-[11px] whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Dashboard2Page({ data }: Dashboard2PageProps) {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [hsaOsaMap, setHsaOsaMap] = useState<HsaOsaMap>(loadHsaOsa);
  const [viewMode, setViewMode] = useState<'mtd' | 'daily'>('mtd');

  // Column labels (HSA/OSA) are editable
  const [colLabels, setColLabels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kpro_col_labels') || '{"hsa":"HSA","osa":"OSA"}'); }
    catch { return { hsa: 'HSA', osa: 'OSA' }; }
  });

  const { areaRows, totals } = useDashboard2(data, selectedDate);

  // Merge HSA/OSA from localStorage into rows
  const rows: AreaRow[] = useMemo(() =>
    areaRows.map(r => ({
      ...r,
      hsa: hsaOsaMap[r.serviceArea]?.hsa || '',
      osa: hsaOsaMap[r.serviceArea]?.osa || '',
    })),
    [areaRows, hsaOsaMap]
  );

  const updateHsaOsa = useCallback((area: string, field: 'hsa' | 'osa', value: string) => {
    setHsaOsaMap(prev => {
      const next = { ...prev, [area]: { ...prev[area], hsa: prev[area]?.hsa || '', osa: prev[area]?.osa || '', [field]: value } };
      saveHsaOsa(next);
      return next;
    });
  }, []);

  const updateColLabel = (field: 'hsa' | 'osa', value: string) => {
    setColLabels((prev: typeof colLabels) => {
      const next = { ...prev, [field]: value };
      localStorage.setItem('kpro_col_labels', JSON.stringify(next));
      return next;
    });
  };

  // MTD month label
  const mtdLabel = useMemo(() => {
    const d = new Date(selectedDate);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  // Export to Excel
  const handleExport = () => {
    const headers = [
      'Service Area', colLabels.hsa, colLabels.osa,
      'MANJA EXP', 'MANJA HI', 'NON H+', 'TOTAL ORDER PI',
      'CONTWORK', 'INSTCOMP', 'ACTCOMP', 'VALSTART', 'VALCOMP', 'TOTAL INPROGRESS',
      'PS HI', 'RE HI', 'PS/RE HI %',
      'PS TOTAL', 'RE TOTAL', 'PS/RE %',
      'MTD RE', 'MTD PS', 'MTD PS/RE %',
      'JML TEKNISI', 'TEKNISI/RE', 'TEKNISI/PS',
    ];
    const wsData = [headers, ...[...rows, totals].map(r => [
      r.serviceArea, r.hsa, r.osa,
      r.manjaExp, r.manjaHi, r.nonHPlus, r.totalOrderPI,
      r.contwork, r.instComp, r.actComp, r.valstart, r.valcomp, r.totalInprogress,
      r.psHi, r.reHi, r.psReHiPct,
      r.psTotal, r.reTotal, r.psReTotalPct,
      r.mtdRe, r.mtdPs, r.mtdPsRePct,
      r.jmlTeknisi, r.teknisiPerRe, r.teknisiPerPs,
    ])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard 2.0');
    XLSX.writeFile(wb, `Dashboard2_${selectedDate}.xlsx`);
  };

  // Summary KPI cards
  const kpi = [
    { label: 'Total RE (MTD)', value: totals.mtdRe.toLocaleString(), color: 'from-orange-500 to-red-500', textColor: 'text-white' },
    { label: 'Total PS (MTD)', value: totals.mtdPs.toLocaleString(), color: 'from-emerald-500 to-teal-500', textColor: 'text-white' },
    { label: 'PS/RE MTD', value: `${totals.mtdPsRePct.toFixed(1)}%`, color: 'from-blue-500 to-indigo-500', textColor: 'text-white' },
    { label: 'PS Hari Ini', value: totals.psHi.toLocaleString(), color: 'from-violet-500 to-purple-500', textColor: 'text-white' },
    { label: 'RE Hari Ini', value: totals.reHi.toLocaleString(), color: 'from-amber-500 to-orange-400', textColor: 'text-white' },
    { label: 'Total Teknisi', value: totals.jmlTeknisi.toLocaleString(), color: 'from-slate-600 to-slate-800', textColor: 'text-white' },
  ];

  return (
    <div className="flex flex-col gap-5 p-6 pb-10 min-h-full">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            <LayoutGrid className="w-6 h-6 text-orange-500" />
            Dashboard 2.0
          </h1>
          <p className="text-sm text-orange-400/80 mt-1">Produktivitas harian & bulanan per Service Area</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('mtd')}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${viewMode === 'mtd' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              MTD
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${viewMode === 'daily' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Daily
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-[12px] font-medium text-slate-700 border-none outline-none bg-transparent cursor-pointer"
            />
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-md shadow-orange-200 hover:from-orange-600 hover:to-red-600 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpi.map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} rounded-2xl p-4 shadow-md flex flex-col gap-1`}>
            <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">{k.label}</p>
            <p className={`text-2xl font-black ${k.textColor} leading-none`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Context label ── */}
      <div className="flex items-center gap-3 text-[12px] text-slate-500">
        <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
        {viewMode === 'mtd'
          ? <span>Mode <strong>MTD</strong> — Data bulan <strong>{mtdLabel}</strong></span>
          : <span>Mode <strong>Daily</strong> — Tanggal <strong>{new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
        }
        <span className="ml-auto text-[11px] text-orange-400/70 italic">💡 Klik nama kolom HSA/OSA di header atau nilai di tabel untuk mengedit</span>
      </div>

      {/* ── Main Table ── */}
      <div className="overflow-auto rounded-2xl border border-slate-200 shadow-lg bg-white">
        <table className="min-w-max w-full border-collapse text-[11px]">
          <thead>
            {/* Row 1: Group headers */}
            <tr>
              <TH rowSpan={2} className="bg-slate-700 text-white min-w-[80px]">Service Area</TH>
              <TH rowSpan={2} className="bg-slate-600 text-white min-w-[110px]">
                <EditableCell value={colLabels.hsa} onChange={v => updateColLabel('hsa', v)} placeholder="HSA" />
              </TH>
              <TH rowSpan={2} className="bg-slate-600 text-white min-w-[110px]">
                <EditableCell value={colLabels.osa} onChange={v => updateColLabel('osa', v)} placeholder="OSA" />
              </TH>

              {/* ORDER PI */}
              <TH colSpan={4} className="bg-orange-500 text-white">ORDER PI</TH>

              {/* INPROGRESS ORDER */}
              <TH colSpan={6} className="bg-amber-500 text-white">INPROGRESS ORDER</TH>

              {/* PS TO RE - Daily */}
              <TH colSpan={3} className="bg-sky-600 text-white">PS TO RE — Daily</TH>

              {/* PS TO RE - Overall */}
              <TH colSpan={3} className="bg-blue-600 text-white">PS TO RE — Overall</TH>

              {/* MTD */}
              <TH colSpan={3} className="bg-indigo-600 text-white">MTD</TH>

              {/* PRODUKTIVITAS */}
              <TH colSpan={3} className="bg-violet-600 text-white">PRODUKTIVITAS TEKNISI</TH>
            </tr>

            {/* Row 2: Sub-headers */}
            <tr>
              {/* ORDER PI subs */}
              <TH className="bg-orange-100 text-orange-800">MANJA EXP</TH>
              <TH className="bg-orange-100 text-orange-800">MANJA HI</TH>
              <TH className="bg-orange-100 text-orange-800">NON H+</TH>
              <TH className="bg-orange-200 text-orange-900">Total!</TH>

              {/* INPROGRESS subs */}
              <TH className="bg-amber-100 text-amber-800">Contwork</TH>
              <TH className="bg-amber-100 text-amber-800">InstComp</TH>
              <TH className="bg-amber-100 text-amber-800">ActComp</TH>
              <TH className="bg-amber-100 text-amber-800">Valstart</TH>
              <TH className="bg-amber-100 text-amber-800">Valcomp</TH>
              <TH className="bg-amber-200 text-amber-900">Total Inprogress</TH>

              {/* PS TO RE Daily subs */}
              <TH className="bg-sky-100 text-sky-800">PS HI</TH>
              <TH className="bg-sky-100 text-sky-800">RE HI</TH>
              <TH className="bg-sky-200 text-sky-900">PS/RE</TH>

              {/* PS TO RE Overall subs */}
              <TH className="bg-blue-100 text-blue-800">PS</TH>
              <TH className="bg-blue-100 text-blue-800">RE</TH>
              <TH className="bg-blue-200 text-blue-900">PS/RE</TH>

              {/* MTD subs */}
              <TH className="bg-indigo-100 text-indigo-800">RE</TH>
              <TH className="bg-indigo-100 text-indigo-800">PS</TH>
              <TH className="bg-indigo-200 text-indigo-900">PS/RE</TH>

              {/* PRODUKTIVITAS subs */}
              <TH className="bg-violet-100 text-violet-800">JML TEKNISI</TH>
              <TH className="bg-violet-100 text-violet-800">TEKNISI/RE</TH>
              <TH className="bg-violet-100 text-violet-800">TEKNISI/PS</TH>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.serviceArea} className={`hover:bg-orange-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                <TD className="font-bold text-slate-800 text-left px-3">{row.serviceArea}</TD>

                {/* HSA */}
                <TD className="text-left px-2">
                  <EditableCell
                    value={row.hsa}
                    onChange={v => updateHsaOsa(row.serviceArea, 'hsa', v)}
                    placeholder={`Nama ${colLabels.hsa}`}
                  />
                </TD>

                {/* OSA */}
                <TD className="text-left px-2">
                  <EditableCell
                    value={row.osa}
                    onChange={v => updateHsaOsa(row.serviceArea, 'osa', v)}
                    placeholder={`Nama ${colLabels.osa}`}
                  />
                </TD>

                {/* ORDER PI */}
                <TD className="bg-orange-50/30"><NumCell v={row.manjaExp} /></TD>
                <TD className="bg-orange-50/30"><NumCell v={row.manjaHi} /></TD>
                <TD className="bg-orange-50/30"><NumCell v={row.nonHPlus} /></TD>
                <TD className="bg-orange-100/40 font-semibold"><NumCell v={row.totalOrderPI} highlight /></TD>

                {/* INPROGRESS */}
                <TD className="bg-amber-50/30"><NumCell v={row.contwork} /></TD>
                <TD className="bg-amber-50/30"><NumCell v={row.instComp} /></TD>
                <TD className="bg-amber-50/30"><NumCell v={row.actComp} /></TD>
                <TD className="bg-amber-50/30"><NumCell v={row.valstart} /></TD>
                <TD className="bg-amber-50/30"><NumCell v={row.valcomp} /></TD>
                <TD className="bg-amber-100/40 font-semibold"><NumCell v={row.totalInprogress} highlight /></TD>

                {/* PS TO RE Daily */}
                <TD className="bg-sky-50/30"><NumCell v={row.psHi} /></TD>
                <TD className="bg-sky-50/30"><NumCell v={row.reHi} /></TD>
                <TD className={`bg-sky-100/40 ${pctBg(row.psReHiPct)}`}><PctCell v={row.psReHiPct} /></TD>

                {/* PS TO RE Overall */}
                <TD className="bg-blue-50/30"><NumCell v={row.psTotal} /></TD>
                <TD className="bg-blue-50/30"><NumCell v={row.reTotal} /></TD>
                <TD className={`bg-blue-100/40 ${pctBg(row.psReTotalPct)}`}><PctCell v={row.psReTotalPct} /></TD>

                {/* MTD */}
                <TD className="bg-indigo-50/30"><NumCell v={row.mtdRe} /></TD>
                <TD className="bg-indigo-50/30"><NumCell v={row.mtdPs} /></TD>
                <TD className={`bg-indigo-100/40 ${pctBg(row.mtdPsRePct)}`}><PctCell v={row.mtdPsRePct} /></TD>

                {/* PRODUKTIVITAS */}
                <TD className="bg-violet-50/30"><NumCell v={row.jmlTeknisi} /></TD>
                <TD className="bg-violet-50/30">
                  {row.teknisiPerRe > 0 ? <span className="text-slate-600">{row.teknisiPerRe.toFixed(2)}</span> : <span className="text-slate-300">-</span>}
                </TD>
                <TD className="bg-violet-50/30">
                  {row.teknisiPerPs > 0 ? <span className="text-slate-600">{row.teknisiPerPs.toFixed(2)}</span> : <span className="text-slate-300">-</span>}
                </TD>
              </tr>
            ))}

            {/* ── TOTALS ROW ── */}
            <tr className="bg-slate-800 text-white font-bold sticky bottom-0 z-10">
              <td className="border border-slate-600 px-3 py-2 text-left text-[11px] uppercase tracking-widest">{totals.serviceArea}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px]">—</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px]">—</td>

              {/* ORDER PI total */}
              {[totals.manjaExp, totals.manjaHi, totals.nonHPlus, totals.totalOrderPI].map((v, i) => (
                <td key={i} className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-orange-900/30">{v || '-'}</td>
              ))}

              {/* INPROGRESS total */}
              {[totals.contwork, totals.instComp, totals.actComp, totals.valstart, totals.valcomp, totals.totalInprogress].map((v, i) => (
                <td key={i} className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-amber-900/30">{v || '-'}</td>
              ))}

              {/* PS TO RE Daily total */}
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-sky-900/30">{totals.psHi}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-sky-900/30">{totals.reHi}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-sky-900/30">{totals.psReHiPct.toFixed(2)}%</td>

              {/* PS TO RE Overall total */}
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-blue-900/30">{totals.psTotal}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-blue-900/30">{totals.reTotal}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-blue-900/30">{totals.psReTotalPct.toFixed(2)}%</td>

              {/* MTD total */}
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-indigo-900/30">{totals.mtdRe}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-indigo-900/30">{totals.mtdPs}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-indigo-900/30">{totals.mtdPsRePct.toFixed(2)}%</td>

              {/* PRODUKTIVITAS total */}
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-violet-900/30">{totals.jmlTeknisi}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-violet-900/30">{totals.teknisiPerRe.toFixed(2)}</td>
              <td className="border border-slate-600 px-2 py-2 text-center text-[11px] bg-violet-900/30">{totals.teknisiPerPs.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-1">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />ORDER PI (berdasarkan TGL_MANJA)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />INPROGRESS ORDER (berdasarkan STATUS)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-600 inline-block" />PS TO RE Daily (tanggal dipilih)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />PS TO RE Overall (semua data)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />MTD (bulan berjalan)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" />Produktivitas Teknisi</div>
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <span className="text-emerald-600 font-semibold">≥90%</span>
          <span className="text-blue-600 font-semibold">≥75%</span>
          <span className="text-amber-600 font-semibold">≥50%</span>
          <span className="text-red-600 font-semibold">&lt;50%</span>
        </div>
      </div>
    </div>
  );
}
