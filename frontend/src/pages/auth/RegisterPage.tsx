import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, User, Mail, UserCheck, Lock, ArrowRight, Building2 } from 'lucide-react';
import { getHomePathByRole } from '../../utils/authUtils';
import { getErrorMessage } from '../../api/errorMessages';
import { registerApi } from '../../api/authApi';
import { useToast } from '../../hooks/useToast';
import { getStudentCodeError, getPasswordError, getEmailError } from '../../utils/validators';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    const err = getEmailError(val);
    if (!err) {
      setFieldErrors((prev) => ({ ...prev, email: '' }));
    } else if (touched.email) {
      setFieldErrors((prev) => ({ ...prev, email: err }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const err = getEmailError(email);
    setFieldErrors((prev) => ({ ...prev, email: err }));
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
    getEmailError(email) !== '' ||
    getPasswordError(password) !== '' ||
    Object.values(fieldErrors).some((err) => !!err);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const scErr = getStudentCodeError(studentCode);
    const emErr = getEmailError(email);
    const pwErr = getPasswordError(password);
    const fnErr = !fullName.trim() ? 'Vui lòng nhập họ và tên sinh viên' : '';
    const fcErr = !faculty.trim() ? 'Vui lòng nhập khoa' : '';

    const newFieldErrors = {
      studentCode: scErr,
      email: emErr,
      password: pwErr,
      fullName: fnErr,
      faculty: fcErr,
    };
    setFieldErrors(newFieldErrors);
    setTouched({
      studentCode: true,
      email: true,
      password: true,
      fullName: true,
      faculty: true,
    });

    if (scErr || emErr || pwErr || fnErr || fcErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerApi({
        fullName: fullName.trim(),
        email: email.trim(),
        studentCode: studentCode.trim(),
        password,
        faculty: faculty.trim(),
      });
      success('Vui lòng kiểm tra email trường để xác nhận tài khoản');
      navigate('/login');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đăng Ký Tài Khoản</h2>
          <p className="text-xs font-medium text-slate-500">Tài khoản sinh viên mượn phòng tự học thư viện</p>
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
                placeholder="La Thái Thành"
                value={fullName}
                onChange={handleFullNameChange}
                onBlur={handleFullNameBlur}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                  fieldErrors.fullName
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
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
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                    fieldErrors.studentCode
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                  required
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
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
                  placeholder="Công Nghệ Thông Tin"
                  value={faculty}
                  onChange={handleFacultyChange}
                  onBlur={handleFacultyBlur}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                    fieldErrors.faculty
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                  required
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
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
              Email trường (@student.edu.vn)
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Email sinh viên"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                  fieldErrors.email
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-none transition-colors ${
                  fieldErrors.password
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
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
