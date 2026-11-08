import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, User, Lock, ArrowRight } from 'lucide-react';
import { getHomePathByRole } from '../../utils/authUtils';
import { getErrorMessage } from '../../api/errorMessages';
import { USE_MOCK } from '../../config/env';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomePathByRole(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tài khoản và mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(username, password);
      navigate(getHomePathByRole(loggedUser.role), { replace: true });
    } catch (err: any) {
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đăng Nhập Hệ Thống</h2>
          <p className="text-xs font-medium text-slate-500">Đặt Phòng & Cơ Sở Học Tập Thư Viện Thông Minh</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email hoặc MSSV
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="MSSV hoặc Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Đang xử lý...' : 'Vào Hệ Thống'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Chưa có tài khoản sinh viên?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {USE_MOCK && (
          <div className="mt-4 p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Chế độ demo (dữ liệu giả lập)</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { setUsername('52100888'); setPassword('123'); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs hover:bg-amber-100 transition-colors"
              >
                <div className="font-bold text-slate-700">🎓 Sinh viên</div>
                <div className="text-slate-500">52100888 / 123</div>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('admin@library.edu.vn'); setPassword('admin'); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs hover:bg-amber-100 transition-colors"
              >
                <div className="font-bold text-slate-700">🛡️ Admin</div>
                <div className="text-slate-500">admin@library.edu.vn / admin</div>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('staff.tang12@lib.tdtu.edu.vn'); setPassword('Admin@2026'); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs hover:bg-amber-100 transition-colors"
              >
                <div className="font-bold text-slate-700">💼 Staff</div>
                <div className="text-slate-500">staff.tang12@lib.tdtu.edu.vn / Admin@2026</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
