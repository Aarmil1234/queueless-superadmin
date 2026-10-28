import { Link } from 'react-router-dom';
import { BedDouble, Building2, ClipboardList, Pill, Siren, Stethoscope, User } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { fmtDate, fmtDateTime, fmtMoney, titleCase } from '../lib/format';
import { Badge, Drawer, ErrorState, KV, SectionTitle, Skeleton, StatusBadge, TD, TH, TR, TableSkeleton } from './ui';

export function AppointmentRows({ rows, loading, onOpen, showHospital = true }) {
  const cols = showHospital ? 7 : 6;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-[13.5px]">
        <thead>
          <tr>
            <th className={TH}>Patient</th>
            {showHospital && <th className={TH}>Hospital</th>}
            <th className={TH}>Doctor</th>
            <th className={TH}>Date &amp; time</th>
            <th className={TH}>Status</th>
            <th className={TH}>Reason</th>
            <th className={`${TH} text-right`}>Amount</th>
          </tr>
        </thead>
        {loading && !rows ? <TableSkeleton cols={cols} /> : (
          <tbody className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {(rows || []).map((a) => (
              <tr key={a._id} className={`${TR} cursor-pointer`} onClick={() => onOpen(a)}>
                <td className={TD}>
                  <div className="font-bold flex items-center gap-1.5">
                    {a.patient?.name || 'Unknown'}
                    {a.isEmergency && <span className="text-bad" title="Emergency"><Siren size={14} aria-label="Emergency" /></span>}
                  </div>
                  <div className="text-xs text-ink-3 tabular-nums">{a.patient?.mobileNumber || '—'}</div>
                </td>
                {showHospital && (
                  <td className={TD}>
                    <div className="font-semibold">{a.hospital?.name || '—'}</div>
                    <div className="text-xs text-ink-3">{a.hospital?.city || ''}</div>
                  </td>
                )}
                <td className={TD}>
                  <div className="font-semibold">{a.doctor?.name || '—'}</div>
                  <div className="text-xs text-ink-3">{a.department?.name || ''}</div>
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  <div className="font-semibold tabular-nums">{fmtDate(a.appointmentDate)}</div>
                  <div className="text-xs text-ink-3 tabular-nums">{a.appointmentTime || a.startTime || '—'}</div>
                </td>
                <td className={TD}><StatusBadge status={a.status} /></td>
                <td className={`${TD} max-w-[200px]`}>
                  <div className="truncate text-ink-2">{a.disease || a.probableDiagnosis || '—'}</div>
                </td>
                <td className={`${TD} text-right font-bold tabular-nums whitespace-nowrap`}>{fmtMoney(a.payableAmount || a.amount)}</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

// Full record for one booking: patient, hospital, every visit, IPD stays.
export function AppointmentDrawer({ appointmentId, onClose }) {
  const { data, loading, error, reload } = useApi('superadmin/appointments/detail', { appointmentId });
  const a = data?.appointment;
  const details = data?.details || [];
  const ipd = data?.ipd || [];
  const latest = details[0];

  return (
    <Drawer
      title="Appointment"
      subtitle={a ? `Booked ${fmtDateTime(a.create)}` : ' '}
      onClose={onClose}
    >
      {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? (
        <div className="flex flex-col gap-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : a && (
        <>
          <div className="flex items-center gap-2.5 flex-wrap mb-5">
            {latest && <StatusBadge status={latest.status === 'Ongoing' ? 'Booked' : latest.status} />}
            {latest?.isEmergency && <Badge tone="bad">Emergency</Badge>}
            {latest?.priority && latest.priority !== 'Normal' && <Badge tone="warn">{latest.priority}</Badge>}
            {latest?.queueNumber && <Badge tone="muted" dot={false}>Queue #{latest.queueNumber}</Badge>}
          </div>

          <SectionTitle icon={User}>Patient</SectionTitle>
          <div className="rounded-lg bg-hover border border-line px-4 py-3.5">
            <KV items={[
              ['Name', a.fullName || a.userId?.fullName],
              ['Mobile', a.mobileNumber || a.userId?.mobileNumber],
              ['Gender', titleCase(a.userId?.gender)],
              ['Date of birth', a.userId?.dob && fmtDate(a.userId.dob)],
              a.userId?.abhaNumber && ['ABHA', a.userId.abhaNumber, true],
            ]} />
          </div>

          <SectionTitle icon={Building2}>Hospital &amp; doctor</SectionTitle>
          <div className="rounded-lg bg-hover border border-line px-4 py-3.5">
            <KV items={[
              ['Hospital', a.hospitalId ? <Link className="text-accent-ink hover:underline" to={`/hospitals/${a.hospitalId._id}`} onClick={onClose}>{a.hospitalId.name}</Link> : null],
              ['City', a.hospitalId?.city],
              ['Doctor', a.doctorId?.name || latest?.doctorId?.name],
              ['Department', latest?.departmentId?.name],
              ['Amount', fmtMoney(a.amount)],
              ['Payable', fmtMoney(a.payableAmount)],
            ]} />
          </div>

          <SectionTitle icon={ClipboardList}>Visits ({details.length})</SectionTitle>
          <div className="flex flex-col gap-3">
            {details.length === 0 && <div className="text-ink-3 text-[13px]">No visit details recorded.</div>}
            {details.map((v) => (
              <div key={v._id} className="rounded-lg bg-hover border border-line px-4 py-3.5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="font-bold tabular-nums">{fmtDate(v.appointmentDate)} · {v.appointmentTime || v.startTime || '—'}</div>
                  <StatusBadge status={v.status === 'Ongoing' ? 'Booked' : v.status} />
                </div>
                <KV items={[
                  ['Complaint', v.chiefComplaints || v.disease],
                  ['Diagnosis', v.probableDiagnosis],
                  ['Checked in', v.checkedInAt && fmtDateTime(v.checkedInAt)],
                  ['Consultation', v.consultStartAt && `${fmtDateTime(v.consultStartAt)}${v.consultEndAt ? ' → done' : ''}`],
                  (v.advice || v.doctorRemarks) && ['Advice', v.advice || v.doctorRemarks, true],
                  v.nextAppointmentDate && ['Follow-up', fmtDate(v.nextAppointmentDate)],
                ]} />
                {v.prescriptions?.length > 0 && (
                  <div className="mt-3.5">
                    <div className="text-[11.5px] text-ink-3 font-bold uppercase tracking-[0.06em] mb-1.5 flex items-center gap-1.5"><Pill size={12} /> Prescription</div>
                    <ul className="flex flex-col gap-1">
                      {v.prescriptions.map((p, i) => (
                        <li key={i} className="text-[13px]">
                          <span className="font-semibold">{p.medicineName}</span>
                          <span className="text-ink-3"> · {[p.timing?.join(', '), p.mealInstruction, p.days && `${p.days} days`].filter(Boolean).join(' · ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {ipd.length > 0 && (
            <>
              <SectionTitle icon={BedDouble}>IPD admission</SectionTitle>
              {ipd.map((s) => (
                <div key={s._id} className="rounded-lg bg-hover border border-line px-4 py-3.5 mb-3">
                  <KV items={[
                    ['Status', s.ipdStatus],
                    ['Admitted', fmtDateTime(s.ipdAdmissionDate)],
                    ['Discharged', s.ipdDischargeDate && fmtDateTime(s.ipdDischargeDate)],
                  ]} />
                </div>
              ))}
            </>
          )}
          <div className="flex items-center gap-1.5 text-xs text-ink-3 mt-5"><Stethoscope size={13} /> Clinical details are read-only here; hospitals edit them in their own panel.</div>
        </>
      )}
    </Drawer>
  );
}
