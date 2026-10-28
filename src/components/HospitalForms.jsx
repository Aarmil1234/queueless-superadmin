import { useRef, useState } from 'react';
import { Check, Copy, Eye, EyeOff, ImagePlus, KeyRound, PartyPopper, Wand2 } from 'lucide-react';
import { api } from '../lib/api';
import { HOSPITAL_TYPES, SPECIALIZATIONS } from '../lib/format';
import { invalidateHospitalOptions } from '../lib/hooks';
import { useToast } from './Toast';
import { Alert, Button, Field, IconButton, Input, Modal, Select, cx, inputCls } from './ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\d{10}$/;

export const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};

function SectionLabel({ children }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-2.5 pt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3 after:content-[''] after:flex-1 after:h-px after:bg-line">
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, invalid, withGenerate = true }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          className={cx(inputCls, 'pr-11 font-mono tracking-wide', invalid && 'border-bad')}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="At least 6 characters"
        />
        <IconButton
          icon={show ? EyeOff : Eye}
          label={show ? 'Hide password' : 'Show password'}
          size="sm"
          plain
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={() => setShow((s) => !s)}
        />
      </div>
      {withGenerate && (
        <Button type="button" icon={Wand2} onClick={() => { onChange(generatePassword()); setShow(true); }}>
          Generate
        </Button>
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      icon={done ? Check : Copy}
      variant={done ? 'success' : 'default'}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ }
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </Button>
  );
}

const emptyForm = {
  name: '', ownerName: '', type: 'Speciality', specialization: '', specializations: [], otherSpecialization: '',
  email: '', mobileNumber: '', password: '',
  address: '', city: '', state: '', pincode: '', socialMediaLinks: '',
};

const fromHospital = (h) => {
  const specs = Array.isArray(h.specialization) ? h.specialization : h.specialization ? [h.specialization] : [];
  return {
    ...emptyForm,
    name: h.name || '', ownerName: h.ownerName || '', type: h.type || 'Speciality',
    specialization: specs[0] || '', specializations: specs, otherSpecialization: h.otherSpecialization || '',
    email: h.email || '', mobileNumber: h.mobileNumber || '',
    address: h.address || '', city: h.city || '', state: h.state || '', pincode: h.pincode || '',
    socialMediaLinks: h.socialMediaLinks || '',
  };
};

// Register (no `hospital`) or edit (with `hospital`). Registration creates the
// hospital admin's login, so it ends on a screen with the credentials to share.
export function HospitalFormModal({ hospital, onClose, onSaved }) {
  const isEdit = Boolean(hospital);
  const toast = useToast();
  const [form, setForm] = useState(() => (isEdit ? fromHospital(hospital) : emptyForm));
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const fileRef = useRef(null);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const bind = (key) => ({ value: form[key], onChange: (e) => set(key)(e.target.value), invalid: Boolean(errors[key]) });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Hospital name is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!MOBILE_RE.test(form.mobileNumber.trim())) e.mobileNumber = 'Enter a 10-digit mobile number';
    if (!isEdit && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.type === 'Multispeciality' && form.specializations.length === 0) e.specialization = 'Pick at least one specialization';
    if (form.type === 'Other' && !form.otherSpecialization.trim()) e.otherSpecialization = 'Describe the specialization';
    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Pincode is 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      name: form.name.trim(), ownerName: form.ownerName.trim(), type: form.type,
      email: form.email.trim(), mobileNumber: form.mobileNumber.trim(),
      address: form.address.trim(), city: form.city.trim(), state: form.state.trim(),
      pincode: form.pincode.trim(), socialMediaLinks: form.socialMediaLinks.trim(),
    };
    if (form.type === 'Multispeciality') payload.specialization = form.specializations;
    else if (form.type === 'Speciality') payload.specialization = form.specialization ? [form.specialization] : [];
    else { payload.specialization = []; payload.otherSpecialization = form.otherSpecialization.trim(); }

    setSaving(true);
    try {
      if (isEdit) {
        const body = { hospitalId: hospital._id, ...payload, ...(profile ? { profile } : {}) };
        const res = await api('superadmin/hospitals/update', body, { formData: Boolean(profile) });
        toast('Hospital details saved');
        invalidateHospitalOptions();
        onSaved?.(res.data);
        onClose();
      } else {
        const res = await api('superadmin/hospitals/register', { ...payload, password: form.password, ...(profile ? { profile } : {}) }, { formData: true });
        invalidateHospitalOptions();
        onSaved?.(res.data);
        setCreated({ ...res.data, password: form.password });
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    const creds = `Queueless hospital admin login\nHospital: ${created.name}\nLogin: ${created.email} (or ${created.mobileNumber})\nPassword: ${created.password}`;
    return (
      <Modal
        size="sm"
        title="Hospital registered"
        subtitle={created.name}
        onClose={onClose}
        footer={<Button variant="primary" onClick={onClose}>Done</Button>}
      >
        <div className="flex flex-col items-center text-center gap-2 mb-5">
          <div className="size-14 rounded-xl grid place-items-center bg-good/10 text-good border border-good/25"><PartyPopper size={26} /></div>
          <p className="text-ink-2">The hospital admin can sign in to the hospital panel with these details. Share them securely — the password isn’t shown again.</p>
        </div>
        <div className="rounded-xl bg-hover border border-line p-4 font-mono text-[13px] leading-7">
          <div><span className="text-ink-3">Login&nbsp;&nbsp;&nbsp;</span> {created.email}</div>
          <div><span className="text-ink-3">Mobile&nbsp;&nbsp;</span> {created.mobileNumber}</div>
          <div><span className="text-ink-3">Password</span> {created.password}</div>
          {created.certCode && <div><span className="text-ink-3">Code&nbsp;&nbsp;&nbsp;&nbsp;</span> {created.certCode}</div>}
        </div>
        <div className="flex justify-end mt-3"><CopyButton text={creds} /></div>
      </Modal>
    );
  }

  return (
    <Modal
      title={isEdit ? 'Edit hospital' : 'Register a hospital'}
      subtitle={isEdit ? hospital.name : 'Creates the hospital and its admin login in one step.'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="hospital-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Register hospital'}
          </Button>
        </>
      }
    >
      <form id="hospital-form" onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {serverError && <div className="sm:col-span-2"><Alert>{serverError}</Alert></div>}

        <div
          className="sm:col-span-2 flex items-center gap-3.5 p-3.5 rounded-lg border-[1.5px] border-dashed border-field-border bg-field cursor-pointer transition hover:border-accent hover:bg-accent/5"
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
        >
          <div className="size-13 rounded-lg grid place-items-center bg-hover text-ink-3 overflow-hidden shrink-0">
            {preview ? <img src={preview} alt="" className="size-full object-cover" /> : <ImagePlus size={22} />}
          </div>
          <div className="min-w-0">
            <div className="font-bold">{profile ? profile.name : 'Hospital logo or photo'}</div>
            <div className="text-xs text-ink-3">{profile ? 'Click to change' : 'Optional · JPG or PNG'}</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setProfile(f);
              setPreview(URL.createObjectURL(f));
            }}
          />
        </div>

        <SectionLabel>Hospital</SectionLabel>
        <Field label="Hospital name" required error={errors.name} className="sm:col-span-2">
          <Input {...bind('name')} placeholder="City Care Hospital" />
        </Field>
        <Field label="Hospital type" required>
          <Select value={form.type} onChange={(e) => set('type')(e.target.value)}>
            {HOSPITAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>

        {form.type === 'Speciality' && (
          <Field label="Specialization">
            <Select value={form.specialization} onChange={(e) => set('specialization')(e.target.value)}>
              <option value="">Select…</option>
              {[...new Set([...SPECIALIZATIONS, form.specialization].filter(Boolean))].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        )}
        {form.type === 'Other' && (
          <Field label="Specialization" required error={errors.otherSpecialization}>
            <Input {...bind('otherSpecialization')} placeholder="e.g. Ayurveda" />
          </Field>
        )}
        {form.type === 'Multispeciality' && <div className="hidden sm:block" />}
        {form.type === 'Multispeciality' && (
          <Field label="Specializations" required error={errors.specialization} className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {[...new Set([...SPECIALIZATIONS, ...form.specializations])].map((s) => {
                const on = form.specializations.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set('specializations')(on ? form.specializations.filter((x) => x !== s) : [...form.specializations, s])}
                    className={cx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-semibold cursor-pointer transition',
                      on ? 'text-accent-ink border-accent/45 bg-accent/10' : 'text-ink-2 border-field-border bg-field hover:border-ink-3 hover:text-ink'
                    )}
                  >
                    {on && <Check size={13} />}{s}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Owner name" required error={errors.ownerName}>
          <Input {...bind('ownerName')} placeholder="Dr. Anil Mehta" />
        </Field>
        <Field label="Website or social link">
          <Input {...bind('socialMediaLinks')} placeholder="https://" />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input {...bind('address')} placeholder="Street, area" />
        </Field>
        <Field label="City"><Input {...bind('city')} placeholder="Surat" /></Field>
        <Field label="State"><Input {...bind('state')} placeholder="Gujarat" /></Field>
        <Field label="Pincode" error={errors.pincode}><Input {...bind('pincode')} inputMode="numeric" maxLength={6} placeholder="395007" /></Field>

        <SectionLabel>Admin login</SectionLabel>
        <Field label="Email" required error={errors.email} hint="Used to sign in to the hospital panel">
          <Input {...bind('email')} type="email" autoComplete="off" placeholder="admin@hospital.com" />
        </Field>
        <Field label="Mobile number" required error={errors.mobileNumber} hint="Also a login, and receives reset OTPs">
          <Input {...bind('mobileNumber')} inputMode="numeric" maxLength={10} placeholder="98XXXXXXXX" />
        </Field>
        {!isEdit && (
          <Field label="Password" required error={errors.password} className="sm:col-span-2">
            <PasswordInput value={form.password} onChange={set('password')} invalid={Boolean(errors.password)} />
          </Field>
        )}
      </form>
    </Modal>
  );
}

export function ResetPasswordModal({ hospital, onClose }) {
  const toast = useToast();
  const [password, setPassword] = useState(generatePassword);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSaving(true);
    setError('');
    try {
      await api('superadmin/hospitals/resetpassword', { hospitalId: hospital._id, newPassword: password });
      toast('Password reset');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      size="sm"
      title="Reset admin password"
      subtitle={hospital.name}
      onClose={onClose}
      footer={done
        ? <Button variant="primary" onClick={onClose}>Done</Button>
        : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon={KeyRound} loading={saving} onClick={submit}>Reset password</Button></>}
    >
      {done ? (
        <>
          <p className="text-ink-2 mb-4">Share the new password with the hospital admin. Their old password no longer works.</p>
          <div className="rounded-xl bg-hover border border-line p-4 font-mono text-[13px] leading-7">
            <div><span className="text-ink-3">Login&nbsp;&nbsp;&nbsp;</span> {hospital.email || hospital.mobileNumber}</div>
            <div><span className="text-ink-3">Password</span> {password}</div>
          </div>
          <div className="flex justify-end mt-3"><CopyButton text={`Login: ${hospital.email || hospital.mobileNumber}\nPassword: ${password}`} /></div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {error && <Alert>{error}</Alert>}
          <p className="text-ink-2">Sets a new password for <b className="text-ink">{hospital.email || hospital.mobileNumber}</b>. A strong one is generated for you.</p>
          <Field label="New password"><PasswordInput value={password} onChange={setPassword} /></Field>
        </div>
      )}
    </Modal>
  );
}
