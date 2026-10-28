import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarX2, Siren } from 'lucide-react';
import { useDebounced, useHospitalOptions, useList } from '../lib/hooks';
import { STATUS_META, STATUS_ORDER, localISODate } from '../lib/format';
import { PERIODS, fmtPeriod, periodRange, tzOffsetMinutes } from '../lib/periods';
import { Card, Empty, ErrorState, Input, Pager, PageHead, SearchInput, Segmented, Select, Toolbar, cx } from '../components/ui';
import { AppointmentDrawer, AppointmentRows } from '../components/Appointments';

export default function Appointments() {
  const [params] = useSearchParams();
  const hospitals = useHospitalOptions();
  const [search, setSearch] = useState('');
  // A date range can arrive in the URL (e.g. "See all" from a hospital profile).
  const [preset, setPreset] = useState(() => (params.get('fromDate') || params.get('toDate') ? 'custom' : 'all'));
  const [openId, setOpenId] = useState(null);
  const list = useList('superadmin/appointments/list', {
    hospitalId: params.get('hospitalId') || '', status: '', search: '',
    fromDate: params.get('fromDate') || '', toDate: params.get('toDate') || '', isEmergency: '',
    tzOffsetMinutes: tzOffsetMinutes(),
  });
  const debounced = useDebounced(search);
  useEffect(() => { list.setFilter('search', debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const choosePreset = (p) => {
    setPreset(p);
    if (p === 'custom') return;
    const [from, to] = periodRange(p);
    list.setFilter('fromDate', from);
    list.setFilter('toDate', to);
  };

  const { filters } = list;
  const rows = list.data?.appointments;
  const filtered = search || filters.hospitalId || filters.status || filters.fromDate || filters.toDate || filters.isEmergency;

  return (
    <>
      <PageHead title="Appointments" sub="Every booking across the network. Open one to see the full visit record." />

      <Card className="overflow-hidden">
        <Toolbar>
          <SearchInput
            className="flex-[1_1_240px] min-w-[200px]"
            placeholder="Search patient name or mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select className="flex-[1_1_180px] sm:flex-none sm:w-52" value={filters.hospitalId} onChange={(e) => list.setFilter('hospitalId', e.target.value)} aria-label="Hospital">
            <option value="">All hospitals</option>
            {hospitals.map((h) => <option key={h.value} value={h.value}>{h.label}{h.city ? ` · ${h.city}` : ''}</option>)}
          </Select>
          <Select className="flex-[1_1_150px] sm:flex-none sm:w-44" value={filters.status} onChange={(e) => list.setFilter('status', e.target.value)} aria-label="Status">
            <option value="">Any status</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </Select>
          <button
            type="button"
            aria-pressed={filters.isEmergency === true}
            onClick={() => list.setFilter('isEmergency', filters.isEmergency === true ? '' : true)}
            className={cx(
              'inline-flex items-center gap-2 h-10 px-3.5 rounded-lg border text-[13px] font-semibold cursor-pointer transition-colors',
              filters.isEmergency === true ? 'text-bad border-bad/40 bg-bad/10' : 'text-ink-2 border-field-border bg-field hover:bg-hover'
            )}
          >
            <Siren size={15} /> Emergency only
          </button>
        </Toolbar>
        <div className="flex items-center gap-3 flex-wrap px-3.5 py-3 border-b border-line">
          <div className="overflow-x-auto max-w-full">
            <Segmented value={preset} onChange={choosePreset} options={PERIODS} />
          </div>
          <div className="ml-auto text-[13px] text-ink-2 flex items-center gap-1.5">
            <CalendarDays size={15} className="text-ink-3" />
            Showing <b className="text-ink font-semibold">{fmtPeriod(filters.fromDate, filters.toDate)}</b>
          </div>
        </div>
        {preset === 'custom' && (
          // Input is always w-full, so each date gets a fixed-width wrapper.
          <div className="flex items-end gap-3 flex-wrap px-3.5 pt-3 pb-3.5 border-b border-line">
            <label className="w-44">
              <span className="block text-xs font-medium text-ink-3 mb-1">From</span>
              <Input type="date" value={filters.fromDate} max={filters.toDate || localISODate()} onChange={(e) => list.setFilter('fromDate', e.target.value)} />
            </label>
            <label className="w-44">
              <span className="block text-xs font-medium text-ink-3 mb-1">To</span>
              <Input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(e) => list.setFilter('toDate', e.target.value)} />
            </label>
            {filters.fromDate && filters.toDate && filters.fromDate > filters.toDate && (
              <span className="text-[13px] text-warn font-medium pb-2.5">The start date must be on or before the end date.</span>
            )}
          </div>
        )}

        {list.error && !list.data ? <ErrorState message={list.error} onRetry={list.reload} /> : (
          <>
            <AppointmentRows rows={rows} loading={list.loading} onOpen={(a) => setOpenId(a.appointmentId)} />
            {!list.loading && rows?.length === 0 && (
              <Empty icon={CalendarX2} title={filtered ? 'No appointments match these filters' : 'No appointments yet'}>
                {filtered && 'Try a wider date range or clear a filter.'}
              </Empty>
            )}
          </>
        )}
        <Pager pagination={list.pagination} onPage={list.setPage} noun="appointments" />
      </Card>

      {openId && <AppointmentDrawer appointmentId={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}
