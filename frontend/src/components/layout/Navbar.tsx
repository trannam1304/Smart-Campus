import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomePathByRole } from '../../utils/authUtils';
import { LogOut, AlertTriangle, Menu, X } from 'lucide-react';
import { studentNavItems, adminNavItems } from '../../config/navItems';
import { getStudentWarningsApi, StudentWarningSummary } from '../../api/violationApi';
import { StudentWarningModal } from '../student/StudentWarningModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [warningSummary, setWarningSummary] = useState<StudentWarningSummary | null>(null);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavOverflowing, setIsNavOverflowing] = useState(false);

  const headerRowRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const restoreWidthRef = useRef<number>(0);

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const currentTab = new URLSearchParams(location.search).get('tab') || 'OVERVIEW';

  const fetchStudentWarnings = useCallback(async () => {
    if (!user || isAdminOrStaff) return;
    try {
      const res = await getStudentWarningsApi();
      if (res.success && res.data) {
        setWarningSummary(res.data);
      }
    } catch {
      // Bỏ qua lỗi âm thầm khi chưa có hoặc phiên chưa sẵn sàng
    }
  }, [user, isAdminOrStaff]);

  useEffect(() => {
    fetchStudentWarnings();
  }, [fetchStudentWarnings]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Tự động chuyển sang menu thu gọn ngay khi phát hiện thanh nav có nguy cơ tràn/chồng chữ
  useEffect(() => {
    if (!user) {
      setIsNavOverflowing(false);
      return;
    }

    const checkOverflow = () => {
      const row = headerRowRef.current;
      const nav = navRef.current;
      if (!row) return;

      if (nav && nav.offsetParent !== null) {
        if (nav.scrollWidth > nav.clientWidth + 2) {
          restoreWidthRef.current = row.clientWidth + (nav.scrollWidth - nav.clientWidth) + 24;
          setIsNavOverflowing(true);
        }
      } else if (isNavOverflowing && restoreWidthRef.current > 0 && row.clientWidth >= restoreWidthRef.current) {
        setIsNavOverflowing(false);
      }
    };

    checkOverflow();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRowRef.current) {
      ro = new ResizeObserver(checkOverflow);
      ro.observe(headerRowRef.current);
      if (navRef.current) {
        ro.observe(navRef.current);
      }
    }
    window.addEventListener('resize', checkOverflow);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [user, isAdminOrStaff, warningSummary, isNavOverflowing]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const checkIsActive = (path: string, id?: string) => {
    if (isAdminOrStaff) {
      if (location.pathname !== '/admin') return false;
      return (id ?? path.split('tab=')[1]) === currentTab;
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRowRef} className="flex items-center justify-between gap-3 h-16">

          {/* Logo */}
          <Link to={getHomePathByRole(user?.role)} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <img
              src="/logo.png"
              alt="Logo Thư Viện Thông Minh"
              className="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0"
            />
            <div>
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                Thư Viện Thông Minh
              </span>
              <span className="block text-[10px] font-medium text-slate-500 -mt-1 tracking-wider uppercase whitespace-nowrap">
                {isAdminOrStaff ? 'Portal QTV Thư Viện' : 'Smart Library Campus'}
              </span>
            </div>
          </Link>

          {/* Thanh điều hướng trên — tự động ẩn sang menu Hamburger nếu màn hình nhỏ hơn xl hoặc có nguy cơ tràn */}
          {user && !isNavOverflowing && (
            <nav
              ref={navRef}
              className="hidden xl:flex flex-1 min-w-0 items-center justify-center gap-1.5 px-2 overflow-hidden"
            >
              {isAdminOrStaff
                ? adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = checkIsActive(item.path, item.id);
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="2xl:hidden">{item.shortLabel}</span>
                        <span className="hidden 2xl:inline">{item.label}</span>
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
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="2xl:hidden">{item.shortLabel}</span>
                        <span className="hidden 2xl:inline">{item.label}</span>
                      </Link>
                    );
                  })}
            </nav>
          )}

          {/* Thông tin người dùng, Cảnh báo vi phạm & Đăng xuất */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* NÚT ICON CẢNH BÁO VI PHẠM KẾ BÊN TÀI KHOẢN SINH VIÊN */}
                {warningSummary && (warningSummary.warningCount > 0 || warningSummary.isLocked) && (
                  <button
                    type="button"
                    onClick={() => setIsWarningModalOpen(true)}
                    aria-label={
                      warningSummary.isLocked
                        ? `Tài khoản bị khóa (${warningSummary.warningCount} cảnh báo)`
                        : `Cảnh báo vi phạm (${warningSummary.warningCount})`
                    }
                    title={
                      warningSummary.isLocked
                        ? 'Tài khoản bị khóa. Nhấn để xem lý do và gửi khiếu nại.'
                        : `Bạn có ${warningSummary.warningCount} cảnh báo vi phạm. Nhấn để xem lý do và gửi khiếu nại.`
                    }
                    className={`relative h-10 w-10 flex items-center justify-center rounded-xl border transition-all shrink-0 ${
                      warningSummary.isLocked
                        ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 shadow-sm shadow-rose-200/60'
                        : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-sm shadow-amber-200/60'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${warningSummary.isLocked ? 'text-rose-600' : 'text-amber-600'}`} />
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black leading-none flex items-center justify-center shadow-sm ring-2 ring-white">
                      {warningSummary.isLocked ? '!' : warningSummary.warningCount}
                    </span>
                  </button>
                )}

                <div className="h-10 flex items-center gap-2 px-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <span className="block text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">{user.fullName}</span>
                    <span className="block text-[10px] text-slate-500 font-medium leading-tight">
                      {isAdminOrStaff ? 'Admin QTV' : user.studentCode}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                  className={`${isNavOverflowing ? 'flex' : 'xl:hidden flex'} h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0`}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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

        {/* Menu xổ xuống khi thu gọn hoặc khi có nguy cơ tràn (chỉ khi đã đăng nhập) */}
        {user && isMobileMenuOpen && (
          <nav className={`${isNavOverflowing ? 'grid' : 'xl:hidden grid'} py-3 border-t border-slate-100 grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in`}>
            {isAdminOrStaff
              ? adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = checkIsActive(item.path, item.id);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
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
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
          </nav>
        )}
      </div>

      {/* Modal Chi Tiết Cảnh Báo & Khiếu Nại dành cho Sinh Viên */}
      <StudentWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        summary={warningSummary}
        onRefresh={fetchStudentWarnings}
      />
    </header>
  );
};
