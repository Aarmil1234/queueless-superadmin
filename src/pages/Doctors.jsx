import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useDebounced, useHospitalOptions, useList } from '../lib/hooks';
import { fmtMoney } from '../lib/format';
import {
  Badge, Card, Empty, Entity, ErrorState, Pager, PageHead, SearchInput, Select, TD, TH, TR, TableSkeleton, Toolbar,
} from '../components/ui';

export default function Doctors() {
  const [params] = useSearchParams();
  const hospitals = useHospitalOptions();
  const [search, setSearch] = useState('');
  const list = useList('superadmin/doctors/list', { hospitalId: params.get('hospitalId') || '', search: '' });
  const debounced = useDebounced(search);
  useEffect(() => { list.setFilter('search', debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const doctors = list.data?.doctors;

  return (
    <>
      <PageHead title="Doctors" sub="All doctors on the network. Hospitals manage their own doctors from their panel." />
      <Card className="overflow-hidden">
        <Toolbar>
          <SearchInput className="flex-[1_1_260px] min-w-[200px]" placeholder="Search name, email or mobile…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select className="flex-[1_1_180px] sm:flex-none sm:w-56" value={list.filters.hospitalId} onChange={(e) => list.setFilter('hospitalId', e.target.value)} aria-label="Hospital">
            <option value="">All hospitals</option>
            {hospitals.map((h) => <option key={h.value} value={h.value}>{h.label}{h.city ? ` · ${h.city}` : ''}</option>)}
          </Select>
        </Toolbar>

        {list.error && !list.data ? <ErrorState message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-[13.5px]">
              <thead>
                <tr>
                  <th className={TH}>Doctor</th>
                  <th className={TH}>Hospital</th>
                  <th className={TH}>Department</th>
                  <th className={TH}>Contact</th>
                  <th className={`${TH} text-right`}>Experience</th>
                  <th className={`${TH} text-right`}>Fee</th>
                  <th className={TH}>Availability</th>
                </tr>
              </thead>
              {list.loading && !doctors ? <TableSkeleton cols={7} /> : (
                <tbody className={list.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  {(doctors || []).map((d) => (
                    <tr key={d._id} className={TR}>
                      <td className={TD}><Entity name={d.name} sub={[d.degree, d.gender].filter(Boolean).join(' · ')} src={d.profile} /></td>
                      <td className={TD}>
                        {d.hospital
                          ? <Link to={`/hospitals/${d.hospital._id}`} className="font-semibold hover:text-accent-ink">{d.hospital.name}</Link>
                          : <span className="text-ink-3">—</span>}
                        <div className="text-xs text-ink-3">{d.hospital?.city || ''}</div>
                      </td>
                      <td className={TD}>{d.department || <span className="text-ink-3">—</span>}</td>
                      <td className={TD}>
                        <div className="font-semibold tabular-nums">{d.mobileNumber || '—'}</div>
                        <div className="text-xs text-ink-3">{d.email || ''}</div>
                      </td>
                      <td className={`${TD} text-right tabular-nums`}>{d.experience ? `${d.experience} yrs` : '—'}</td>
                      <td className={`${TD} text-right font-bold tabular-nums whitespace-nowrap`}>{fmtMoney(d.appointmentCharge)}</td>
                      <td className={TD}><Badge tone={d.isAvailable === false ? 'muted' : 'good'}>{d.isAvailable === false ? 'Away' : 'Available'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            {!list.loading && doctors?.length === 0 && <Empty icon={Stethoscope} title={search || list.filters.hospitalId ? 'No doctors match' : 'No doctors yet'} />}
          </div>
        )}
        <Pager pagination={list.pagination} onPage={list.setPage} noun="doctors" />
      </Card>
    </>
  );
}
