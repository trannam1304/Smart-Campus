/**
 * Nguồn dữ liệu duy nhất cho menu điều hướng.
 * Navbar và MobileFooterNav đều đọc từ file này — KHÔNG khai báo mảng riêng ở nơi khác.
 */
import {
  Building2,
  CalendarCheck,
  QrCode,
  Wrench,
  Search,
  MapPin,
  BarChart3,
  CheckSquare,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

export interface StudentNavItem {
  label: string;       // Nhãn đầy đủ — dùng trên nav ≥ xl hoặc desktop rộng
  shortLabel: string;  // Nhãn rút gọn — dùng trên nav lg–xl và thanh đáy mobile
  path: string;
  icon: LucideIcon;
}

export interface AdminNavItem {
  id: string;
  label: string;
  shortLabel: string;
  path: string;
  icon: LucideIcon;
}

export const studentNavItems: StudentNavItem[] = [
  {
    label: 'Sơ đồ Thư viện',
    shortLabel: 'Sơ đồ',
    path: '/architectural-map',
    icon: MapPin,
  },
  {
    label: 'Đặt phòng',
    shortLabel: 'Đặt phòng',
    path: '/browse',
    icon: Building2,
  },
  {
    label: 'Tìm phòng',
    shortLabel: 'Tìm phòng',
    path: '/search-rooms',
    icon: Search,
  },
  {
    label: 'Quét mã QR check in',
    shortLabel: 'Quét QR',
    path: '/checkin',
    icon: QrCode,
  },
  {
    label: 'Báo sự cố',
    shortLabel: 'Báo sự cố',
    path: '/incident-report',
    icon: Wrench,
  },
  {
    label: 'Lịch của tôi',
    shortLabel: 'Lịch của tôi',
    path: '/my-bookings',
    icon: CalendarCheck,
  },
];

export const adminNavItems: AdminNavItem[] = [
  {
    id: 'OVERVIEW',
    label: 'Analytic Thống Kê',
    shortLabel: 'Thống kê',
    path: '/admin?tab=OVERVIEW',
    icon: BarChart3,
  },
  {
    id: 'ROOMS',
    label: 'Quản Lý Phòng',
    shortLabel: 'Phòng',
    path: '/admin?tab=ROOMS',
    icon: Building2,
  },
  {
    id: 'REGISTRATIONS',
    label: 'Duyệt Đơn Đặt Phòng',
    shortLabel: 'Duyệt đơn',
    path: '/admin?tab=REGISTRATIONS',
    icon: CheckSquare,
  },
  {
    id: 'BOOKINGS',
    label: 'Danh Sách Lịch Đặt',
    shortLabel: 'Lịch đặt',
    path: '/admin?tab=BOOKINGS',
    icon: CalendarCheck,
  },
  {
    id: 'INCIDENTS',
    label: 'Xử Lý Sự Cố & Vi Phạm',
    shortLabel: 'Sự cố',
    path: '/admin?tab=INCIDENTS',
    icon: AlertTriangle,
  },
];
