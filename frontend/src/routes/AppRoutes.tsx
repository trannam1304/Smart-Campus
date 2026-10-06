import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ArchitecturalMapPage } from '../pages/student/ArchitecturalMapPage';
import { FloorBrowserPage } from '../pages/student/FloorBrowserPage';
import { SearchRoomsPage } from '../pages/student/SearchRoomsPage';
import { MyBookingsPage } from '../pages/student/MyBookingsPage';
import { QRScannerPage } from '../pages/checkin/QRScannerPage';
import { IncidentReportPage } from '../pages/incident/IncidentReportPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { getHomePathByRole } from '../utils/authUtils';

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomePathByRole(user.role)} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/architectural-map"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ArchitecturalMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/browse"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <FloorBrowserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search-rooms"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <SearchRoomsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkin"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <QRScannerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incident-report"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <IncidentReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
