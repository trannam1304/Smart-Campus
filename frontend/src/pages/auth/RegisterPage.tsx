import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, UserCheck, Lock, ArrowRight, Building2, Eye, EyeOff } from 'lucide-react';
import { getHomePathByRole } from '../../utils/authUtils';
import { getErrorMessage } from '../../api/errorMessages';
import { registerApi } from '../../api/authApi';
import { useToast } from '../../hooks/useToast';
import { getStudentCodeError, getPasswordError } from '../../utils/validators';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [faculty, setFaculty] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomePathByRole(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleStudentCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStudentCode(val);
    const trimmed = val.trim();
    const err = getStudentCodeError(val);

    if (!err) {
      setFieldErrors((prev) => ({ ...prev, studentCode: '' }));
    } else if (/[^\d]/.test(trimmed) || trimmed.length > 8) {
      setFieldErrors((prev) => ({ ...prev, studentCode: err }));
    } else if (touched.studentCode) {
      setFieldErrors((prev) => ({ ...prev, studentCode: err }));
    } else {
      setFieldErrors((prev) => ({ ...prev, studentCode: '' }));
    }
  };

  const handleStudentCodeBlur = () => {
    setTouched((prev) => ({ ...prev, studentCode: true }));
    const err = getStudentCodeError(studentCode);
    setFieldErrors((prev) => ({ ...prev, studentCode: err }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    const err = getPasswordError(val);
    if (!err) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    } else if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: err }));
    }
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    const err = getPasswordError(password);
    setFieldErrors((prev) => ({ ...prev, password: err }));
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);
    if (val.trim()) {
      setFieldErrors((prev) => ({ ...prev, fullName: '' }));
    } else if (touched.fullName) {
      setFieldErrors((prev) => ({ ...prev, fullName: 'Vui lòng nhập họ và tên sinh viên' }));
    }
  };

  const handleFullNameBlur = () => {
    setTouched((prev) => ({ ...prev, fullName: true }));
    if (!fullName.trim()) {
      setFieldErrors((prev) => ({ ...prev, fullName: 'Vui lòng nhập họ và tên sinh viên' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, fullName: '' }));
    }
  };

  const handleFacultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFaculty(val);
    if (val.trim()) {
      setFieldErrors((prev) => ({ ...prev, faculty: '' }));
    } else if (touched.faculty) {
      setFieldErrors((prev) => ({ ...prev, faculty: 'Vui lòng nhập khoa' }));
    }
  };

  const handleFacultyBlur = () => {
    setTouched((prev) => ({ ...prev, faculty: true }));
    if (!faculty.trim()) {
      setFieldErrors((prev) => ({ ...prev, faculty: 'Vui lòng nhập khoa' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, faculty: '' }));
    }
  };

  const isFormInvalid =
    !fullName.trim() ||
    !faculty.trim() ||
    getStudentCodeError(studentCode) !== '' ||
    getPasswordError(password) !== '' ||
    Object.values(fieldErrors).some((err) => !!err);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const scErr = getStudentCodeError(studentCode);
    const pwErr = getPasswordError(password);
    const fnErr = !fullName.trim() ? 'Vui lòng nhập họ và tên sinh viên' : '';
    const fcErr = !faculty.trim() ? 'Vui lòng nhập khoa' : '';

    const newFieldErrors = {
      studentCode: scErr,
      password: pwErr,
      fullName: fnErr,
      faculty: fcErr,
    };
    setFieldErrors(newFieldErrors);
    setTouched({
      studentCode: true,
      password: true,
      fullName: true,
      faculty: true,
    });

    if (scErr || pwErr || fnErr || fcErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerApi({
        fullName: fullName.trim(),
        studentCode: studentCode.trim(),
        password,
        faculty: faculty.trim(),
      });
      success('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 animate-scale-up">
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="Logo Thư Viện Thông Minh"
            className="w-16 h-16 mx-auto object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đăng Ký Tài Khoản</h2>
          <p className="text-xs font-medium text-slate-500">Tài khoản sinh viên Thư Viện Thông Minh</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Họ và tên sinh viên
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập Họ và tên"
                value={fullName}
                onChange={handleFullNameChange}
                onBlur={handleFullNameBlur}
                className={`w-full pl-4 pr-10 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                  fieldErrors.fullName
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            {fieldErrors.fullName && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mã số sinh viên
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập MSSV"
                  value={studentCode}
                  onChange={handleStudentCodeChange}
                  onBlur={handleStudentCodeBlur}
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                    fieldErrors.studentCode
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                  required
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              {fieldErrors.studentCode && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  {fieldErrors.studentCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Khoa
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập Khoa"
                  value={faculty}
                  onChange={handleFacultyChange}
                  onBlur={handleFacultyBlur}
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                    fieldErrors.faculty
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                  required
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              {fieldErrors.faculty && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  {fieldErrors.faculty}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                className={`w-full pl-4 pr-11 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                  fieldErrors.password
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3.5 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">
                Từ 8 ký tự, gồm chữ cái, chữ số và ký tự đặc biệt (@$!%*#?&).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isFormInvalid}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Đang xử lý...' : 'Tạo Tài Khoản'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
