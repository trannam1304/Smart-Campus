'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, AlertTriangle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const variantStyles: Record<ToastVariant, string> = {
    success: 'bg-success text-success-foreground',
    error: 'bg-error text-error-foreground',
    warning: 'bg-warning text-warning-foreground',
  };

  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
  }[toast.variant];

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-[340px]
        ${variantStyles[toast.variant]}
        ${exiting ? 'toast-slide-out' : 'toast-slide-in'}
      `}
      role="alert"
      aria-live="assertive"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm font-500 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Đóng thông báo"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none"
      aria-label="Thông báo"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (variant: ToastVariant, message: string) => {
    const id = `toast-${Date.now()}-${Math.floor(variant.length * 100)}`;
    setToasts((prev) => [...prev, { id, variant, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismissToast };
}