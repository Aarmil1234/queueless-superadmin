import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarX2, Siren } from 'lucide-react';
import { useDebounced, useHospitalOptions, useList } from '../lib/hooks';
import { STATUS_META, STATUS_ORDER, localISODate } from '../lib/format';
import { Card, Empty, ErrorState, Input, Pager, PageHead, SearchInput, Segmented, Select, Toolbar, cx } from '../components/ui';
import { AppointmentDrawer, AppointmentRows } from '../components/Appointments';

const PRESETS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'custom', label: 'Custom' },
];

const presetRange = (p) => ({
  today: [localISODate(), localISODate()],
  '7d': [localISODate(-6), localISODate()],
  '30d': [localISODate(-29), localISODate()],
}[p] || ['', '']);

export default function Appointments() {
  const [params] = useSearchParams();
  const hospitals = useHospitalOptions();
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState('all');
  const [openId, setOpenId] = useState(null);
  const list = useList('superadmin/appointments/list', {
    hospitalId: params.get('hospitalId') || '', status: '', search: '', fromDate: '', toDate: '', isEmergency: '',
  });
  const debounced = useDebounced(search);
  useEffect(() => { list.setFilter('search', debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const choosePreset = (p) => {
    setPreset(p);
    if (p === 'custom') return;
    const [from, to] = presetRange(p);
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
              'inline-flex items-center gap-2 h-[42px] px-3.5 rounded-xl border text-[13px] font-bold cursor-pointer transition',
              filters.isEmergency === true ? 'text-bad border-bad/40 bg-bad/10' : 'text-ink-2 border-field-border bg-field hover:border-ink-3'
            )}
          >
            <Siren size={15} /> Emergency only
          </button>
        </Toolbar>
        <div className="flex items-center gap-2.5 flex-wrap px-3.5 py-3 border-b border-line">
          <Segmented value={preset} onChange={choosePreset} options={PRESETS} />
          {preset === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Input type="date" className="w-40" value={filters.fromDate} max={filters.toDate || undefined} onChange={(e) => list.setFilter('fromDate', e.target.value)} aria-label="From date" />
              <span className="text-ink-3">to</span>
              <Input type="date" className="w-40" value={filters.toDate} min={filters.fromDate || undefined} onChange={(e) => list.setFilter('toDate', e.target.value)} aria-label="To date" />
            </div>
          )}
        </div>

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
