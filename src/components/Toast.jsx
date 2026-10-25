import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { IconButton } from './ui';

const ToastContext = createContext(() => {});

const META = {
  good: { icon: CheckCircle2, cls: 'text-good' },
  bad: { icon: AlertCircle, cls: 'text-bad' },
  info: { icon: Info, cls: 'text-info' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((message, tone = 'good') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    setTimeout(() => dismiss(id), tone === 'bad' ? 6000 : 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="fixed right-5 bottom-5 z-200 flex flex-col gap-2.5 w-[min(380px,calc(100vw-40px))]" aria-live="polite">
          {toasts.map((t) => {
            const { icon: Icon, cls } = META[t.tone] || META.info;
            return (
              <div key={t.id} className="glass-solid rounded-2xl flex items-start gap-3 px-4 py-3.5 font-semibold animate-slide-in" role={t.tone === 'bad' ? 'alert' : 'status'}>
                <Icon size={18} className={`${cls} shrink-0 mt-px`} />
                <div className="flex-1 min-w-0">{t.message}</div>
                <IconButton icon={X} label="Dismiss" size="sm" plain className="-my-1.5 -mr-1.5" onClick={() => dismiss(t.id)} />
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
