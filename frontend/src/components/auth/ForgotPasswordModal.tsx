import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle2, X, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { forgotPasswordApi, resetPasswordApi } from '../../api/authApi';
import { getErrorMessage } from '../../api/errorMessages';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [step, setStep] = useState<'REQUEST_OTP' | 'RESET_PASSWORD' | 'SUCCESS'>('REQUEST_OTP');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setStep('REQUEST_OTP');
      setCountdown(0);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email trường.');
      return;
    }

    if (!trimmedEmail.endsWith('@student.edu.vn') && !trimmedEmail.includes('@')) {
      setError('Vui lòng sử dụng email trường có định dạng @student.edu.vn');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPasswordApi(trimmedEmail);
      setStep('RESET_PASSWORD');
      setCountdown(300); // 5 phút đếm ngược
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 240) return; // Chỉ cho gửi lại sau 60s
    setError('');
    setIsSubmitting(true);
    try {
      await forgotPasswordApi(email.trim().toLowerCase());
      setCountdown(300);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Vui lòng nhập đúng mã OTP được gửi.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordApi(cleanOtp, newPassword);
      setStep('SUCCESS');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* BƯỚC 1: YÊU CẦU MÃ OTP */}
        {step === 'REQUEST_OTP' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Khôi Phục Mật Khẩu</h3>
              <p className="text-xs text-slate-500 font-medium">
                Nhập email sinh viên (@student.edu.vn) để nhận mã OTP xác thực đổi mật khẩu.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Trường
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="MSSV@student.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Mã Xác Thực OTP'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Nhớ mật khẩu? Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: NHẬP OTP & MẬT KHẨU MỚI */}
        {step === 'RESET_PASSWORD' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Đặt Mật Khẩu Mới</h3>
              <p className="text-xs text-slate-500 font-medium">
                Mã xác thực đã được gửi tới: <span className="font-semibold text-slate-800">{email}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mã OTP (6 chữ số)
                  </label>
                  {countdown > 0 ? (
                    <span className="text-[11px] font-semibold text-amber-600">
                      Hiệu lực: {formatCountdown(countdown)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-rose-600">
                      Mã đã hết hạn
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center tracking-widest font-mono text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting || countdown > 240}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Gửi lại mã OTP</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Đang cập nhật...' : 'Xác Nhận & Đổi Mật Khẩu'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* BƯỚC 3: THÀNH CÔNG */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Đổi Mật Khẩu Thành Công!</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Mật khẩu của bạn đã được cập nhật an toàn. Toàn bộ phiên đăng nhập cũ đã được vô hiệu hóa.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all"
            >
              Đăng Nhập Ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

