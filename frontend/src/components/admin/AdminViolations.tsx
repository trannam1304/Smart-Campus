import React from 'react';
import { ShieldAlert, Lock, AlertCircle } from 'lucide-react';

export const AdminViolations: React.FC = () => {
  const violations = [
    { id: 'v1', studentName: 'Nguyễn Văn A', studentCode: '52100111', noShowCount: 3, status: 'LOCKED', reason: 'Quá 3 lần bỏ lịch đặt phòng không check-in' },
    { id: 'v2', studentName: 'Trần Thị B', studentCode: '52100222', noShowCount: 2, status: 'WARNING', reason: 'Bỏ lịch 2 lần liên tiếp' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-rose-600" />
        <h4 className="text-base font-bold text-slate-900">Quản lý vi phạm No-Show & Khóa tài khoản</h4>
      </div>

      <div className="space-y-3">
        {violations.map((v) => (
          <div key={v.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{v.studentName}</span>
                <span className="text-xs font-mono text-slate-500">({v.studentCode})</span>
              </div>
              <p className="text-xs text-slate-600">{v.reason}</p>
            </div>

            <div className="flex items-center gap-3">
              {v.status === 'LOCKED' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                  <Lock className="w-3.5 h-3.5" /> Đã khóa TK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" /> Cảnh báo ({v.noShowCount}/3)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
