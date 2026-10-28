import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from 'lucide-react';
import { STATUS_META, fmtNum, initials } from '../lib/format';

export const cx = (...c) => c.filter(Boolean).join(' ');

// --- Shared class recipes ----------------------------------------------------

export const inputCls =
  'w-full h-10 px-3 rounded-lg border border-field-border bg-field text-ink text-sm placeholder:text-ink-3 ' +
  'transition focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/15';

export const TH = 'text-left text-[11px] font-semibold uppercase tracking-wider text-ink-3 px-4 py-3 border-b border-line whitespace-nowrap bg-page';
export const TD = 'px-4 py-3 border-b border-line align-middle';
export const TR = 'transition-colors hover:bg-hover [&:last-child>td]:border-b-0';

const TONES = {
  good: 'text-good bg-good/10 border-good/25',
  warn: 'text-warn bg-warn/10 border-warn/25',
  bad: 'text-bad bg-bad/10 border-bad/25',
  info: 'text-info bg-info/10 border-info/25',
  violet: 'text-violet bg-violet/10 border-violet/25',
  cyan: 'text-cyan bg-cyan/10 border-cyan/25',
  accent: 'text-accent-ink bg-accent/10 border-accent/30',
  muted: 'text-ink-2 bg-ink-3/10 border-ink-3/20',
};
export const toneCls = (tone) => TONES[tone] || TONES.muted;

// --- Primitives -------------------------------------------------------------

export function Card({ className = '', children, ...props }) {
  return <div className={cx('glass rounded-xl', className)} {...props}>{children}</div>;
}

export function CardHead({ title, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4.5">
      <div>
        <div className="text-[15px] font-semibold">{title}</div>
        {sub && <div className="text-[12.5px] text-ink-3 mt-0.5">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

const BTN_VARIANTS = {
  default: 'border-field-border bg-glass-strong text-ink shadow-glass-sm hover:bg-hover',
  primary: 'border-transparent text-white bg-brand shadow-glow hover:bg-brand-fill-hover',
  ghost: 'border-transparent bg-transparent text-ink-2 hover:bg-hover hover:text-ink',
  danger: 'text-bad bg-bad/10 border-bad/30 hover:border-bad',
  success: 'text-good bg-good/10 border-good/30 hover:border-good',
};

export function Button({ variant = 'default', size = 'md', loading = false, icon: Icon, children, className = '', ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 border font-semibold whitespace-nowrap cursor-pointer transition-colors',
        'disabled:opacity-55 disabled:cursor-not-allowed',
        size === 'sm' ? 'h-8 px-3 text-[12.5px] rounded-md' : 'h-10 px-4 text-[13.5px] rounded-lg',
        BTN_VARIANTS[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, size = 'md', plain = false, className = '', ...props }) {
  return (
    <button
      className={cx(
        'inline-grid place-items-center shrink-0 border cursor-pointer text-ink-2 transition hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' ? 'size-8 rounded-md' : 'size-10 rounded-lg',
        plain ? 'border-transparent bg-transparent hover:bg-hover' : 'border-field-border bg-glass-strong hover:bg-hover',
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={size === 'sm' ? 15 : 18} />
    </button>
  );
}

export function Badge({ tone = 'muted', dot = true, children }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 h-6 px-2 rounded-md border text-[11.5px] font-semibold whitespace-nowrap', toneCls(tone))}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { tone: 'muted', label: status || 'Unknown' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function ActiveBadge({ active }) {
  return <Badge tone={active ? 'good' : 'muted'}>{active ? 'Active' : 'Inactive'}</Badge>;
}

export function Avatar({ name, src, size = 'md' }) {
  const isUrl = typeof src === 'string' && /^https?:\/\//.test(src);
  const dims = { sm: 'size-8 rounded-full text-[11px]', md: 'size-9 rounded-full text-[13px]', lg: 'size-14 rounded-xl text-lg' }[size];
  return (
    <div className={cx('grid place-items-center shrink-0 font-semibold text-accent-ink bg-accent/12 overflow-hidden', dims)} aria-hidden="true">
      {isUrl ? <img src={src} alt="" className="size-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : initials(name)}
    </div>
  );
}

export function Skeleton({ className = 'h-3.5 w-full' }) {
  return <div className={cx('skeleton rounded-lg', className)} />;
}

export function Empty({ icon: Icon = Inbox, title = 'Nothing here yet', children }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2.5 px-5 py-13 text-ink-3">
      <div className="size-12 rounded-xl grid place-items-center bg-hover border border-line"><Icon size={22} /></div>
      <div className="font-semibold text-ink text-[15px]">{title}</div>
      {children && <div>{children}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Empty icon={AlertTriangle} title="Couldn't load this">
      <div className="mb-3">{message}</div>
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </Empty>
  );
}

export function Alert({ tone = 'bad', icon: Icon = AlertTriangle, children }) {
  return (
    <div className={cx('flex gap-2.5 items-start px-3.5 py-3 rounded-lg border text-[13px] font-medium', toneCls(tone))} role="alert">
      <Icon size={16} className="shrink-0 mt-px" />
      <div>{children}</div>
    </div>
  );
}

// --- Form controls -----------------------------------------------------------

export function Field({ label, required, hint, error, children, className = '' }) {
  return (
    <label className={cx('flex flex-col gap-1.5 min-w-0', className)}>
      {label && (
        <span className="text-[12.5px] font-medium text-ink-2">
          {label}{required && <span className="text-bad ml-0.5">*</span>}
        </span>
      )}
      {children}
      {error ? <span className="text-xs font-semibold text-bad">{error}</span> : hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
    </label>
  );
}

export function Input({ invalid, className = '', ...props }) {
  return <input className={cx(inputCls, invalid && 'border-bad', className)} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <div className={cx('relative', className)}>
      <select className={cx(inputCls, 'appearance-none pr-9 cursor-pointer')} {...props}>{children}</select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
    </div>
  );
}

export function SearchInput({ className = '', ...props }) {
  return (
    <div className={cx('relative', className)}>
      <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
      <input type="search" className={cx(inputCls, 'pl-10')} {...props} />
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex p-1 gap-0.5 rounded-lg bg-page border border-field-border" role="tablist">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-semibold cursor-pointer transition-colors',
              on ? 'text-accent-ink bg-glass-strong shadow-glass-sm' : 'text-ink-3 hover:text-ink'
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="text-[11px] text-ink-3 tabular-nums">{fmtNum(o.count)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// --- Page layout helpers ---------------------------------------------------------

export function PageHead({ title, sub, children }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-5.5">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="text-ink-2 mt-1">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5 flex-wrap">{children}</div>}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex items-center gap-2.5 flex-wrap p-3.5 border-b border-line">{children}</div>;
}

export function TableSkeleton({ cols = 5, rows = 6 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className={TD}><Skeleton className={cx('h-3.5', c === 0 ? 'w-[70%]' : 'w-[55%]')} /></td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function Entity({ name, sub, src, size = 'md' }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar name={name} src={src} size={size} />
      <div className="min-w-0">
        <div className="font-semibold text-ink truncate">{name || '—'}</div>
        {sub && <div className="text-xs text-ink-3 truncate">{sub}</div>}
      </div>
    </div>
  );
}

// Numbered pager with ellipses: 1 … 4 5 [6] 7 8 … 20
export function Pager({ pagination, onPage, noun = 'records' }) {
  if (!pagination) return null;
  const { page, totalPages, totalRecords, limit } = pagination;
  const from = totalRecords ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, totalRecords);

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t border-line text-[12.5px] text-ink-3">
      <span className="tabular-nums">
        {totalRecords
          ? <>Showing <b className="text-ink-2">{fmtNum(from)}–{fmtNum(to)}</b> of <b className="text-ink-2">{fmtNum(totalRecords)}</b> {noun}</>
          : `No ${noun}`}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <IconButton icon={ChevronLeft} label="Previous page" size="sm" plain disabled={page <= 1} onClick={() => onPage(page - 1)} />
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cx(
                  'min-w-8 h-8 px-2 rounded-md border font-semibold tabular-nums cursor-pointer transition-colors',
                  p === page ? 'text-white bg-brand border-transparent' : 'text-ink-2 border-transparent hover:bg-hover'
                )}
              >
                {p}
              </button>
            )
          )}
          <IconButton icon={ChevronRight} label="Next page" size="sm" plain disabled={page >= totalPages} onClick={() => onPage(page + 1)} />
        </div>
      )}
    </div>
  );
}

// --- Overlays -----------------------------------------------------------------------

function useOverlay(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

function OverlayFrame({ id, title, subtitle, onClose, footer, children }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 px-6 pt-5.5 pb-4 border-b border-line">
        <div>
          <div className="text-lg font-semibold" id={id}>{title}</div>
          {subtitle && <div className="text-[13px] text-ink-3 mt-0.5">{subtitle}</div>}
        </div>
        <IconButton icon={X} label="Close" size="sm" plain onClick={onClose} />
      </div>
      <div className="px-6 py-5.5 overflow-y-auto flex-1">{children}</div>
      {footer && <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-line">{footer}</div>}
    </>
  );
}

export function Modal({ size = 'md', ...props }) {
  useOverlay(props.onClose);
  const id = useId();
  return createPortal(
    <div
      className="fixed inset-0 z-100 grid place-items-center p-5 bg-overlay animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && props.onClose?.()}
    >
      <div
        className={cx('glass-solid rounded-xl flex flex-col w-full max-h-[calc(100vh-40px)] animate-pop', size === 'sm' ? 'max-w-[440px]' : 'max-w-[720px]')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <OverlayFrame id={id} {...props} />
      </div>
    </div>,
    document.body
  );
}

export function Drawer(props) {
  useOverlay(props.onClose);
  const id = useId();
  return createPortal(
    <div
      className="fixed inset-0 z-100 flex justify-end bg-overlay animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && props.onClose?.()}
    >
      <aside className="glass-solid border-y-0 border-r-0 flex flex-col w-full max-w-[560px] h-full animate-slide-in" role="dialog" aria-modal="true" aria-labelledby={id}>
        <OverlayFrame id={id} {...props} />
      </aside>
    </div>,
    document.body
  );
}

export function Confirm({ title, message, confirmLabel = 'Confirm', tone = 'primary', loading, onConfirm, onClose }) {
  return (
    <Modal
      size="sm"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-ink-2">{message}</p>
    </Modal>
  );
}

// --- Data display ------------------------------------------------------------------

// `tone` is a CSS color (e.g. 'var(--sa-info)'); drives the icon chip.
export function StatCard({ icon: Icon, label, value, tone = 'var(--sa-accent)', loading, foot }) {
  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-3" style={{ '--tone': tone }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] text-ink-2 font-medium">{label}</div>
        <IconChip icon={Icon} size="sm" />
      </div>
      {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-[26px] sm:text-[28px] font-bold tracking-tight leading-tight tabular-nums">{value}</div>}
      {foot && <div className="text-xs text-ink-3 flex gap-2.5 flex-wrap [&_b]:text-ink-2 [&_b]:font-bold">{foot}</div>}
    </Card>
  );
}

// Tinted icon tile. Color comes from the nearest `--tone` custom property.
export function IconChip({ icon: Icon, size = 'md' }) {
  return (
    <div
      className={cx(
        'grid place-items-center shrink-0 text-(--tone,var(--sa-accent))',
        'bg-[color-mix(in_srgb,var(--tone,var(--sa-accent))_12%,transparent)]',
        size === 'sm' ? 'size-9 rounded-lg' : 'size-10 rounded-lg'
      )}
    >
      <Icon size={size === 'sm' ? 17 : 19} />
    </div>
  );
}

export function KV({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4.5 gap-y-3.5">
      {items.filter(Boolean).map(([k, v, span]) => (
        <div key={k} className={cx('min-w-0', span && 'sm:col-span-2')}>
          <div className="text-[11.5px] text-ink-3 font-medium uppercase tracking-wider">{k}</div>
          <div className="font-semibold mt-0.5 break-words">{v || v === 0 ? v : '—'}</div>
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="text-[13px] font-semibold mt-5.5 mb-3 flex items-center gap-2">
      {Icon && <Icon size={15} className="text-ink-3" />}
      {children}
    </div>
  );
}
