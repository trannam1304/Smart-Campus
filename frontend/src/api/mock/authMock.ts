import { ApiEnvelope } from '../types';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../authApi';
import { ApiError } from '../axiosClient';

const defaultAccounts = [
  {
    email: '52100888@student.edu.vn',
    studentCode: '52100888',
    password: '123',
    user: { id: 'u-student', fullName: 'La Thái Thành', email: '52100888@student.edu.vn', role: 'STUDENT', studentCode: '52100888', libraryTrained: true, noShowCount: 0, isLocked: false }
  },
  {
    email: 'locked@student.edu.vn',
    studentCode: '',
    password: '123',
    user: { id: 'u-locked', fullName: 'Sinh viên bị khóa', email: 'locked@student.edu.vn', role: 'STUDENT', studentCode: '00000000', libraryTrained: true, noShowCount: 3, isLocked: true }
  },
  {
    email: 'admin@library.edu.vn',
    studentCode: '',
    password: 'admin',
    user: { id: 'u-admin-1', fullName: 'Admin Default', email: 'admin@library.edu.vn', role: 'ADMIN', libraryTrained: true, noShowCount: 0, isLocked: false }
  },
  {
    email: 'admin@smartcampus.tdtu.edu.vn',
    studentCode: '',
    password: 'Admin@2026',
    user: { id: 'u-admin-2', fullName: 'Admin SmartCampus', email: 'admin@smartcampus.tdtu.edu.vn', role: 'ADMIN', libraryTrained: true, noShowCount: 0, isLocked: false }
  },
  {
    email: 'staff.tang12@lib.tdtu.edu.vn',
    studentCode: '',
    password: 'Admin@2026',
    user: { id: 'u-staff', fullName: 'Nhân viên Tầng 1/2', email: 'staff.tang12@lib.tdtu.edu.vn', role: 'STAFF', libraryTrained: true, noShowCount: 0, isLocked: false }
  }
];

const getStoredAccounts = () => {
  try {
    const data = localStorage.getItem('smart_campus_mock_db');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveStoredAccount = (acc: any) => {
  const list = getStoredAccounts();
  list.push(acc);
  localStorage.setItem('smart_campus_mock_db', JSON.stringify(list));
};

export const mockLogin = async (data: LoginRequest): Promise<ApiEnvelope<LoginResponse>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const allAccounts = [...defaultAccounts, ...getStoredAccounts()];
      const usernameLower = data.username.toLowerCase();
      
      const account = allAccounts.find(a => 
        (a.email.toLowerCase() === usernameLower || (a.studentCode && a.studentCode.toLowerCase() === usernameLower)) &&
        a.password === data.password
      );

      if (!account) {
        return reject(new ApiError(401, 'Email/MSSV hoặc mật khẩu không chính xác'));
      }

      resolve({
        success: true,
        code: 200,
        message: 'Thành công',
        data: {
          accessToken: `mock-jwt-${account.user.id}-${Date.now()}`,
          user: account.user
        },
        timestamp: new Date().toISOString()
      });
    }, 400);
  });
};

export const mockRegister = async (data: RegisterRequest): Promise<ApiEnvelope<RegisterResponse>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const allAccounts = [...defaultAccounts, ...getStoredAccounts()];
      const isDuplicate = allAccounts.some(a => 
        a.email.toLowerCase() === data.email.toLowerCase() || 
        (a.studentCode && data.studentCode && a.studentCode.toLowerCase() === data.studentCode.toLowerCase())
      );

      if (isDuplicate) {
        return reject(new ApiError(409, 'Email hoặc MSSV đã được đăng ký'));
      }

      const newUser = {
        id: `u-${Date.now()}`,
        fullName: data.fullName,
        email: data.email,
        role: 'STUDENT',
        studentCode: data.studentCode,
        faculty: data.faculty,
        libraryTrained: true,
        noShowCount: 0,
        isLocked: false
      };

      saveStoredAccount({
        email: data.email,
        studentCode: data.studentCode,
        password: data.password || '123',
        user: newUser
      });

      resolve({
        success: true,
        code: 200,
        message: 'Đăng ký thành công',
        data: {
          accessToken: '', // Requirement: No token returned for register in this mock
          user: newUser
        } as any,
        timestamp: new Date().toISOString()
      });
    }, 400);
  });
};
