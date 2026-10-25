import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, BedDouble, CalendarCheck, CalendarDays, Hash, KeyRound, Mail, MapPin, Pencil, Phone, Power,
  PowerOff, Stethoscope, Users,
} from 'lucide-react';
import { useApi } from '../lib/hooks';
import { STATUS_ORDER, fmtDate, fmtMoney, fmtNum } from '../lib/format';
import {
  ActiveBadge, Avatar, Badge, Button, Card, CardHead, Empty, ErrorState, Skeleton, StatCard, StatusBadge,
} from '../components/ui';
import { BarList } from '../components/charts';
import { AppointmentDrawer, AppointmentRows } from '../components/Appointments';
import { useHospitalActions } from '../components/useHospitalActions';

export default function HospitalDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi('superadmin/hospitals/detail', { hospitalId: id });
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
  const first = loading && !data;
  const specs = h ? (Array.isArray(h.specialization) ? h.specialization : [h.specialization]).filter(Boolean) : [];

  return (
    <>
      <Link to="/hospitals" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-2 hover:text-ink mb-4">
        <ArrowLeft size={16} /> All hospitals
      </Link>

      <Card className="relative overflow-hidden p-6 flex items-center gap-4.5 flex-wrap">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-brand opacity-[0.12] blur-[60px] pointer-events-none" />
        {first ? <Skeleton className="size-14 rounded-[17px]" /> : <Avatar name={h.name || h.ownerName} src={h.profile} size="lg" />}
        <div className="min-w-0 flex-1">
          {first ? <><Skeleton className="h-7 w-64 mb-2" /><Skeleton className="h-4 w-96 max-w-full" /></> : (
            <>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-[-0.03em]">{h.name || 'Unnamed hospital'}</h1>
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

      <div className="grid gap-3 sm:gap-4.5 mt-4.5 grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Appointments today" value={fmtNum(s.todaysAppointments)} loading={first} tone="var(--sa-info)" foot={<span><b>{fmtNum(s.totalAppointments)}</b> all time</span>} />
        <StatCard icon={Users} label="Unique patients" value={fmtNum(s.uniquePatients)} loading={first} tone="var(--sa-cyan)" foot={<span>by mobile number</span>} />
        <StatCard icon={Stethoscope} label="Doctors" value={fmtNum(s.doctors)} loading={first} tone="var(--sa-violet)" foot={<span><b>{fmtNum((data?.doctors || []).filter((d) => d.isAvailable !== false).length)}</b> available now</span>} />
        <StatCard icon={BedDouble} label="Admitted in IPD" value={fmtNum(s.admittedIpdPatients)} loading={first} tone="var(--sa-accent)" foot={<span>currently admitted</span>} />
      </div>

      <div className="grid gap-4.5 mt-4.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="p-5.5">
          <CardHead title="Appointment status" sub="All of this hospital’s appointments" />
          {first
            ? <div className="flex flex-col gap-4">{STATUS_ORDER.map((st) => <Skeleton key={st} className="h-7" />)}</div>
            : <BarList items={STATUS_ORDER.map((st) => ({ key: st, label: <StatusBadge status={st} />, value: s.byStatus?.[st] || 0 }))} />}
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
        <div className="px-5.5 pt-5.5"><CardHead title="Latest appointments" sub="The 10 most recent visits">
          <Link to={`/appointments?hospitalId=${id}`} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent-ink hover:underline">
            See all <ArrowUpRight size={14} />
          </Link>
        </CardHead></div>
        {!first && (data.recentAppointments || []).length === 0
          ? <Empty icon={CalendarCheck} title="No appointments yet" />
          : <AppointmentRows rows={data?.recentAppointments} loading={first} showHospital={false} onOpen={(a) => setOpenAppt(a.appointmentId)} />}
      </Card>

      {openAppt && <AppointmentDrawer appointmentId={openAppt} onClose={() => setOpenAppt(null)} />}
      {dialogs}
    </>
  );
}
