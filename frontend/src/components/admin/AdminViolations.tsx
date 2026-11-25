import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldAlert,
  Lock,
  Unlock,
  AlertCircle,
  Search,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  getViolationsApi,
  getAppealsApi,
  warnStudentApi,
  toggleLockAccountApi,
  resolveAppealApi,
  StudentViolation,
  StudentAppeal,
} from '../../api/violationApi';
import { Toast } from '../ui/Toast';

export const AdminViolations: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'VIOLATIONS' | 'APPEALS'>('VIOLATIONS');
  const [violations, setViolations] = useState<StudentViolation[]>([]);
  const [appeals, setAppeals] = useState<StudentAppeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WARNED' | 'LOCKED'>('ALL');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Modal Cảnh báo sinh viên
  const [warnModalStudent, setWarnModalStudent] = useState<StudentViolation | null>(null);
  const [warnReason, setWarnReason] = useState('');
  const [warnLockAccount, setWarnLockAccount] = useState(false);
  const [isSubmittingWarn, setIsSubmittingWarn] = useState(false);

  // Modal Xử lý khiếu nại
  const [appealModalItem, setAppealModalItem] = useState<StudentAppeal | null>(null);
  const [appealDecision, setAppealDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminResponseNote, setAdminResponseNote] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vRes, aRes] = await Promise.all([
        getViolationsApi(),
        getAppealsApi(),
      ]);
      if (vRes.success && vRes.data) {
        setViolations(vRes.data);
      }
      if (aRes.success && aRes.data) {
        setAppeals(aRes.data);
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage('Không thể tải dữ liệu vi phạm và khiếu nại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Bộ lọc danh sách sinh viên vi phạm
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchSearch =
        !searchTerm.trim() ||
        v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.studentCode.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'LOCKED') return v.status === 'LOCKED';
      if (statusFilter === 'WARNED') return v.warningCount > 0;
      return true;
    });
  }, [violations, searchTerm, statusFilter]);

  // Đếm số khiếu nại đang chờ xử lý
  const pendingAppealsCount = useMemo(() => {
    return appeals.filter((a) => a.status === 'PENDING').length;
  }, [appeals]);

  // Xử lý gửi cảnh báo
  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warnModalStudent || !warnReason.trim()) return;

    setIsSubmittingWarn(true);
    try {
      const res = await warnStudentApi({
        userId: warnModalStudent.userId,
        studentCode: warnModalStudent.studentCode,
        reason: warnReason.trim(),
        lockAccount: warnLockAccount,
      });

      if (res.success) {
        setToastType('success');
        setToastMessage(res.data?.message || 'Đã gửi cảnh báo đến sinh viên thành công.');
        setWarnModalStudent(null);
        setWarnReason('');
        setWarnLockAccount(false);
        fetchData();
      } else {
        setToastType('error');
        setToastMessage(res.message || 'Có lỗi xảy ra khi gửi cảnh báo.');
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmittingWarn(false);
    }
  };

  // Xử lý khóa / mở khóa tài khoản
  const handleToggleLock = async (student: StudentViolation) => {
    const nextStatus = student.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    const actionName = nextStatus === 'LOCKED' ? 'khóa tài khoản' : 'mở khóa tài khoản';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} sinh viên ${student.fullName} (${student.studentCode})?`)) {
      return;
    }

    try {
      const res = await toggleLockAccountApi({
        userId: student.userId,
        studentCode: student.studentCode,
        status: nextStatus,
      });

      if (res.success) {
        setToastType('success');
        setToastMessage(res.data?.message || `Đã ${actionName} thành công.`);
        fetchData();
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Thao tác không thành công.');
    }
  };

  // Xử lý chấp thuận nhanh khiếu nại (1-click)
  const handleQuickApprove = async (appeal: StudentAppeal) => {
    setIsLoading(true);
    try {
      const res = await resolveAppealApi(appeal.id, {
        status: 'APPROVED',
        adminResponse: 'Đã chấp thuận giải trình và gỡ cảnh báo vi phạm cho sinh viên.',
      });

      if (res.success) {
        setToastType('success');
        setToastMessage(res.data?.message || 'Đã chấp thuận khiếu nại và gỡ cảnh báo thành công.');
        fetchData();
      } else {
        setToastType('error');
        setToastMessage(res.message || 'Có lỗi xảy ra khi xử lý khiếu nại.');
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Có lỗi xảy ra khi xử lý khiếu nại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý giải quyết khiếu nại
  const handleResolveAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealModalItem) return;

    setIsSubmittingAppeal(true);
    try {
      const res = await resolveAppealApi(appealModalItem.id, {
        status: appealDecision,
        adminResponse: adminResponseNote.trim() || (appealDecision === 'APPROVED' ? 'Đã chấp thuận giải trình và xóa cảnh báo.' : 'Không chấp thuận giải trình.'),
      });

      if (res.success) {
        setToastType('success');
        setToastMessage(res.data?.message || 'Đã xử lý khiếu nại thành công.');
        setAppealModalItem(null);
        setAdminResponseNote('');
        fetchData();
      }
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Quản Lý Người Vi Phạm & Khiếu Nại
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Cảnh báo vi phạm nội quy, khóa tài khoản và xử lý đơn khiếu nại từ sinh viên
            </p>
          </div>
        </div>

        {/* Nút Làm mới & Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveSubTab('VIOLATIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'VIOLATIONS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Người Vi Phạm ({violations.filter((v) => v.warningCount > 0 || v.status === 'LOCKED').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('APPEALS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative flex items-center gap-1 ${
                activeSubTab === 'APPEALS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Khiếu Nại</span>
              {pendingAppealsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingAppealsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: NGƯỜI VI PHẠM & KHÓA TÀI KHOẢN ────────────────────────── */}
      {activeSubTab === 'VIOLATIONS' && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm & bộ lọc */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm sinh viên theo MSSV hoặc Họ tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Lọc trạng thái vi phạm"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả sinh viên</option>
                <option value="WARNED">Có cảnh báo ({violations.filter((v) => v.warningCount > 0).length})</option>
                <option value="LOCKED">Đã khóa tài khoản ({violations.filter((v) => v.status === 'LOCKED').length})</option>
              </select>
            </div>
          </div>

          {/* Danh sách sinh viên */}
          <div className="space-y-3">
            {filteredViolations.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-500">Không tìm thấy sinh viên nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              filteredViolations.map((student) => (
                <div
                  key={student.userId}
                  className={`p-4 rounded-2xl border transition-all ${
                    student.status === 'LOCKED'
                      ? 'bg-rose-50/40 border-rose-200'
                      : student.warningCount > 0
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {student.fullName}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                          {student.studentCode}
                        </span>
                        {student.status === 'LOCKED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                            <Lock className="w-3 h-3" /> Đã khóa tài khoản
                          </span>
                        ) : student.warningCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                            <AlertCircle className="w-3 h-3" /> Cảnh báo ({student.warningCount}/3)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Hoạt động bình thường
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4">
                        <span>Khoa: {student.department || 'Chưa cập nhật'}</span>
                        <span>Số lần vắng mặt: {student.noShowCount ?? 0}</span>
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setWarnModalStudent(student);
                          setWarnReason('');
                          setWarnLockAccount(false);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Cảnh báo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleLock(student)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border ${
                          student.status === 'LOCKED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {student.status === 'LOCKED' ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Mở khóa</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Khóa TK</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Lịch sử cảnh báo nếu có */}
                  {student.warnings && student.warnings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Các lần bị cảnh báo gần đây:
                      </div>
                      <div className="space-y-1">
                        {student.warnings.map((w) => (
                          <div
                            key={w.id}
                            className="text-xs text-slate-700 bg-white/70 p-2 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                          >
                            <span className="font-medium text-slate-800">• {w.reason}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {new Date(w.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: DANH SÁCH KHIẾU NẠI TỪ SINH VIÊN ────────────────────── */}
      {activeSubTab === 'APPEALS' && (
        <div className="space-y-4">
          {appeals.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Chưa có đơn khiếu nại nào từ sinh viên.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    appeal.status === 'PENDING'
                      ? 'bg-amber-50/40 border-amber-300'
                      : appeal.status === 'APPROVED'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {appeal.studentName || 'Sinh viên'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                          {appeal.studentCode}
                        </span>
                        {appeal.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                            <Clock className="w-3 h-3" /> Đang chờ duyệt
                          </span>
                        ) : appeal.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Đã chấp thuận (Xóa cảnh báo)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                            <XCircle className="w-3 h-3" /> Đã từ chối khiếu nại
                          </span>
                        )}
                      </div>

                      {/* Thông tin cảnh báo liên quan */}
                      {appeal.warningReason && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                          <span className="font-bold text-slate-700">Lý do bị cảnh báo ban đầu: </span>
                          <span>{appeal.warningReason}</span>
                        </div>
                      )}

                      {/* Nội dung khiếu nại của sinh viên */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Nội dung giải trình khiếu nại của sinh viên:
                        </div>
                        <p className="text-xs font-medium text-slate-800 bg-white/80 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap">
                          {appeal.reason}
                        </p>
                      </div>

                      {/* Phản hồi của admin (nếu đã xử lý) */}
                      {appeal.adminResponse && (
                        <div className="text-xs text-slate-600 p-2.5 bg-slate-100/80 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">Phản hồi của QTV: </span>
                          <span>{appeal.adminResponse}</span>
                          {appeal.resolvedAt && (
                            <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                              Thời gian xử lý: {new Date(appeal.resolvedAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 font-mono">
                        Thời gian gửi đơn: {new Date(appeal.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {/* Nút xử lý khiếu nại cho Admin */}
                    {appeal.status === 'PENDING' && (
                      <div className="shrink-0 flex sm:flex-col items-center gap-2 self-start">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleQuickApprove(appeal)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          title="Chấp thuận giải trình và gỡ cảnh báo ngay"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chấp thuận</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAppealModalItem(appeal);
                            setAppealDecision('REJECTED');
                            setAdminResponseNote('Không chấp thuận do lý do không đủ căn cứ xác thực.');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL GỬI CẢNH BÁO SINH VIÊN ─────────────────────────────────── */}
      {warnModalStudent && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setWarnModalStudent(null);
          }}
        >
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 my-auto animate-scale-up">
            <div className="flex items-center gap-2.5 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Gửi Cảnh Báo Cho Sinh Viên
              </h4>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Sinh viên: </span>
                <span className="font-bold text-slate-900">{warnModalStudent.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500">Mã số sinh viên: </span>
                <span className="font-mono font-bold text-blue-600">{warnModalStudent.studentCode}</span>
              </div>
              <div>
                <span className="text-slate-500">Số lần cảnh báo hiện tại: </span>
                <span className="font-bold text-amber-700">{warnModalStudent.warningCount}/3</span>
              </div>
            </div>

            <form onSubmit={handleSendWarning} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn mẫu vi phạm thường gặp:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Không check-in nhận phòng đúng giờ (No-show)',
                    'Làm ồn, mất trật tự trong khu vực tự học',
                    'Làm bẩn, không dọn dẹp vệ sinh phòng học',
                    'Sử dụng phòng quá giờ quy định',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWarnReason(preset)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do cảnh báo chi tiết:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập chi tiết lý do cảnh báo sinh viên..."
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lockAccountCheckbox"
                  checked={warnLockAccount}
                  onChange={(e) => setWarnLockAccount(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="lockAccountCheckbox" className="text-xs font-bold text-rose-700 cursor-pointer">
                  Khóa tài khoản sinh viên ngay lập tức (không cho đặt phòng)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWarnModalStudent(null)}
                  disabled={isSubmittingWarn}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWarn || !warnReason.trim()}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingWarn ? 'Đang gửi...' : 'Xác nhận cảnh báo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL XỬ LÝ KHIẾU NẠI ────────────────────────────────────────── */}
      {appealModalItem && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAppealModalItem(null);
          }}
        >
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 my-auto animate-scale-up">
            <div className="flex items-center gap-2.5">
              {appealDecision === 'APPROVED' ? (
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <h4 className="text-base font-bold text-slate-900">
                {appealDecision === 'APPROVED' ? 'Chấp Thuận Khiếu Nại' : 'Từ Chối Khiếu Nại'}
              </h4>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Sinh viên: </span>
                <span className="font-bold text-slate-900">{appealModalItem.studentName} ({appealModalItem.studentCode})</span>
              </div>
              <div>
                <span className="text-slate-500">Nội dung giải trình: </span>
                <span className="font-medium text-slate-800 italic">"{appealModalItem.reason}"</span>
              </div>
            </div>

            <form onSubmit={handleResolveAppeal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời nhắn / Phản hồi của QTV gửi tới sinh viên:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do hoặc phản hồi cho sinh viên..."
                  value={adminResponseNote}
                  onChange={(e) => setAdminResponseNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                />
              </div>

              {appealDecision === 'APPROVED' && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  ✓ Khi chấp thuận, hệ thống sẽ tự động thu hồi 1 cảnh báo vi phạm tương ứng và mở khóa tài khoản cho sinh viên nếu tài khoản đang bị khóa.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAppealModalItem(null)}
                  disabled={isSubmittingAppeal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                    appealDecision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  <span>{isSubmittingAppeal ? 'Đang xử lý...' : 'Xác nhận xử lý'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
