import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ShieldAlert,
  Send,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
} from 'lucide-react';
import {
  StudentWarningSummary,
  submitStudentAppealApi,
} from '../../api/violationApi';
import { Toast } from '../ui/Toast';

export interface StudentWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: StudentWarningSummary | null;
  onRefresh: () => void;
}

export const StudentWarningModal: React.FC<StudentWarningModalProps> = ({
  isOpen,
  onClose,
  summary,
  onRefresh,
}) => {
  const [appealReason, setAppealReason] = useState('');
  const [selectedWarningId, setSelectedWarningId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  if (!isOpen || !summary) return null;

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || appealReason.trim().length < 2) {
      setToastType('error');
      setToastMessage('Vui lòng nhập lý do giải trình khiếu nại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitStudentAppealApi({
        warningId: selectedWarningId,
        reason: appealReason.trim(),
      });

      if (res.success) {
        setToastType('success');
        setToastMessage(res.message || 'Đã gửi đơn khiếu nại lên Admin thành công!');
        setAppealReason('');
        setSelectedWarningId(undefined);
        onRefresh();
      } else {
        setToastType('error');
        setToastMessage(res.message || 'Không thể gửi đơn khiếu nại.');
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Có lỗi xảy ra khi gửi khiếu nại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col my-auto overflow-hidden animate-scale-up">
        {/* Header - luôn cố định ở trên đầu modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${summary.isLocked ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              {summary.isLocked ? <Lock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chi Tiết Cảnh Báo & Khiếu Nại
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Sinh viên: <span className="font-bold text-slate-700">{summary.fullName}</span> ({summary.studentCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Trạng thái tài khoản */}
          {summary.isLocked ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Tài Khoản Hiện Đang Bị Khóa
              </div>
              <p>
                Tài khoản của bạn tạm thời bị khóa chức năng đặt phòng học. Bạn có thể gửi đơn giải trình khiếu nại dưới đây để Ban quản lý xem xét mở khóa.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Bạn Đang Có {summary.warningCount} Cảnh Báo Vi Phạm
              </div>
              <p>
                Nếu vi phạm quá 3 lần, tài khoản sẽ tự động bị khóa quyền đặt phòng theo Quy chế sử dụng Thư Viện Thông Minh.
              </p>
            </div>
          )}

          {/* Danh sách các cảnh báo */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lý do bạn bị cảnh báo:
            </h4>
            {summary.warnings.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Không có cảnh báo nào đang hoạt động.</p>
            ) : (
              <div className="space-y-2">
                {summary.warnings.map((w, idx) => (
                  <div
                    key={w.id || idx}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">• {w.reason}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(w.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lịch sử khiếu nại đã gửi */}
          {summary.appeals && summary.appeals.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Đơn khiếu nại của bạn:
              </h4>
              <div className="space-y-2">
                {summary.appeals.map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                      a.status === 'PENDING'
                        ? 'bg-amber-50/50 border-amber-200'
                        : a.status === 'APPROVED'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        "{a.reason}"
                      </span>
                      {a.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          <Clock className="w-3 h-3" /> Chờ Admin duyệt
                        </span>
                      ) : a.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Đã chấp thuận
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                          <XCircle className="w-3 h-3" /> Bị từ chối
                        </span>
                      )}
                    </div>
                    {a.adminResponse && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-700">Phản hồi của QTV: </span>
                        {a.adminResponse}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form gửi khiếu nại lên admin */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Gửi Khiếu Nại / Giải Trình Lên Admin:
            </h4>

            <form onSubmit={handleSubmitAppeal} className="space-y-3">
              {summary.warnings.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Chọn cảnh báo muốn khiếu nại (tùy chọn):
                  </label>
                  <select
                    value={selectedWarningId || ''}
                    onChange={(e) => setSelectedWarningId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Khiếu nại toàn bộ / Chung --</option>
                    {summary.warnings.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.reason} ({new Date(w.createdAt).toLocaleDateString('vi-VN')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nội dung giải trình chi tiết:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Em có đến nhận phòng học lúc 07:45 nhưng hệ thống quét mã QR bị báo lỗi mạng hoặc do trường hợp khách quan..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !appealReason.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đơn Khiếu Nại Lên Admin'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
