const numberFmt = new Intl.NumberFormat('en-IN');
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const currencyFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const fmtNum = (n) => numberFmt.format(Number(n) || 0);

export const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date);
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFmt.format(date);
};

export const fmtMoney = (v) => {
  if (v === undefined || v === null || v === '') return '—';
  const n = Number(v);
  return Number.isFinite(n) ? currencyFmt.format(n) : String(v);
};

// Whole calendar days from today, for date-only values (appointment dates are
// stored as midnight, so timeAgo would call today's visit "14 hrs ago").
export const relativeDay = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(date) - startOf(new Date())) / 864e5);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};

export const timeAgo = (d) => {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  const units = [[60, 'min'], [24, 'hr'], [30, 'day'], [12, 'mo']];
  let value = diff / 60;
  let unit = 'min';
  for (let i = 1; i < units.length && value >= units[i][0]; i++) {
    value /= units[i][0];
    unit = units[i][1];
  }
  if (unit === 'mo' && value >= 12) return `${Math.floor(value / 12)} yr ago`;
  const v = Math.floor(value);
  return `${v} ${unit}${v === 1 ? '' : 's'} ago`;
};

// MALE -> Male
export const titleCase = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase() : '');

export const initials = (name = '') =>
  String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

// "Today" as YYYY-MM-DD in the viewer's local calendar, for date inputs.
export const localISODate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Appointment status → badge tone + label. Status is never color-only: the
// badge always carries the label text.
export const STATUS_META = {
  Booked: { tone: 'info', label: 'Booked' },
  CheckedIn: { tone: 'cyan', label: 'Checked in' },
  InConsultation: { tone: 'violet', label: 'In consultation' },
  Completed: { tone: 'good', label: 'Completed' },
  NoShow: { tone: 'warn', label: 'No-show' },
  Cancelled: { tone: 'bad', label: 'Cancelled' },
};
export const STATUS_ORDER = ['Booked', 'CheckedIn', 'InConsultation', 'Completed', 'NoShow', 'Cancelled'];

export const HOSPITAL_TYPES = ['Multispeciality', 'Speciality', 'Other'];

export const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology',
  'Neurology', 'ENT', 'Ophthalmology', 'Psychiatry', 'Dentistry', 'General Surgery',
  'Urology', 'Oncology', 'Pulmonology', 'Gastroenterology',
];
