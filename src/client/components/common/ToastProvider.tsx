import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (type: Toast['type'], message: string, title?: string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);
export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  info: 'fa-circle-info',
  warning: 'fa-triangle-exclamation'
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string, title?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{
      showToast,
      success: (msg) => showToast('success', msg),
      error: (msg) => showToast('error', msg),
      info: (msg) => showToast('info', msg)
    }}>
      {children}
      <div className="fixed top-20 right-4 z-[9999] space-y-3 max-w-sm w-full">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} flex items-start gap-3 fade-in`}>
            <i className={`fas ${ICONS[t.type]} text-lg flex-shrink-0 mt-0.5`}></i>
            <div className="flex-1">
              {t.title && <div className="font-semibold text-sm mb-0.5">{t.title}</div>}
              <div className="text-sm">{t.message}</div>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-white/80 hover:text-white ml-1">
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
