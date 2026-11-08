import axiosClient from './axiosClient';
import { ApiEnvelope } from './types';
import { User } from '../types/auth';

export interface LoginRequest {
  username: string;
  password?: string;
  authProvider?: 'LOCAL' | 'GOOGLE' | 'MICROSOFT';
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  studentCode: string;
  password?: string;
  faculty?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  accessToken: string;
  user: User;
}

export const loginApi = async (data: LoginRequest): Promise<ApiEnvelope<LoginResponse>> => {
  const res: any = await axiosClient.post('/auth/login', data);
  const d = res.data;
  const accessToken = d?.accessToken || d?.token || '';
  const rawRole = (d?.role || d?.user?.role || 'STUDENT').toUpperCase();
  const role: User['role'] = (rawRole === 'ADMIN') ? 'ADMIN' : (rawRole === 'STAFF' || rawRole === 'ADMIN_STAFF' ? 'STAFF' : 'STUDENT');

  const user: User = d?.user || {
    id: String(d?.userId || d?.id || '1'),
    fullName: d?.fullName || data.username,
    email: d?.email || (data.username.includes('@') ? data.username : `${data.username}@student.edu.vn`),
    studentCode: d?.studentCode || (data.username.includes('@') ? '' : data.username),
    role,
    libraryTrained: true,
    noShowCount: 0,
    isLocked: false,
  };

  return {
    ...res,
    data: {
      accessToken,
      user,
    },
  };
};

export const registerApi = async (data: RegisterRequest): Promise<ApiEnvelope<RegisterResponse>> => {
  const res: any = await axiosClient.post('/auth/register', data);
  const d = res.data;
  const accessToken = d?.accessToken || d?.token || '';
  const user: User = d?.user || {
    id: String(d?.userId || d?.id || '1'),
    fullName: data.fullName,
    email: data.email,
    studentCode: data.studentCode,
    role: 'STUDENT',
    libraryTrained: true,
    noShowCount: 0,
    isLocked: false,
  };

  return {
    ...res,
    data: {
      accessToken,
      user,
    },
  };
};
