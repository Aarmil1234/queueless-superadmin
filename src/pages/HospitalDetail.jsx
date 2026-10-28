import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, BedDouble, CalendarCheck, CalendarDays, Hash, KeyRound, Mail, MapPin, Pencil, Phone, Power,
  PowerOff, Stethoscope, Users,
} from 'lucide-react';
import { useApi } from '../lib/hooks';
import { STATUS_ORDER, fmtDate, fmtMoney, fmtNum, localISODate } from '../lib/format';
import {
  ActiveBadge, Avatar, Badge, Button, Card, CardHead, Empty, ErrorState, Input, Segmented, Skeleton, StatCard, StatusBadge,
} from '../components/ui';
import { BarList } from '../components/charts';
import { AppointmentDrawer, AppointmentRows } from '../components/Appointments';
import { useHospitalActions } from '../components/useHospitalActions';
import { PERIODS, fmtPeriod, periodRange, tzOffsetMinutes } from '../lib/periods';

// The chosen range lives in the URL (?range=&from=&to=) so it survives a
// refresh and can be shared. Returns the YYYY-MM-DD bounds to query, or
// an `invalid` message for an unfinished custom range.
function usePeriod() {
  const [params, setParams] = useSearchParams();
  const range = PERIODS.some((r) => r.value === params.get('range')) ? params.get('range') : 'all';
  const custom = { from: params.get('from') || '', to: params.get('to') || '' };

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  let fromDate = '';
  let toDate = '';
  let invalid = '';
  if (range === 'custom') {
    if (!custom.from || !custom.to) invalid = 'Pick a start and end date.';
    else if (custom.from > custom.to) invalid = 'The start date must be on or before the end date.';
    else ({ from: fromDate, to: toDate } = custom);
  } else {
    [fromDate, toDate] = periodRange(range);
  }

  return {
    range, custom, fromDate, toDate, invalid,
    setRange: (value) => update({ range: value === 'all' ? '' : value }),
    setCustom: (key, value) => update({ [key]: value }),
  };
}

export default function HospitalDetail() {
  const { id } = useParams();
  const period = usePeriod();
  const body = { hospitalId: id, tzOffsetMinutes: tzOffsetMinutes() };
  if (period.fromDate) Object.assign(body, { fromDate: period.fromDate, toDate: period.toDate });
  // An unfinished custom range keeps showing the last valid result.
  const [lastBody, setLastBody] = useState(body);
  const activeBody = period.invalid ? lastBody : body;
  if (!period.invalid && JSON.stringify(body) !== JSON.stringify(lastBody)) setLastBody(body);

  const { data, loading, error, reload } = useApi('superadmin/hospitals/detail', activeBody);
  const { open, dialogs } = useHospitalActions(reload);
  const [openAppt, setOpenAppt] = useState(null);

  if (error && !data) {
    return (
      <Card>
        <ErrorState message={error} onRetry={reload} />
      </Card>
    );
  }

  const h = data?.hospital;
  const s = data?.stats || {};
  // Older backends send no `period`: fall back to the all-time figures.
  const p = data?.period || {
    appointments: s.totalAppointments, uniquePatients: s.uniquePatients, byStatus: s.byStatus, ipdAdmissions: s.admittedIpdPatients,
  };
  const first = loading && !data;
  const refreshing = loading && !first;
  const specs = h ? (Array.isArray(h.specialization) ? h.specialization : [h.specialization]).filter(Boolean) : [];
  const shown = fmtPeriod(activeBody.fromDate, activeBody.toDate);
  const inPeriod = activeBody.fromDate ? 'in this period' : 'all time';
  const rangeQuery = activeBody.fromDate ? `&fromDate=${activeBody.fromDate}&toDate=${activeBody.toDate}` : '';

  return (
    <>
      <Link to="/hospitals" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-2 hover:text-ink mb-4">
        <ArrowLeft size={16} /> All hospitals
      </Link>

      <Card className="relative overflow-hidden p-6 flex items-center gap-4.5 flex-wrap">
        {first ? <Skeleton className="size-14 rounded-xl" /> : <Avatar name={h.name || h.ownerName} src={h.profile} size="lg" />}
        <div className="min-w-0 flex-1">
          {first ? <><Skeleton className="h-7 w-64 mb-2" /><Skeleton className="h-4 w-96 max-w-full" /></> : (
            <>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{h.name || 'Unnamed hospital'}</h1>
                <ActiveBadge active={h.isActive} />
                {h.type && <Badge tone="accent" dot={false}>{h.type}</Badge>}
              </div>
              <div className="flex flex-wrap gap-x-4.5 gap-y-1.5 text-ink-2 text-[13px] mt-2 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5">
                <span><Users size={14} /> {h.ownerName}</span>
                {(h.city || h.state) && <span><MapPin size={14} /> {[h.city, h.state].filter(Boolean).join(', ')}</span>}
                {h.email && <span><Mail size={14} /> {h.email}</span>}
                {h.mobileNumber && <span className="tabular-nums"><Phone size={14} /> {h.mobileNumber}</span>}
                {h.certCode && <span><Hash size={14} /> {h.certCode}</span>}
                <span><CalendarDays size={14} /> Joined {fmtDate(h.create)}</span>
              </div>
            </>
          )}
        </div>
        {!first && (
          <div className="flex gap-2 flex-wrap">
            <Button icon={Pencil} onClick={() => open('edit', h)}>Edit</Button>
            <Button icon={KeyRound} onClick={() => open('reset', h)}>Reset password</Button>
            <Button icon={h.isActive ? PowerOff : Power} variant={h.isActive ? 'danger' : 'success'} onClick={() => open('status', h)}>
              {h.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="mt-4.5">
        <div className="p-3 flex items-center gap-3 flex-wrap">
          <div className="overflow-x-auto max-w-full">
            <Segmented value={period.range} onChange={period.setRange} options={PERIODS} />
          </div>
          <div className="ml-auto text-[13px] text-ink-2 flex items-center gap-1.5">
            <CalendarDays size={15} className="text-ink-3" />
            Showing <b className="text-ink font-semibold">{shown}</b>
          </div>
        </div>
        {period.range === 'custom' && (
          // Input is always w-full, so each date gets a fixed-width wrapper.
          <div className="flex items-end gap-3 flex-wrap px-3 pt-3 pb-3.5 border-t border-line">
            <label className="w-44">
              <span className="block text-xs font-medium text-ink-3 mb-1">From</span>
              <Input type="date" value={period.custom.from} max={period.custom.to || localISODate()} onChange={(e) => period.setCustom('from', e.target.value)} />
            </label>
            <label className="w-44">
              <span className="block text-xs font-medium text-ink-3 mb-1">To</span>
              <Input type="date" value={period.custom.to} min={period.custom.from || undefined} max={localISODate()} onChange={(e) => period.setCustom('to', e.target.value)} />
            </label>
            {period.invalid && <span className="text-[13px] text-warn font-medium pb-2.5">{period.invalid}</span>}
          </div>
        )}
      </Card>

      <div className={`transition-opacity ${refreshing ? 'opacity-60' : ''}`} aria-busy={refreshing}>
      <div className="grid gap-3 sm:gap-4.5 mt-4.5 grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck} label="Appointments" value={fmtNum(p.appointments)} loading={first} tone="var(--sa-info)"
          foot={<span><b>{fmtNum(p.emergencies)}</b> emergency{activeBody.fromDate && <> · <b>{fmtNum(s.totalAppointments)}</b> all time</>}</span>}
        />
        <StatCard icon={Users} label="Patients" value={fmtNum(p.uniquePatients)} loading={first} tone="var(--sa-cyan)" foot={<span>unique, by mobile number</span>} />
        <StatCard
          icon={Stethoscope} label="Doctors" value={fmtNum(s.doctors)} loading={first} tone="var(--sa-violet)"
          foot={<span><b>{fmtNum(p.activeDoctors)}</b> saw patients {inPeriod}</span>}
        />
        <StatCard
          icon={BedDouble} label="IPD admissions" value={fmtNum(p.ipdAdmissions)} loading={first} tone="var(--sa-accent)"
          foot={<span><b>{fmtNum(p.ipdDischarges)}</b> discharged · <b>{fmtNum(s.admittedIpdPatients)}</b> admitted now</span>}
        />
      </div>

      <div className="grid gap-4.5 mt-4.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="p-5.5">
          <CardHead title="Appointment status" sub={activeBody.fromDate ? `Visits in ${shown}` : 'All of this hospital’s appointments'} />
          {first
            ? <div className="flex flex-col gap-4">{STATUS_ORDER.map((st) => <Skeleton key={st} className="h-7" />)}</div>
            : <BarList items={STATUS_ORDER.map((st) => ({ key: st, label: <StatusBadge status={st} />, value: p.byStatus?.[st] || 0 }))} empty="No visits in this period" />}
          {specs.length > 0 && (
            <>
              <div className="text-[11.5px] text-ink-3 font-bold uppercase tracking-[0.06em] mt-6 mb-2">Specializations</div>
              <div className="flex flex-wrap gap-1.5">{specs.map((sp) => <Badge key={sp} tone="muted" dot={false}>{sp}</Badge>)}</div>
            </>
          )}
          {h?.otherSpecialization && <div className="mt-2 text-ink-2 text-[13px]">{h.otherSpecialization}</div>}
        </Card>

        <Card className="p-5.5">
          <CardHead title="Doctors" sub={first ? ' ' : `${fmtNum(data?.doctors?.length)} on staff`}>
            <Link to={`/doctors?hospitalId=${id}`} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent-ink hover:underline">
              Open list <ArrowUpRight size={14} />
            </Link>
          </CardHead>
          {first ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11 my-2" />) : (data.doctors || []).length === 0 ? (
            <Empty icon={Stethoscope} title="No doctors added yet">The hospital adds its doctors from its own panel.</Empty>
          ) : (
            <div className="flex flex-col max-h-[360px] overflow-y-auto -mx-1 px-1">
              {data.doctors.map((d) => (
                <div key={d._id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-b-0">
                  <Avatar name={d.name} src={d.profile} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{d.name}</div>
                    <div className="text-xs text-ink-3 truncate">{[d.department, d.degree, d.experience && `${d.experience} yrs`].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                  <div className="text-right shrink-0 w-20">
                    <div className="font-semibold tabular-nums">{fmtNum(d.periodAppointments)}</div>
                    <div className="text-xs text-ink-3">{d.periodAppointments === 1 ? 'visit' : 'visits'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge tone={d.isAvailable === false ? 'muted' : 'good'}>{d.isAvailable === false ? 'Away' : 'Available'}</Badge>
                    {d.appointmentCharge && <div className="text-xs text-ink-3 mt-1 tabular-nums">{fmtMoney(d.appointmentCharge)} / visit</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden mt-4.5">
        <div className="px-5.5 pt-5.5"><CardHead title="Latest appointments" sub={`The 10 most recent visits · ${shown}`}>
          <Link to={`/appointments?hospitalId=${id}${rangeQuery}`} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent-ink hover:underline">
            See all <ArrowUpRight size={14} />
          </Link>
        </CardHead></div>
        {!first && (data.recentAppointments || []).length === 0
          ? <Empty icon={CalendarCheck} title={activeBody.fromDate ? 'No appointments in this period' : 'No appointments yet'} />
          : <AppointmentRows rows={data?.recentAppointments} loading={first} showHospital={false} onOpen={(a) => setOpenAppt(a.appointmentId)} />}
      </Card>
      </div>

      {openAppt && <AppointmentDrawer appointmentId={openAppt} onClose={() => setOpenAppt(null)} />}
      {dialogs}
    </>
  );
}
