import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useDebounced, useList } from '../lib/hooks';
import { fmtDate, fmtNum, relativeDay, timeAgo, titleCase } from '../lib/format';
import {
  Badge, Card, Empty, Entity, ErrorState, Pager, PageHead, SearchInput, TD, TH, TR, TableSkeleton, Toolbar,
} from '../components/ui';

const age = (dob) => {
  if (!dob) return null;
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 864e5));
  return Number.isFinite(years) && years >= 0 ? `${years} yrs` : null;
};

export default function Patients() {
  const [search, setSearch] = useState('');
  const list = useList('superadmin/patients/list', { search: '' });
  const debounced = useDebounced(search);
  useEffect(() => { list.setFilter('search', debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const patients = list.data?.patients;

  return (
    <>
      <PageHead title="Patients" sub="Accounts registered on the patient app, including family members managed under them." />
      <Card className="overflow-hidden">
        <Toolbar>
          <SearchInput className="flex-[1_1_260px] min-w-[200px] max-w-xl" placeholder="Search name, mobile or ABHA number…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </Toolbar>

        {list.error && !list.data ? <ErrorState message={list.error} onRetry={list.reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-[13.5px]">
              <thead>
                <tr>
                  <th className={TH}>Patient</th>
                  <th className={TH}>Mobile</th>
                  <th className={TH}>ABHA</th>
                  <th className={`${TH} text-right`}>Appointments</th>
                  <th className={`${TH} text-right`}>Hospitals</th>
                  <th className={TH}>Last visited</th>
                  <th className={TH}>Next visit</th>
                  <th className={TH}>Last booking</th>
                  <th className={TH}>Joined</th>
                </tr>
              </thead>
              {list.loading && !patients ? <TableSkeleton cols={9} /> : (
                <tbody className={list.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  {(patients || []).map((p) => (
                    <tr key={p._id} className={TR}>
                      <td className={TD}>
                        <div className="flex items-center gap-2">
                          <Entity name={p.fullName || 'Unnamed'} sub={[titleCase(p.gender), age(p.dob)].filter(Boolean).join(' · ')} src={p.profile} />
                          {p.managedBy && <Badge tone="violet" dot={false}>{p.relation || 'Family'}</Badge>}
                        </div>
                      </td>
                      <td className={`${TD} tabular-nums`}>{p.mobileNumber || <span className="text-ink-3">shared</span>}</td>
                      <td className={TD}>{p.abhaNumber ? <Badge tone="good">{p.abhaNumber}</Badge> : <span className="text-ink-3">—</span>}</td>
                      <td className={`${TD} text-right font-bold tabular-nums`}>{fmtNum(p.appointmentCount)}</td>
                      <td className={`${TD} text-right tabular-nums`}>{fmtNum(p.hospitalsVisited)}</td>
                      <td className={`${TD} whitespace-nowrap tabular-nums`}>
                        {p.lastVisitedAt ? (
                          <>
                            <div className="font-semibold">{fmtDate(p.lastVisitedAt)}</div>
                            <div className="text-xs text-ink-3">{relativeDay(p.lastVisitedAt)}</div>
                          </>
                        ) : <span className="text-ink-3">not yet</span>}
                      </td>
                      <td className={`${TD} whitespace-nowrap tabular-nums`}>
                        {p.nextVisitAt ? (
                          <>
                            <div className="font-semibold text-good">{fmtDate(p.nextVisitAt)}</div>
                            <div className="text-xs text-ink-3">{relativeDay(p.nextVisitAt)}</div>
                          </>
                        ) : <span className="text-ink-3">none booked</span>}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>{p.lastBookedAt ? timeAgo(p.lastBookedAt) : <span className="text-ink-3">never</span>}</td>
                      <td className={`${TD} whitespace-nowrap tabular-nums`}>{fmtDate(p.create)}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            {!list.loading && patients?.length === 0 && <Empty icon={Users} title={search ? 'No patients match' : 'No patients yet'} />}
          </div>
        )}
        <Pager pagination={list.pagination} onPage={list.setPage} noun="patients" />
      </Card>
    </>
  );
}
