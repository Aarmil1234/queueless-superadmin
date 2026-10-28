import { fmtDate } from './format';

// Date-range presets shared by every filtered page. Calendar periods up to
// today, in the viewer's own calendar days: week = Monday → today,
// month = 1st → today, year = 1 Jan → today.
export const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today', start: (d) => d },
  { value: 'week', label: 'This week', start: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)) },
  { value: 'month', label: 'This month', start: (d) => new Date(d.getFullYear(), d.getMonth(), 1) },
  { value: 'year', label: 'This year', start: (d) => new Date(d.getFullYear(), 0, 1) },
  { value: 'custom', label: 'Custom' },
];

export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Preset → [fromDate, toDate] as YYYY-MM-DD; ['', ''] for all time / custom.
export const periodRange = (value) => {
  const start = PERIODS.find((p) => p.value === value)?.start;
  if (!start) return ['', ''];
  const today = new Date();
  return [ymd(start(today)), ymd(today)];
};

// "28 Oct 2026", "26 Oct 2026 – 28 Oct 2026", "From 1 Oct 2026", "All time".
export const fmtPeriod = (from, to) => {
  if (from && to) return from === to ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to)}`;
  if (from) return `From ${fmtDate(from)}`;
  if (to) return `Up to ${fmtDate(to)}`;
  return 'All time';
};

// Sent with date filters so the backend counts whole days in the viewer's timezone.
export const tzOffsetMinutes = () => new Date().getTimezoneOffset();
