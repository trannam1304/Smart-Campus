import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorBody } from './types';

export class ApiError extends Error {
  public status: number;
  public errorCode?: string;
  public details?: any;

  constructor(status: number, message: string, errorCode?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// In-Memory Token (An toàn trong RAM, phòng chống tấn công XSS)
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

const axiosClient = axios.create({
  baseURL,
  withCredentials: true, // Tự động gửi và nhận HttpOnly Cookie (Refresh Token)
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = inMemoryAccessToken || localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let isNavigatingToLogin = false;

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as ApiErrorBody;

      const isAuthUrl =
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/register');

      // Tự động Silent Refresh khi gặp 401 Unauthorized hoặc 403 Forbidden (phiên hết hạn)
      if ((status === 401 || status === 403) && !originalRequest._retry && !isAuthUrl) {
        if (originalRequest?.url?.includes('/auth/refresh')) {
          // Chính API refresh bị 401 (Refresh Token hết hạn hoặc bị thu hồi) -> Bắt buộc logout
          setAccessToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          if (!isNavigatingToLogin && window.location.pathname !== '/login') {
            isNavigatingToLogin = true;
            window.location.href = '/login';
          }
          const message = data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          return Promise.reject(new ApiError(status, message, data?.errorCode, data?.details));
        }

        if (isRefreshing) {
          // Nếu đang có tiến trình refresh chạy dở -> xếp request vào hàng đợi (Queue)
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers && token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Gọi API refresh ngầm (Cookie HttpOnly chứa Refresh Token tự động gửi kèm)
          const refreshRes: any = await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          const newAccessToken =
            refreshRes.data?.data?.token ||
            refreshRes.data?.data?.accessToken ||
            refreshRes.data?.token;

          if (newAccessToken) {
            setAccessToken(newAccessToken);
            localStorage.setItem('token', newAccessToken);
            processQueue(null, newAccessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return axiosClient(originalRequest);
          } else {
            throw new Error('Không nhận được Access Token mới');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          setAccessToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          if (!isNavigatingToLogin && window.location.pathname !== '/login') {
            isNavigatingToLogin = true;
            window.location.href = '/login';
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      const message = data?.message || error.message || 'Lỗi không xác định';
      throw new ApiError(status, message, data?.errorCode, data?.details);
    }

    throw error;
  }
);

export default axiosClient;
