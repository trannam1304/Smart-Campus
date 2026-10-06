export type UserRole = 'STUDENT' | 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  fullName: string;
  email: string;
  studentCode?: string;
  role: UserRole;
  faculty?: string;
  avatarUrl?: string;
  libraryTrained?: boolean;
  noShowCount?: number;
  isLocked?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
