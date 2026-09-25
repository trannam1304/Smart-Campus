'use client';

import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import BottomTabBar from '@/components/BottomTabBar';
import IncidentReportForm from './IncidentReportForm';

export default function IncidentReportScreen() {
  const { toasts, addToast, dismissToast } = useToast();

  const handleSuccess = useCallback(() => {
    // Backend integration point: POST /api/incidents { roomId, equipmentId, description, images[] }
    addToast('success', 'Báo cáo sự cố đã được tiếp nhận');
  }, [addToast]);

  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-card border-b border-border relative flex-shrink-0">
        <button
          className="
            w-9 h-9 flex items-center justify-center rounded-full
            text-secondary-foreground hover:bg-secondary
            transition-colors duration-150 active:scale-95
          "
          aria-label="Đóng form"
        >
          <X size={20} strokeWidth={2} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-foreground whitespace-nowrap">
          Báo cáo sự cố thiết bị
        </h1>
        <div className="ml-auto w-9" />
      </header>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto">
        <IncidentReportForm onSuccess={handleSuccess} />
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar activeHref="/hardware-incident-report-form" />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}