import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types/auth';
import { loginApi, logoutApi, refreshTokenApi } from '../api/authApi';
import { setAccessToken } from '../api/axiosClient';

interface AuthContextType extends AuthState {
  login: (username: string, password?: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setAccessToken(savedToken);
          setAuthState({
            user: parsedUser,
            token: savedToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Cố gắng silent refresh ngầm để đổi sang token mới nhất
          refreshTokenApi()
            .then((res) => {
              if (res.data?.accessToken) {
                const newTok = res.data.accessToken;
                const newUsr = res.data.user;
                setAccessToken(newTok);
                localStorage.setItem('token', newTok);
                if (newUsr) {
                  localStorage.setItem('user', JSON.stringify(newUsr));
                  setAuthState((prev) => ({
                    ...prev,
                    user: newUsr,
                    token: newTok,
                  }));
                }
              }
            })
            .catch(() => {
              // Bỏ qua nếu refresh thất bại (token cũ vẫn có thể còn hạn)
            });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAccessToken(null);
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        // Chưa có token trong storage -> thử xin Access Token mới từ HttpOnly Refresh Token
        refreshTokenApi()
          .then((res) => {
            if (res.data?.accessToken && res.data?.user) {
              setAccessToken(res.data.accessToken);
              localStorage.setItem('token', res.data.accessToken);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              setAuthState({
                user: res.data.user,
                token: res.data.accessToken,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              setAuthState((prev) => ({ ...prev, isLoading: false }));
            }
          })
          .catch(() => {
            setAuthState((prev) => ({ ...prev, isLoading: false }));
          });
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password?: string): Promise<User> => {
    try {
      const response = await loginApi({ username, password, authProvider: 'LOCAL' });
      if (!response.data) throw new Error("No data in response");
      const { accessToken, user } = response.data;

      setAccessToken(accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (error: any) {
      setAccessToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      throw error;
    }
  };

  const logout = () => {
    logoutApi();
    setAccessToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
