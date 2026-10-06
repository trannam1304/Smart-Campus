import axios from 'axios';
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

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isNavigatingToLogin = false;

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as ApiErrorBody;
      
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!isNavigatingToLogin && window.location.pathname !== '/login') {
            isNavigatingToLogin = true;
            window.location.href = '/login';
        }
      }
      
      const message = data?.message || error.message || 'Lỗi không xác định';
      throw new ApiError(status, message, data?.errorCode, data?.details);
    }
    
    throw error;
  }
);

export default axiosClient;
