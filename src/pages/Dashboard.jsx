import { Link } from 'react-router-dom';
import {
  Activity, ArrowUpRight, BedDouble, Building2, CalendarCheck, CalendarDays, RefreshCw, Siren, Stethoscope, Users,
} from 'lucide-react';
import { useApi } from '../lib/hooks';
import { session } from '../lib/api';
import { STATUS_ORDER, fmtNum, timeAgo } from '../lib/format';
import { ActiveBadge, Avatar, Card, CardHead, ErrorState, IconButton, PageHead, Skeleton, StatCard, StatusBadge } from '../components/ui';
import { BarList, TrendChart } from '../components/charts';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const { data, loading, error, reload } = useApi('superadmin/dashboard', { tzOffsetMinutes: new Date().getTimezoneOffset() });
  const name = (session.user?.fullName || '').split(' ')[0];

  if (error && !data) return <Card><ErrorState message={error} onRetry={reload} /></Card>;

  const d = data || {};
  const appts = d.appointments || {};
  const statusItems = STATUS_ORDER.map((s) => ({ key: s, label: <StatusBadge status={s} />, value: appts.byStatus?.[s] || 0 }));
  const weekTotal = (d.weeklyData || []).reduce((s, w) => s + w.appointments, 0);

  return (
    <>
      <PageHead
        title={`${greeting()}${name ? `, ${name}` : ''}`}
        sub="Here’s what’s happening across your hospital network."
      >
        <span className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-glass-strong border border-field-border text-[13px] font-semibold text-ink-2">
          <CalendarDays size={16} />
          {new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        </span>
        <IconButton icon={RefreshCw} label="Refresh" onClick={reload} className={loading ? '[&_svg]:animate-spin' : ''} />
      </PageHead>

      <div className="grid gap-3 sm:gap-4.5 grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Hospitals"
          loading={loading && !data}
          value={fmtNum(d.hospitals?.total)}
          tone="var(--sa-accent)"
          foot={<><span><b>{fmtNum(d.hospitals?.active)}</b> active</span><span><b>{fmtNum(d.hospitals?.inactive)}</b> inactive</span></>}
        />
        <StatCard
          icon={CalendarCheck}
          label="Appointments today"
          loading={loading && !data}
          value={fmtNum(appts.today)}
          tone="var(--sa-info)"
          foot={<span><b>{fmtNum(appts.total)}</b> all time</span>}
        />
        <StatCard
          icon={Stethoscope}
          label="Doctors"
          loading={loading && !data}
          value={fmtNum(d.totalDoctors)}
          tone="var(--sa-violet)"
          foot={<span>across all hospitals</span>}
        />
        <StatCard
          icon={Users}
          label="Registered patients"
          loading={loading && !data}
          value={fmtNum(d.totalPatients)}
          tone="var(--sa-cyan)"
          foot={
            <>
              <span className="inline-flex items-center gap-1"><Siren size={12} /> <b>{fmtNum(appts.emergency)}</b> emergency</span>
              <span className="inline-flex items-center gap-1"><BedDouble size={12} /> <b>{fmtNum(d.admittedIpdPatients)}</b> in IPD</span>
            </>
          }
        />
      </div>

      <div className="grid gap-4.5 mt-4.5 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <Card className="p-5.5">
          <CardHead title="Appointments, last 7 days" sub={loading && !data ? ' ' : `${fmtNum(weekTotal)} visits scheduled this week`}>
            <Link to="/appointments" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent-ink hover:underline">
              View all <ArrowUpRight size={14} />
            </Link>
          </CardHead>
          {loading && !data ? <Skeleton className="h-[270px] w-full rounded-xl" /> : (
            <TrendChart
              data={(d.weeklyData || []).map((w) => ({ ...w, tipLabel: new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(`${w.date}T00:00`)) }))}
              xKey="day"
              yKey="appointments"
              label="Appointments per day, last 7 days"
            />
          )}
        </Card>

        <Card className="p-5.5">
          <CardHead title="Appointment status" sub="All appointments on the platform" />
          {loading && !data
            ? <div className="flex flex-col gap-4">{STATUS_ORDER.map((s) => <Skeleton key={s} className="h-7" />)}</div>
            : <BarList items={statusItems} />}
        </Card>
      </div>

      <div className="grid gap-4.5 mt-4.5 xl:grid-cols-2">
        <Card className="p-5.5">
          <CardHead title="Busiest hospitals" sub="By total appointments">
            <Activity size={18} className="text-ink-3" />
          </CardHead>
          {loading && !data
            ? <div className="flex flex-col gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-7" />)}</div>
            : (
              <BarList
                empty="No appointments booked yet"
                items={(d.topHospitals || []).map((h, i) => ({
                  key: h.hospitalId,
                  title: h.name,
                  value: h.appointments,
                  label: (
                    <Link to={`/hospitals/${h.hospitalId}`} className="flex items-center gap-2 min-w-0 hover:text-accent-ink">
                      <span className="text-ink-3 tabular-nums w-4">{i + 1}</span>
                      <span className="truncate">{h.name}</span>
                      {h.city && <span className="text-ink-3 font-medium truncate">· {h.city}</span>}
                    </Link>
                  ),
                }))}
              />
            )}
        </Card>

        <Card className="p-5.5">
          <CardHead title="Recently onboarded" sub="Newest hospitals on the network">
            <Link to="/hospitals" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-accent-ink hover:underline">
              All hospitals <ArrowUpRight size={14} />
            </Link>
          </CardHead>
          <div className="flex flex-col">
            {loading && !data
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 my-1.5" />)
              : (d.recentHospitals || []).length === 0
                ? <div className="text-ink-3 text-[13px] py-6 text-center">No hospitals yet</div>
                : d.recentHospitals.map((h) => (
                  <Link
                    key={h._id}
                    to={`/hospitals/${h._id}`}
                    className="flex items-center gap-3 py-2.5 px-1 border-b border-line last:border-b-0 rounded-lg hover:bg-hover transition"
                  >
                    <Avatar name={h.name || h.ownerName} />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{h.name || '—'}</div>
                      <div className="text-xs text-ink-3 truncate">{[h.ownerName, h.city].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <ActiveBadge active={h.isActive} />
                      <div className="text-[11.5px] text-ink-3 mt-1">{timeAgo(h.create)}</div>
                    </div>
                  </Link>
                ))}
          </div>
        </Card>
      </div>
    </>
  );
}
