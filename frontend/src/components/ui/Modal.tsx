import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  className = '',
}) => {
  // Khóa cuộn trang nền và lắng nghe phím Escape
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - (document.documentElement?.clientWidth || 0);

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses =
    size === 'lg' ? 'sm:max-w-4xl lg:max-w-5xl' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-white flex flex-col w-full ${sizeClasses} max-h-[100dvh] sm:max-h-[90dvh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header shrink-0 */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="pr-4 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-snug truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân cuộn flex-1 overflow-y-auto overscroll-contain */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>

        {/* Footer cố định ở đáy shrink-0 có padding safe-area */}
        {footer && (
          <div
            className="shrink-0 border-t border-slate-100 bg-white px-4 sm:px-6 py-3.5 sm:py-4"
            style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
