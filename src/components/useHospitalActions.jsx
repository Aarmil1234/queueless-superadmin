import { useState } from 'react';
import { api } from '../lib/api';
import { invalidateHospitalOptions } from '../lib/hooks';
import { HospitalFormModal, ResetPasswordModal } from './HospitalForms';
import { useToast } from './Toast';
import { Confirm } from './ui';

// One place for the hospital actions both the list and the profile page offer.
// Usage: const { open, dialogs } = useHospitalActions(reload); open('edit', h); render {dialogs}.
export function useHospitalActions(onChanged) {
  const toast = useToast();
  const [state, setState] = useState(null); // { kind, hospital }
  const [busy, setBusy] = useState(false);
  const close = () => setState(null);

  const toggleStatus = async () => {
    const { hospital } = state;
    setBusy(true);
    try {
      await api('superadmin/hospitals/status', { hospitalId: hospital._id, active: !hospital.isActive });
      toast(hospital.isActive ? `${hospital.name} deactivated` : `${hospital.name} is active again`);
      invalidateHospitalOptions();
      close();
      onChanged?.();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  let dialogs = null;
  if (state?.kind === 'register') dialogs = <HospitalFormModal onClose={close} onSaved={onChanged} />;
  if (state?.kind === 'edit') dialogs = <HospitalFormModal hospital={state.hospital} onClose={close} onSaved={onChanged} />;
  if (state?.kind === 'reset') dialogs = <ResetPasswordModal hospital={state.hospital} onClose={close} />;
  if (state?.kind === 'status') {
    const active = state.hospital.isActive;
    dialogs = (
      <Confirm
        title={active ? 'Deactivate hospital?' : 'Reactivate hospital?'}
        message={active
          ? `${state.hospital.name} will be hidden from patient search and its admin won’t be able to sign in. Its data is kept, and you can reactivate it any time.`
          : `${state.hospital.name} will appear in patient search again and its admin can sign in.`}
        confirmLabel={active ? 'Deactivate' : 'Reactivate'}
        tone={active ? 'danger' : 'success'}
        loading={busy}
        onConfirm={toggleStatus}
        onClose={close}
      />
    );
  }

  return { open: (kind, hospital) => setState({ kind, hospital }), dialogs };
}
