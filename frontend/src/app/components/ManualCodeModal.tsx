'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, KeyRound, Loader2 } from 'lucide-react';

interface ManualCodeFormData {
  code: string;
}

interface ManualCodeModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function ManualCodeModal({ onClose, onError, onSuccess }: ManualCodeModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualCodeFormData>({ mode: 'onSubmit' });

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: ManualCodeFormData) => {
    setIsSubmitting(true);
    // Backend integration point: POST /api/checkin/manual { code, roomId, userId }
    await new Promise((r) => setTimeout(r, 900));
    setIsSubmitting(false);
    if (data.code.toUpperCase() === 'SC2026') {
      onSuccess();
    } else {
      onError('Mã check-in không hợp lệ hoặc đã hết hạn');
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-end"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Nhập mã check-in thủ công"
    >
      <div
        className="w-full bg-card rounded-t-3xl px-5 pt-4 pb-8"
        style={{ animation: 'toastIn 0.25s ease-out forwards' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Nhập mã thủ công</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            aria-label="Đóng"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <label htmlFor="manual-code" className="block text-sm font-medium text-foreground mb-1.5">
              Mã check-in
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Nhập mã 6 ký tự được hiển thị trên màn hình thiết bị cửa phòng.
            </p>
            <input
              id="manual-code"
              type="text"
              placeholder="VD: SC2026"
              autoComplete="off"
              className={`
                w-full px-4 py-3 rounded-xl border text-sm font-mono tracking-widest uppercase
                bg-secondary text-foreground
                placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal placeholder:font-sans
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-all duration-150
                ${errors.code ? 'border-error focus:ring-error' : 'border-border'}
              `}
              {...register('code', {
                required: 'Vui lòng nhập mã check-in',
                minLength: { value: 4, message: 'Mã phải có ít nhất 4 ký tự' },
                maxLength: { value: 10, message: 'Mã không được quá 10 ký tự' },
              })}
              ref={(el) => {
                register('code').ref(el);
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
              }}
            />
            {errors.code && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1" role="alert">
                {errors.code.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/6 border border-primary/15 mb-5">
            <KeyRound size={14} className="text-primary flex-shrink-0" />
            <p className="text-xs text-primary font-medium">
              Thử mã demo: <span className="font-mono font-bold">SC2026</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="
              btn-primary w-full py-3.5 rounded-xl text-sm font-semibold
              flex items-center justify-center gap-2
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xác thực...
              </>
            ) : (
              'Xác nhận mã'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}