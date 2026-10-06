import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomePathByRole } from '../../utils/authUtils';
import { 
  Building2, 
  CalendarCheck, 
  QrCode, 
  Wrench, 
  ShieldCheck, 
  LogOut, 
  Search,
  BookOpen,
  MapPin,
  CheckSquare,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentNavItems = [
    { label: 'Sơ đồ Thư viện', path: '/architectural-map', icon: MapPin },
    { label: 'Đặt phòng', path: '/browse', icon: Building2 },
    { label: 'Tìm phòng', path: '/search-rooms', icon: Search },
    { label: 'Quét mã QR check in', path: '/checkin', icon: QrCode },
    { label: 'Báo sự cố', path: '/incident-report', icon: Wrench },
    { label: 'Lịch của tôi', path: '/my-bookings', icon: CalendarCheck },
  ];

  const adminNavItems = [
    { label: 'Analytic Thống Kê', path: '/admin?tab=OVERVIEW', icon: BarChart3 },
    { label: 'Quản Lý Phòng', path: '/admin?tab=ROOMS', icon: Building2 },
    { label: 'Duyệt Đơn Đăng Ký', path: '/admin?tab=REGISTRATIONS', icon: CheckSquare },
    { label: 'Danh Sách Lịch Đặt', path: '/admin?tab=BOOKINGS', icon: CalendarCheck },
    { label: 'Xử Lý Sự Cố & Vi Phạm', path: '/admin?tab=INCIDENTS', icon: AlertTriangle },
  ];

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const currentNavItems = isAdminOrStaff ? adminNavItems : studentNavItems;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={getHomePathByRole(user?.role)} className="flex items-center gap-3 group">
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

          {/* Navigation Bar Top */}
          <nav className="hidden lg:flex items-center gap-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname + location.search === item.path || location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-bold text-slate-800 leading-none">{user.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{isAdminOrStaff ? 'Admin QTV' : user.studentCode}</span>
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
