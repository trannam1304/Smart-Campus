// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import { AuthContext } from '../../context/AuthContext';
import { ToastProvider } from '../../hooks/useToast';
import * as authApi from '../../api/authApi';

describe('RegisterPage', () => {
  const mockAuthContextValue = {
    user: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderRegisterPage = () => {
    return render(
      <ToastProvider>
        <AuthContext.Provider value={mockAuthContextValue}>
          <MemoryRouter initialEntries={['/register']}>
            <RegisterPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </ToastProvider>
    );
  };

  it('vô hiệu nút Đăng ký khi form chưa điền hoặc còn lỗi', () => {
    renderRegisterPage();

    const submitBtn = screen.getByRole('button', { name: /Tạo Tài Khoản/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('hiển thị lỗi dưới ô MSSV khi thiếu hoặc thừa số, và xóa lỗi khi hợp lệ', () => {
    renderRegisterPage();

    const mssvInput = screen.getByPlaceholderText(/Nhập MSSV/i);

    // 1. Nhập thiếu: '5210066' (7 số) và blur -> báo thiếu
    fireEvent.change(mssvInput, { target: { value: '5210066' } });
    fireEvent.blur(mssvInput);
    expect(screen.getByText('MSSV chưa đủ 8 chữ số')).toBeDefined();

    // 2. Nhập thừa: '521006666' (9 số) -> báo thừa ngay lập tức
    fireEvent.change(mssvInput, { target: { value: '521006666' } });
    expect(screen.getByText('MSSV vượt quá 8 chữ số')).toBeDefined();

    // 3. Nhập chứa chữ: '5210066a' -> báo chỉ gồm chữ số ngay lập tức
    fireEvent.change(mssvInput, { target: { value: '5210066a' } });
    expect(screen.getByText('MSSV chỉ gồm chữ số')).toBeDefined();

    // 4. Nhập đúng 8 chữ số: '52100666' -> tự xóa lỗi ngay
    fireEvent.change(mssvInput, { target: { value: '52100666' } });
    expect(screen.queryByText('MSSV chưa đủ 8 chữ số')).toBeNull();
    expect(screen.queryByText('MSSV vượt quá 8 chữ số')).toBeNull();
    expect(screen.queryByText('MSSV chỉ gồm chữ số')).toBeNull();
  });

  it('đăng ký thành công với MSSV 52100666 và mật khẩu Password123@', async () => {
    const registerSpy = vi.spyOn(authApi, 'registerApi').mockResolvedValue({
      success: true,
      data: {
        id: 'u-new',
        fullName: 'Nguyễn Văn Test',
        email: '52100666@student.edu.vn',
        studentCode: '52100666',
        role: 'STUDENT',
        faculty: 'Công Nghệ Thông Tin',
      },
    } as any);

    renderRegisterPage();

    const nameInput = screen.getByPlaceholderText(/La Thái Thành/i);
    const mssvInput = screen.getByPlaceholderText(/Nhập MSSV/i);
    const facultyInput = screen.getByPlaceholderText(/Công Nghệ Thông Tin/i);
    const emailInput = screen.getByPlaceholderText(/Email sinh viên/i);
    const pwInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Tạo Tài Khoản/i });

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Test' } });
    fireEvent.change(mssvInput, { target: { value: '52100666' } });
    fireEvent.change(facultyInput, { target: { value: 'Công Nghệ Thông Tin' } });
    fireEvent.change(emailInput, { target: { value: '52100666@student.edu.vn' } });
    fireEvent.change(pwInput, { target: { value: 'Password123@' } });

    // Khi đã nhập đủ và đúng, nút đăng ký không còn bị disabled
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledTimes(1);
      expect(registerSpy).toHaveBeenCalledWith({
        fullName: 'Nguyễn Văn Test',
        email: '52100666@student.edu.vn',
        studentCode: '52100666',
        password: 'Password123@',
        faculty: 'Công Nghệ Thông Tin',
      });
    });
  });
});
