import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';

export interface UserWarningItem {
  id: number;
  warningId?: number;
  reason: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface StudentViolation {
  userId: number;
  fullName: string;
  studentCode: string;
  email: string;
  department: string;
  status: 'ACTIVE' | 'LOCKED' | 'PENDING';
  noShowCount: number;
  warningCount: number;
  warnings: UserWarningItem[];
}

export interface StudentAppeal {
  id: number;
  appealId: number;
  userId: number;
  studentName?: string;
  studentCode?: string;
  email?: string;
  warningId?: number;
  warningReason?: string;
  warningDate?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface StudentWarningSummary {
  userId: number;
  studentCode: string;
  fullName: string;
  accountStatus: string;
  isLocked: boolean;
  warningCount: number;
  warnings: UserWarningItem[];
  appeals: StudentAppeal[];
}

// ─── ADMIN APIs ─────────────────────────────────────────────────────────────

export const getViolationsApi = async (): Promise<ApiEnvelope<StudentViolation[]>> => {
  return await axiosClient.get('/admin/violations');
};

export const warnStudentApi = async (data: {
  userId?: number;
  studentCode?: string;
  reason: string;
  severity?: string;
  lockAccount?: boolean;
}): Promise<ApiEnvelope<{ userId: number; warningCount: number; accountStatus: string; message: string }>> => {
  return await axiosClient.post('/admin/violations/warn', data);
};

export const toggleLockAccountApi = async (data: {
  userId?: number;
  studentCode?: string;
  status: 'ACTIVE' | 'LOCKED';
}): Promise<ApiEnvelope<{ userId: number; status: string; message: string }>> => {
  return await axiosClient.put('/admin/violations/lock', data);
};

export const getAppealsApi = async (): Promise<ApiEnvelope<StudentAppeal[]>> => {
  return await axiosClient.get('/admin/appeals');
};

export const resolveAppealApi = async (
  appealId: number,
  data: { status: 'APPROVED' | 'REJECTED'; adminResponse?: string }
): Promise<ApiEnvelope<{ appealId: number; status: string; message: string }>> => {
  return await axiosClient.put(`/admin/appeals/${appealId}/resolve`, data);
};

// ─── STUDENT APIs ───────────────────────────────────────────────────────────

export const getStudentWarningsApi = async (): Promise<ApiEnvelope<StudentWarningSummary>> => {
  return await axiosClient.get('/student/warnings');
};

export const submitStudentAppealApi = async (data: {
  warningId?: number;
  reason: string;
}): Promise<ApiEnvelope<{ appealId: number; status: string; message: string }>> => {
  return await axiosClient.post('/student/appeals', data);
};
