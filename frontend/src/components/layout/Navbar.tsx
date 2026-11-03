import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomePathByRole } from '../../utils/authUtils';
import { BookOpen, LogOut } from 'lucide-react';
import { studentNavItems, adminNavItems } from '../../config/navItems';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const currentTab = new URLSearchParams(location.search).get('tab') || 'OVERVIEW';

  const checkIsActive = (path: string, id?: string) => {
    if (isAdminOrStaff) {
      if (location.pathname !== '/admin') return false;
      return (id ?? path.split('tab=')[1]) === currentTab;
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={getHomePathByRole(user?.role)} className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Thư Viện Tòa L
              </span>
              <span className="block text-[10px] font-medium text-slate-500 -mt-1 tracking-wider uppercase">
                {isAdminOrStaff ? 'Portal QTV Thư Viện' : 'Smart Library Campus'}
              </span>
            </div>
          </Link>

          {/* Thanh điều hướng trên — chỉ hiện từ lg trở lên */}
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {isAdminOrStaff
              ? adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = checkIsActive(item.path, item.id);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {/* lg–xl: shortLabel; xl trở lên: label đầy đủ */}
                      <span className="lg:inline xl:hidden">{item.shortLabel}</span>
                      <span className="hidden xl:inline">{item.label}</span>
                    </Link>
                  );
                })
              : studentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = checkIsActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {/* lg–xl: shortLabel; xl trở lên: label đầy đủ */}
                      <span className="lg:inline xl:hidden">{item.shortLabel}</span>
                      <span className="hidden xl:inline">{item.label}</span>
                    </Link>
                  );
                })}
          </nav>

          {/* Thông tin người dùng & Đăng xuất */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-bold text-slate-800 leading-none">{user.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {isAdminOrStaff ? 'Admin QTV' : user.studentCode}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
