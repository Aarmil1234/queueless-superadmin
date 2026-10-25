import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Eye, KeyRound, Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { useDebounced, useList } from '../lib/hooks';
import { HOSPITAL_TYPES, fmtDate, fmtNum, timeAgo } from '../lib/format';
import {
  ActiveBadge, Badge, Button, Card, Empty, Entity, ErrorState, IconButton, Pager, PageHead, SearchInput, Segmented, Select,
  TD, TH, TR, TableSkeleton, Toolbar,
} from '../components/ui';
import { useHospitalActions } from '../components/useHospitalActions';

export default function Hospitals() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const list = useList('superadmin/hospitals/list', { status: 'all', type: '', search: '' });
  const { open, dialogs } = useHospitalActions(list.reload);
  const debounced = useDebounced(search);

  useEffect(() => { list.setFilter('search', debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sidebar "Register hospital" links here with ?register=1.
  useEffect(() => {
    if (params.get('register')) {
      open('register');
      setParams({}, { replace: true });
    }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const hospitals = list.data?.hospitals || [];
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <>
      <PageHead title="Hospitals" sub="Every hospital on the network, and the admin account that runs it.">
        <Button variant="primary" icon={Plus} onClick={() => open('register')}>Register hospital</Button>
      </PageHead>

      <Card className="overflow-hidden">
        <Toolbar>
          <SearchInput
            className="flex-[1_1_260px] min-w-[200px]"
            placeholder="Search name, owner, email, mobile, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Segmented
            value={list.filters.status}
            onChange={(v) => list.setFilter('status', v)}
            options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />
          <Select className="flex-[1_1_160px] sm:flex-none sm:w-44" value={list.filters.type} onChange={(e) => list.setFilter('type', e.target.value)} aria-label="Hospital type">
            <option value="">All types</option>
            {HOSPITAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Toolbar>

        {list.error && !list.data ? <ErrorState message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-[13.5px]">
              <thead>
                <tr>
                  <th className={TH}>Hospital</th>
                  <th className={TH}>Admin login</th>
                  <th className={TH}>Type</th>
                  <th className={`${TH} text-right`}>Doctors</th>
                  <th className={`${TH} text-right`}>Appointments</th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              {list.loading && !list.data ? <TableSkeleton cols={7} /> : (
                <tbody className={list.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  {hospitals.map((h) => (
                    <tr key={h._id} className={`${TR} cursor-pointer`} onClick={() => navigate(`/hospitals/${h._id}`)}>
                      <td className={TD}>
                        <Entity
                          name={h.name || h.ownerName}
                          sub={[h.ownerName, [h.city, h.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || `since ${fmtDate(h.create)}`}
                          src={h.profile}
                        />
                      </td>
                      <td className={TD}>
                        <div className="font-semibold">{h.email || '—'}</div>
                        <div className="text-xs text-ink-3 tabular-nums">{h.mobileNumber || '—'}</div>
                      </td>
                      <td className={TD}>{h.type ? <Badge tone="accent" dot={false}>{h.type}</Badge> : '—'}</td>
                      <td className={`${TD} text-right font-bold tabular-nums`}>{fmtNum(h.doctorCount)}</td>
                      <td className={`${TD} text-right`}>
                        <div className="font-bold tabular-nums">{fmtNum(h.appointmentCount)}</div>
                        <div className="text-xs text-ink-3 whitespace-nowrap">{h.lastAppointmentAt ? `last ${timeAgo(h.lastAppointmentAt)}` : 'none yet'}</div>
                      </td>
                      <td className={TD}><ActiveBadge active={h.isActive} /></td>
                      <td className={`${TD} text-right`}>
                        <div className="inline-flex gap-1">
                          <IconButton icon={Eye} label="View profile" size="sm" plain onClick={stop(() => navigate(`/hospitals/${h._id}`))} />
                          <IconButton icon={Pencil} label="Edit details" size="sm" plain onClick={stop(() => open('edit', h))} />
                          <IconButton icon={KeyRound} label="Reset admin password" size="sm" plain onClick={stop(() => open('reset', h))} />
                          {/* Distinct icon + colour per state, visible without hovering —
                              a deactivated hospital shows a green "turn back on" button. */}
                          <IconButton
                            icon={h.isActive ? PowerOff : Power}
                            label={h.isActive ? 'Deactivate' : 'Reactivate'}
                            size="sm"
                            plain
                            className={h.isActive
                              ? 'text-bad! hover:bg-bad/10!'
                              : 'text-good! bg-good/10! border-good/25! hover:bg-good/20!'}
                            onClick={stop(() => open('status', h))}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            {!list.loading && hospitals.length === 0 && (
              <Empty icon={Building2} title={search || list.filters.type || list.filters.status !== 'all' ? 'No hospitals match these filters' : 'No hospitals yet'}>
                {!search && <Button variant="primary" size="sm" icon={Plus} className="mt-1" onClick={() => open('register')}>Register the first one</Button>}
              </Empty>
            )}
          </div>
        )}
        <Pager pagination={list.pagination} onPage={list.setPage} noun="hospitals" />
      </Card>

      {dialogs}
    </>
  );
}
