import { useMemo } from 'react';
import type { ExcelData } from '@/types';

export interface AreaRow {
  serviceArea: string;
  hsa: string;
  osa: string;
  // ORDER PI
  manjaExp: number;
  manjaHi: number;
  nonHPlus: number;
  totalOrderPI: number;
  // INPROGRESS ORDER
  contwork: number;
  instComp: number;
  actComp: number;
  valstart: number;
  valcomp: number;
  totalInprogress: number;
  // PS TO RE - Daily (hari ini)
  psHi: number;
  reHi: number;
  psReHiPct: number;
  // PS TO RE - Overall
  psTotal: number;
  reTotal: number;
  psReTotalPct: number;
  // MTD
  mtdRe: number;
  mtdPs: number;
  mtdPsRePct: number;
  // PRODUKTIVITAS TEKNISI
  jmlTeknisi: number;
  teknisiPerRe: number;
  teknisiPerPs: number;
}

function parseFlexibleDate(val: string | number | null): Date | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;

  // Try ISO / standard date string
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // Try DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1]);
    const month = parseInt(dmyMatch[2]) - 1;
    let year = parseInt(dmyMatch[3]);
    if (year < 100) year += 2000;
    const d2 = new Date(year, month, day);
    if (!isNaN(d2.getTime())) return d2;
  }

  // Excel serial number
  const num = Number(s);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const epoch = new Date(1900, 0, 1);
    epoch.setDate(epoch.getDate() + num - 2);
    return epoch;
  }

  return null;
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pct(ps: number, re: number): number {
  if (re === 0) return 0;
  return parseFloat(((ps / re) * 100).toFixed(2));
}

export function useDashboard2(data: ExcelData, selectedDate: string) {
  return useMemo(() => {
    const h = data.headers;
    const rows = data.rows;

    // Helper: find column index (case-insensitive, ignores spaces/underscores)
    const col = (names: string[]): number => {
      for (const name of names) {
        const idx = h.findIndex(
          hh => String(hh).toUpperCase().replace(/[\s_]/g, '') === name.toUpperCase().replace(/[\s_]/g, '')
        );
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const idxSto        = col(['STO', 'SERVICEAREA', 'SERVICE_AREA', 'AREA', 'KOTA']);
    const idxDateCreated= col(['DATECREATED', 'DATE_CREATED', 'TANGGAL', 'TGLCREATED']);
    const idxTglManja   = col(['TGL_MANJA', 'TGLMANJA', 'MANJA']);
    const idxStatus     = col(['STATUS']);
    const idxStatusDate = col(['STATUSDATE', 'STATUS_DATE', 'TGLPS', 'TGL_PS']);
    const idxChiefCode  = col(['CHIEF_CODE', 'CHIEFCODE', 'NIK', 'TEKNISI_ID']);
    const idxRe         = col(['RE']);

    const today = new Date();
    const todayStr = toDateString(today);
    const selectedDateObj = selectedDate ? new Date(selectedDate) : today;
    const selectedDateStr = toDateString(selectedDateObj);
    const currentMonth = selectedDateObj.getMonth();
    const currentYear = selectedDateObj.getFullYear();

    // Group rows by service area
    const areaMap: Record<string, typeof rows> = {};

    rows.forEach(row => {
      const area = idxSto >= 0 ? String(row[idxSto] || '').trim().toUpperCase() : 'UNKNOWN';
      if (!area) return;
      if (!areaMap[area]) areaMap[area] = [];
      areaMap[area].push(row);
    });

    const areaRows: AreaRow[] = Object.entries(areaMap).map(([area, areaData]) => {
      // ── ORDER PI (berdasarkan TGL_MANJA) ──────────────────────────
      let manjaExp = 0, manjaHi = 0, nonHPlus = 0;
      const selectedMidnight = new Date(selectedDateStr + 'T00:00:00');

      areaData.forEach(row => {
        const tglManja = idxTglManja >= 0 ? parseFlexibleDate(row[idxTglManja]) : null;
        const status = idxStatus >= 0 ? String(row[idxStatus] || '').toUpperCase().trim() : '';
        // Only count non-completed orders for ORDER PI
        if (status === 'COMPWORK' || status === 'CANCLWORK') return;

        if (!tglManja) {
          nonHPlus++;
        } else {
          const mStr = toDateString(tglManja);
          if (mStr < selectedDateStr) manjaExp++;
          else if (mStr === selectedDateStr) manjaHi++;
          else nonHPlus++;
        }
      });

      // ── INPROGRESS ORDER (berdasarkan STATUS) ─────────────────────
      let contwork = 0, instComp = 0, actComp = 0, valstart = 0, valcomp = 0;
      areaData.forEach(row => {
        const status = idxStatus >= 0 ? String(row[idxStatus] || '').toUpperCase().trim() : '';
        if (status === 'CONTWORK' || status === 'STARTWORK') contwork++;
        else if (status === 'INSTCOMP') instComp++;
        else if (status === 'ACTCOMP') actComp++;
        else if (status === 'VALSTART') valstart++;
        else if (status === 'VALCOMP') valcomp++;
      });

      // ── PS TO RE - DAILY (Hari ini / tanggal dipilih) ─────────────
      let psHi = 0, reHi = 0;
      areaData.forEach(row => {
        // RE HI: orders created on selected date
        const dateCreated = idxDateCreated >= 0 ? parseFlexibleDate(row[idxDateCreated]) : null;
        if (dateCreated && toDateString(dateCreated) === selectedDateStr) reHi++;

        // PS HI: orders completed (COMPWORK) on selected date
        const statusDate = idxStatusDate >= 0 ? parseFlexibleDate(row[idxStatusDate]) : null;
        const status = idxStatus >= 0 ? String(row[idxStatus] || '').toUpperCase().trim() : '';
        if (status === 'COMPWORK' && statusDate && toDateString(statusDate) === selectedDateStr) psHi++;
      });

      // ── PS TO RE - OVERALL ────────────────────────────────────────
      let psTotal = 0, reTotal = 0;
      areaData.forEach(row => {
        reTotal++;
        const status = idxStatus >= 0 ? String(row[idxStatus] || '').toUpperCase().trim() : '';
        if (status === 'COMPWORK') psTotal++;
      });

      // ── MTD (bulan berjalan sesuai tanggal dipilih) ────────────────
      let mtdRe = 0, mtdPs = 0;
      areaData.forEach(row => {
        const dateCreated = idxDateCreated >= 0 ? parseFlexibleDate(row[idxDateCreated]) : null;
        if (dateCreated && dateCreated.getMonth() === currentMonth && dateCreated.getFullYear() === currentYear) {
          mtdRe++;
          const status = idxStatus >= 0 ? String(row[idxStatus] || '').toUpperCase().trim() : '';
          if (status === 'COMPWORK') {
            const statusDate = idxStatusDate >= 0 ? parseFlexibleDate(row[idxStatusDate]) : null;
            if (statusDate && statusDate.getMonth() === currentMonth && statusDate.getFullYear() === currentYear) {
              mtdPs++;
            }
          }
        }
      });

      // ── PRODUKTIVITAS TEKNISI ─────────────────────────────────────
      const teknisiSet = new Set<string>();
      areaData.forEach(row => {
        if (idxChiefCode >= 0) {
          const code = String(row[idxChiefCode] || '').trim();
          if (code) teknisiSet.add(code);
        }
      });
      const jmlTeknisi = teknisiSet.size;

      const totalInprogress = contwork + instComp + actComp + valstart + valcomp;
      const totalOrderPI = manjaExp + manjaHi + nonHPlus;

      return {
        serviceArea: area,
        hsa: '',
        osa: '',
        // ORDER PI
        manjaExp,
        manjaHi,
        nonHPlus,
        totalOrderPI,
        // INPROGRESS
        contwork,
        instComp,
        actComp,
        valstart,
        valcomp,
        totalInprogress,
        // PS TO RE Daily
        psHi,
        reHi,
        psReHiPct: pct(psHi, reHi),
        // PS TO RE Overall
        psTotal,
        reTotal,
        psReTotalPct: pct(psTotal, reTotal),
        // MTD
        mtdRe,
        mtdPs,
        mtdPsRePct: pct(mtdPs, mtdRe),
        // PRODUKTIVITAS
        jmlTeknisi,
        teknisiPerRe: reTotal > 0 && jmlTeknisi > 0 ? parseFloat((jmlTeknisi / reTotal).toFixed(2)) : 0,
        teknisiPerPs: psTotal > 0 && jmlTeknisi > 0 ? parseFloat((jmlTeknisi / psTotal).toFixed(2)) : 0,
      };
    });

    // Sort by service area name
    areaRows.sort((a, b) => a.serviceArea.localeCompare(b.serviceArea));

    // ── TOTALS ROW ────────────────────────────────────────────────────
    const sum = (key: keyof AreaRow) => areaRows.reduce((acc, r) => acc + (r[key] as number), 0);

    const totals: AreaRow = {
      serviceArea: 'TOTAL',
      hsa: '',
      osa: '',
      manjaExp: sum('manjaExp'),
      manjaHi: sum('manjaHi'),
      nonHPlus: sum('nonHPlus'),
      totalOrderPI: sum('totalOrderPI'),
      contwork: sum('contwork'),
      instComp: sum('instComp'),
      actComp: sum('actComp'),
      valstart: sum('valstart'),
      valcomp: sum('valcomp'),
      totalInprogress: sum('totalInprogress'),
      psHi: sum('psHi'),
      reHi: sum('reHi'),
      psReHiPct: pct(sum('psHi'), sum('reHi')),
      psTotal: sum('psTotal'),
      reTotal: sum('reTotal'),
      psReTotalPct: pct(sum('psTotal'), sum('reTotal')),
      mtdRe: sum('mtdRe'),
      mtdPs: sum('mtdPs'),
      mtdPsRePct: pct(sum('mtdPs'), sum('mtdRe')),
      jmlTeknisi: sum('jmlTeknisi'),
      teknisiPerRe: 0,
      teknisiPerPs: 0,
    };

    if (totals.reTotal > 0 && totals.jmlTeknisi > 0) {
      totals.teknisiPerRe = parseFloat((totals.jmlTeknisi / totals.reTotal).toFixed(2));
    }
    if (totals.psTotal > 0 && totals.jmlTeknisi > 0) {
      totals.teknisiPerPs = parseFloat((totals.jmlTeknisi / totals.psTotal).toFixed(2));
    }

    return { areaRows, totals, todayStr, selectedDateStr };
  }, [data, selectedDate]);
}
