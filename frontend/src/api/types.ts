export interface ApiEnvelope<T> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  success: boolean;
  code: number;
  errorCode?: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalElements: number;
    totalPages: number;
  };
}
