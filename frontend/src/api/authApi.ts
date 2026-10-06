import { USE_MOCK } from '../config/env';
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
  if (USE_MOCK) {
    const { mockLogin } = await import('./mock/authMock');
    return mockLogin(data);
  }
  return axiosClient.post('/auth/login', data);
};

export const registerApi = async (data: RegisterRequest): Promise<ApiEnvelope<RegisterResponse>> => {
  if (USE_MOCK) {
    const { mockRegister } = await import('./mock/authMock');
    return mockRegister(data);
  }
  return axiosClient.post('/auth/register', data);
};
