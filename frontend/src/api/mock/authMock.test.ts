import { describe, it, expect, beforeEach } from 'vitest';
import { mockLogin, mockRegister } from './authMock';

// Polyfill for localStorage in test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('authMock API', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should authenticate admin and return role ADMIN', async () => {
    const response = await mockLogin({ username: 'admin@library.edu.vn', password: 'admin' });
    expect(response.success).toBe(true);
    expect(response.data?.user.role).toBe('ADMIN');
  });

  it('should authenticate student using email', async () => {
    const response = await mockLogin({ username: '52100888@student.edu.vn', password: '123' });
    expect(response.success).toBe(true);
    expect(response.data?.user.role).toBe('STUDENT');
  });

  it('should authenticate student using MSSV', async () => {
    const response = await mockLogin({ username: '52100888', password: '123' });
    expect(response.success).toBe(true);
    expect(response.data?.user.role).toBe('STUDENT');
  });

  it('should throw 401 ApiError for wrong password', async () => {
    await expect(mockLogin({ username: '52100888', password: 'wrong' }))
      .rejects.toHaveProperty('status', 401);
  });

  it('should throw 401 ApiError for unknown user', async () => {
    await expect(mockLogin({ username: 'unknown@test.com', password: '123' }))
      .rejects.toHaveProperty('status', 401);
  });

  it('should successfully register a new user and allow login', async () => {
    const registerReq = {
      fullName: 'Test User',
      email: 'newuser@student.edu.vn',
      studentCode: '99999999',
      password: 'password123',
      faculty: 'IT'
    };

    const regRes = await mockRegister(registerReq);
    expect(regRes.success).toBe(true);
    expect(regRes.data?.user.email).toBe('newuser@student.edu.vn');
    // Ensure no token is returned for register in our mock
    expect(regRes.data?.accessToken).toBe('');

    // Try logging in with the newly registered user
    const loginRes = await mockLogin({ username: 'newuser@student.edu.vn', password: 'password123' });
    expect(loginRes.success).toBe(true);
    expect(loginRes.data?.user.email).toBe('newuser@student.edu.vn');
  });

  it('should throw 409 for duplicate email or MSSV registration', async () => {
    const registerReq = {
      fullName: 'Another User',
      email: '52100888@student.edu.vn', // Already in defaultAccounts
      studentCode: '11111111',
      password: 'password123'
    };

    await expect(mockRegister(registerReq))
      .rejects.toHaveProperty('status', 409);
  });
});
