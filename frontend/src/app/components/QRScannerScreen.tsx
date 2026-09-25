'use client';

import React, { useState, useCallback } from 'react';
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import BottomTabBar from '@/components/BottomTabBar';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import ScannerViewport from './ScannerViewport';
import ManualCodeModal from './ManualCodeModal';

export default function QRScannerScreen() {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();

  const handleSuccess = useCallback(() => {
    // Backend integration point: POST /api/checkin/qr { qrCode, roomId, userId }
    addToast('success', 'Check-in thành công! Mở khóa cửa phòng');
  }, [addToast]);

  const handleErrorEarly = useCallback(() => {
    // Backend integration point: returns 400 { code: 'TOO_EARLY', minutesLeft: 17 }
    addToast('error', 'Chưa đến giờ check-in (còn hơn 15 phút)');
  }, [addToast]);

  const handleErrorInvalid = useCallback(() => {
    // Backend integration point: returns 403 { code: 'INVALID_OR_EXPIRED' }
    addToast('error', 'Mã QR không đúng (sai phòng) hoặc đã hết hạn');
  }, [addToast]);

  const toggleFlashlight = useCallback(() => {
    setFlashlightOn((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-card border-b border-border relative">
        <button
          className="
            w-9 h-9 flex items-center justify-center rounded-full
            text-secondary-foreground hover:bg-secondary
            transition-colors duration-150 active:scale-95
          "
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-foreground whitespace-nowrap">
          Điểm danh Nhận phòng
        </h1>
        <div className="ml-auto w-9" />
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Room info strip */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-secondary-foreground">Đặt phòng hiện tại</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-primary">Phòng A3.01</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">09:00 – 11:00</span>
          </div>
        </div>

        {/* Scanner area */}
        <div className="px-6 pt-6 pb-4">
          <ScannerViewport flashlightOn={flashlightOn} onFlashlightToggle={toggleFlashlight} />
        </div>

        {/* Helper text */}
        <div className="px-6 pb-4">
          <p className="text-center text-[13px] text-muted-foreground leading-relaxed">
            Đưa mã QR tại thiết bị cửa hoặc quét mã QR cố định bằng camera máy
          </p>
        </div>

        {/* Simulation / Testing section */}
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Mô phỏng phản hồi
              </p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {/* Success trigger */}
              <button
                onClick={handleSuccess}
                className="
                  flex items-center gap-3 w-full px-4 py-3 rounded-lg
                  bg-success/8 border border-success/20
                  hover:bg-success/12 active:scale-[0.98]
                  transition-all duration-150
                "
                aria-label="Mô phỏng check-in thành công"
              >
                <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-success">Thành công (200)</p>
                  <p className="text-[11px] text-muted-foreground">Check-in & mở khóa cửa</p>
                </div>
              </button>

              {/* Early error trigger */}
              <button
                onClick={handleErrorEarly}
                className="
                  flex items-center gap-3 w-full px-4 py-3 rounded-lg
                  bg-warning/8 border border-warning/20
                  hover:bg-warning/12 active:scale-[0.98]
                  transition-all duration-150
                "
                aria-label="Mô phỏng lỗi đến sớm"
              >
                <Clock size={18} className="text-warning flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-warning">Đến sớm quá 15 phút</p>
                  <p className="text-[11px] text-muted-foreground">Chưa trong khung giờ check-in</p>
                </div>
              </button>

              {/* Invalid/expired error trigger */}
              <button
                onClick={handleErrorInvalid}
                className="
                  flex items-center gap-3 w-full px-4 py-3 rounded-lg
                  bg-error/8 border border-error/20
                  hover:bg-error/12 active:scale-[0.98]
                  transition-all duration-150
                "
                aria-label="Mô phỏng mã QR không hợp lệ"
              >
                <AlertCircle size={18} className="text-error flex-shrink-0" />
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-error">Mã không hợp lệ / hết hạn</p>
                  <p className="text-[11px] text-muted-foreground">QR sai hoặc đã quá thời gian</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Manual code button */}
        <div className="px-4 pb-6">
          <button
            onClick={() => setShowManualModal(true)}
            className="
              btn-secondary w-full flex items-center justify-center gap-2
              py-3 rounded-xl text-sm font-semibold
            "
            aria-label="Nhập mã check-in thủ công"
          >
            <KeyRound size={16} />
            Nhập mã thủ công
          </button>
        </div>
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeHref="/" />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Manual code modal */}
      {showManualModal && (
        <ManualCodeModal
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            addToast('success', 'Check-in thành công! Mở khóa cửa phòng');
          }}
          onError={(msg) => {
            setShowManualModal(false);
            addToast('error', msg);
          }}
        />
      )}
    </div>
  );
}