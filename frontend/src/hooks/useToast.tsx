import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast } from '../components/ui/Toast';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="relative !bottom-0 !right-0 transition-all">
            <Toast message={toast.message} type={toast.type} onClose={() => setToasts((prev) => prev.filter(t => t.id !== toast.id))} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const toast = {
    success: (message: string) => {},
    error: (message: string) => {}
};

export const setToastFunctions = (successFn: (msg: string) => void, errorFn: (msg: string) => void) => {
    toast.success = successFn;
    toast.error = errorFn;
};
