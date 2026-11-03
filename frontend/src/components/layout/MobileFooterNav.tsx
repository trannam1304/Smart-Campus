import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentNavItems, adminNavItems } from '../../config/navItems';

/**
 * Thanh điều hướng đáy — chỉ hiện dưới lg (lg:hidden).
 * Sinh viên: 6 cột, admin/staff: 5 cột.
 * Đồng nhất breakpoint với Navbar (hidden lg:flex).
 */
export const MobileFooterNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const currentTab = new URLSearchParams(location.search).get('tab') || 'OVERVIEW';

  if (isAdminOrStaff) {
    return (
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Admin navigation"
      >
        <div className="grid grid-cols-5 h-16">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === '/admin' && item.id === currentTab;

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-[10px] font-semibold leading-tight text-center px-0.5">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Student navigation"
    >
      <div className="grid grid-cols-6 h-16">
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span className="text-[10px] font-semibold leading-tight text-center px-0.5">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
